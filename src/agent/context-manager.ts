import { buildIterationPrompt } from './prompts.js';
import { InMemoryChatHistory } from '../utils/in-memory-chat-history.js';
import { buildHistoryContext } from '../utils/history-context.js';
import { estimateTokens, CONTEXT_THRESHOLD, KEEP_TOOL_USES } from '../utils/tokens.js';
import { isContextOverflowError } from '../utils/errors.js';
import type { AgentEvent, ContextClearedEvent } from '../agent/types.js';
import { runMemoryFlush, shouldRunMemoryFlush } from '../memory/flush.js';
import type { RunContext } from './run-context.js';
import type { Scratchpad } from './scratchpad.js';
import { resolveProvider } from '../model/llm.js';

export const MAX_OVERFLOW_RETRIES = 2;
export const OVERFLOW_KEEP_TOOL_USES = 3;

export interface ContextOptions {
  model: string;
  systemPrompt: string;
  memoryEnabled: boolean;
  signal?: AbortSignal;
}

/**
 * Handles context management for the agent, including prompt building
 * and token threshold management.
 */
export class ContextManager {
  /**
   * Build initial prompt with conversation history context if available
   */
  buildInitialPrompt(
    query: string,
    inMemoryChatHistory?: InMemoryChatHistory
  ): string {
    if (!inMemoryChatHistory?.hasMessages()) {
      return query;
    }

    const recentTurns = inMemoryChatHistory.getRecentTurns();
    if (recentTurns.length === 0) {
      return query;
    }

    return buildHistoryContext({
      entries: recentTurns,
      currentMessage: query,
    });
  }

  /**
   * Build iteration prompt with full tool results and usage status.
   */
  buildIterationPrompt(query: string, scratchpad: Scratchpad): string {
    return buildIterationPrompt(
      query,
      scratchpad.getToolResults(),
      scratchpad.formatToolUsageForPrompt()
    );
  }

  /**
   * Calculate effective context threshold based on provider features (e.g. TurboQuant compression)
   */
  private getEffectiveThreshold(modelId: string): number {
    const provider = resolveProvider(modelId);
    // If backend supports KV Cache Quantization (TurboQuant), we can effectively double/triple the threshold
    if (provider.features?.kvCacheQuantization) {
      return CONTEXT_THRESHOLD * 4; // 4x expansion for TurboQuant Q4
    }
    return CONTEXT_THRESHOLD;
  }

  /**
   * Clear oldest tool results if context size exceeds threshold.
   */
  async *manageThreshold(
    ctx: RunContext,
    options: ContextOptions,
    memoryFlushState: { alreadyFlushed: boolean },
  ): AsyncGenerator<ContextClearedEvent | AgentEvent, void> {
    const fullToolResults = ctx.scratchpad.getToolResults();
    const estimatedContextTokens = estimateTokens(options.systemPrompt + ctx.query + fullToolResults);
    const threshold = this.getEffectiveThreshold(options.model);

    if (estimatedContextTokens > threshold) {
      if (
        options.memoryEnabled &&
        shouldRunMemoryFlush({
          estimatedContextTokens,
          alreadyFlushed: memoryFlushState.alreadyFlushed,
        })
      ) {
        yield { type: 'memory_flush', phase: 'start' };
        const flushResult = await runMemoryFlush({
          model: options.model,
          systemPrompt: options.systemPrompt,
          query: ctx.query,
          toolResults: fullToolResults,
          signal: options.signal,
        }).catch(() => ({ flushed: false, written: false as const }));
        memoryFlushState.alreadyFlushed = flushResult.flushed;
        yield {
          type: 'memory_flush',
          phase: 'end',
          filesWritten: flushResult.written ? [`${new Date().toISOString().slice(0, 10)}.md`] : [],
        };
      }

      const clearedCount = ctx.scratchpad.clearOldestToolResults(KEEP_TOOL_USES);
      if (clearedCount > 0) {
        memoryFlushState.alreadyFlushed = false;
        yield { type: 'context_cleared', clearedCount, keptCount: KEEP_TOOL_USES };
      }
    }
  }

  /**
   * Recover from context overflow errors by clearing oldest results and rebuilding the prompt.
   */
  handleOverflow(
    error: unknown,
    query: string,
    scratchpad: Scratchpad,
    overflowRetries: number
  ): { currentPrompt: string; event: ContextClearedEvent } | null {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (isContextOverflowError(errorMessage) && overflowRetries < MAX_OVERFLOW_RETRIES) {
      const clearedCount = scratchpad.clearOldestToolResults(OVERFLOW_KEEP_TOOL_USES);

      if (clearedCount > 0) {
        return {
          currentPrompt: this.buildIterationPrompt(query, scratchpad),
          event: { type: 'context_cleared', clearedCount, keptCount: OVERFLOW_KEEP_TOOL_USES }
        };
      }
    }

    return null;
  }
}
