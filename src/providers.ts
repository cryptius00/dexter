/**
 * Canonical provider registry — single source of truth for all provider metadata.
 * When adding a new provider, add a single entry here; all other modules derive from this.
 */

export interface ProviderDef {
  /** Slug used in config/settings (e.g., 'anthropic') */
  id: string;
  /** Human-readable name (e.g., 'Anthropic') */
  displayName: string;
  /** Model name prefix used for routing (e.g., 'claude-'). Empty string for default (OpenAI). */
  modelPrefix: string;
  /** Environment variable name for API key. Omit for local providers (e.g., Ollama). */
  apiKeyEnvVar?: string;
  /** Fast model variant for lightweight tasks like summarization. */
  fastModel?: string;
  /** Default model ID for this provider when selected. */
  defaultModel?: string;
  /** Specialized reasoning model for planning and complex analysis. */
  reasoningModel?: string;
  /** Features supported by the inference engine (e.g. TurboQuant/PolarQuant) */
  features?: {
    kvCacheQuantization?: boolean;
    streaming?: boolean;
  };
}

export const PROVIDERS: ProviderDef[] = [
  {
    id: 'openai',
    displayName: 'OpenAI',
    modelPrefix: '',
    apiKeyEnvVar: 'OPENAI_API_KEY',
    fastModel: 'gpt-4o-mini',
    defaultModel: 'gpt-4o',
    reasoningModel: 'o3-mini',
  },
  {
    id: 'anthropic',
    displayName: 'Anthropic',
    modelPrefix: 'claude-',
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    fastModel: 'claude-3-5-haiku-latest',
    defaultModel: 'claude-3-5-sonnet-latest',
    reasoningModel: 'claude-3-5-sonnet-latest',
  },
  {
    id: 'google',
    displayName: 'Google',
    modelPrefix: 'gemini-',
    apiKeyEnvVar: 'GOOGLE_API_KEY',
    fastModel: 'gemini-1.5-flash',
    defaultModel: 'gemini-1.5-pro',
  },
  {
    id: 'xai',
    displayName: 'xAI',
    modelPrefix: 'grok-',
    apiKeyEnvVar: 'XAI_API_KEY',
    fastModel: 'grok-beta',
    defaultModel: 'grok-2',
  },
  {
    id: 'moonshot',
    displayName: 'Moonshot',
    modelPrefix: 'kimi-',
    apiKeyEnvVar: 'MOONSHOT_API_KEY',
    fastModel: 'moonshot-v1-8k',
    defaultModel: 'moonshot-v1-8k',
  },
  {
    id: 'deepseek',
    displayName: 'DeepSeek',
    modelPrefix: 'deepseek-',
    apiKeyEnvVar: 'DEEPSEEK_API_KEY',
    fastModel: 'deepseek-chat',
    defaultModel: 'deepseek-chat',
    reasoningModel: 'deepseek-reasoner',
  },
  {
    id: 'openrouter',
    displayName: 'OpenRouter',
    modelPrefix: 'openrouter:',
    apiKeyEnvVar: 'OPENROUTER_API_KEY',
    fastModel: 'openrouter:openai/gpt-4o-mini',
  },
  {
    id: 'ollama',
    displayName: 'Ollama',
    modelPrefix: 'ollama:',
    features: {
      kvCacheQuantization: true, // Support for q4_k/q8_0 cache compression
      streaming: true,
    },
  },
];

const defaultProvider = PROVIDERS.find((p) => p.id === 'openai')!;

/**
 * Resolve the provider for a given model name based on its prefix.
 * Falls back to OpenAI when no prefix matches.
 */
export function resolveProvider(modelName: string): ProviderDef {
  return (
    PROVIDERS.find((p) => p.modelPrefix && modelName.startsWith(p.modelPrefix)) ??
    defaultProvider
  );
}

/**
 * Look up a provider by its slug (e.g., 'anthropic', 'google').
 */
export function getProviderById(id: string): ProviderDef | undefined {
  return PROVIDERS.find((p) => p.id === id);
}
