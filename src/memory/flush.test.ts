import { describe, test, expect, mock, beforeEach } from 'bun:test';

// ---------------------------------------------------------------------------
// 1. Setup Mocks BEFORE Importing the Module Under Test
// ---------------------------------------------------------------------------

const mockCallLlm = mock();
const mockAppendDailyMemory = mock();

// Mock LLM module to prevent side-effect imports failing (like @langchain/openai)
mock.module('../model/llm.js', () => ({
  callLlm: mockCallLlm,
  DEFAULT_MODEL: 'gpt-5.4',
}));

// Mock MemoryManager
mock.module('./index.js', () => ({
  MemoryManager: {
    get: async () => ({
      appendDailyMemory: mockAppendDailyMemory,
    }),
  },
}));

// Mock Token module to avoid its side effects and provide constants
mock.module('../utils/tokens.js', () => ({
  CONTEXT_THRESHOLD: 100_000,
  estimateTokens: (text: string) => Math.ceil(text.length / 3.5),
}));

// Mock providers to avoid its potential side effects
mock.module('../providers.js', () => ({
  resolveProvider: () => ({ id: 'openai', displayName: 'OpenAI' }),
  getProviderById: () => ({ id: 'openai', displayName: 'OpenAI' }),
}));

// ---------------------------------------------------------------------------
// 2. Import the module under test
// ---------------------------------------------------------------------------
// We use dynamic import to ensure mocks are applied first in Bun's module system
const { shouldRunMemoryFlush, runMemoryFlush, MEMORY_FLUSH_TOKEN } = await import('./flush.js');
const { CONTEXT_THRESHOLD } = await import('../utils/tokens.js');

// ---------------------------------------------------------------------------
// 3. Tests
// ---------------------------------------------------------------------------

describe('shouldRunMemoryFlush', () => {
  test('returns false when alreadyFlushed is true', () => {
    expect(shouldRunMemoryFlush({
      estimatedContextTokens: CONTEXT_THRESHOLD + 1,
      alreadyFlushed: true
    })).toBe(false);
  });

  test('returns false when estimatedContextTokens is below threshold', () => {
    expect(shouldRunMemoryFlush({
      estimatedContextTokens: CONTEXT_THRESHOLD - 1,
      alreadyFlushed: false
    })).toBe(false);
  });

  test('returns true when estimatedContextTokens is at threshold', () => {
    expect(shouldRunMemoryFlush({
      estimatedContextTokens: CONTEXT_THRESHOLD,
      alreadyFlushed: false
    })).toBe(true);
  });

  test('returns true when estimatedContextTokens is above threshold', () => {
    expect(shouldRunMemoryFlush({
      estimatedContextTokens: CONTEXT_THRESHOLD + 1,
      alreadyFlushed: false
    })).toBe(true);
  });

  test('respects a custom threshold', () => {
    const customThreshold = 500;
    expect(shouldRunMemoryFlush({
      estimatedContextTokens: customThreshold - 1,
      threshold: customThreshold,
      alreadyFlushed: false
    })).toBe(false);

    expect(shouldRunMemoryFlush({
      estimatedContextTokens: customThreshold,
      threshold: customThreshold,
      alreadyFlushed: false
    })).toBe(true);
  });
});

describe('runMemoryFlush', () => {
  const params = {
    model: 'gpt-4o',
    systemPrompt: 'You are a helpful assistant.',
    query: 'What is the capital of France?',
    toolResults: 'France capital is Paris.',
  };

  beforeEach(() => {
    mockCallLlm.mockClear();
    mockAppendDailyMemory.mockClear();
  });

  test('handles successful summary and writes to memory', async () => {
    const summary = 'Durable fact: Paris is the capital of France.';
    mockCallLlm.mockResolvedValue({ response: summary });

    const result = await runMemoryFlush(params);

    expect(result).toEqual({
      flushed: true,
      written: true,
      content: summary
    });
    expect(mockAppendDailyMemory).toHaveBeenCalledWith(expect.stringContaining(summary));
    expect(mockAppendDailyMemory).toHaveBeenCalledWith(expect.stringContaining('## Pre-compaction memory flush'));
  });

  test('handles NO_MEMORY_TO_FLUSH token correctly', async () => {
    mockCallLlm.mockResolvedValue({ response: MEMORY_FLUSH_TOKEN });

    const result = await runMemoryFlush(params);

    expect(result).toEqual({
      flushed: true,
      written: false
    });
    expect(mockAppendDailyMemory).not.toHaveBeenCalled();
  });

  test('handles empty response correctly', async () => {
    mockCallLlm.mockResolvedValue({ response: '' });

    const result = await runMemoryFlush(params);

    expect(result).toEqual({
      flushed: true,
      written: false
    });
    expect(mockAppendDailyMemory).not.toHaveBeenCalled();
  });
});
