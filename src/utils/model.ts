import { PROVIDERS } from '@/providers';

export interface Model {
  id: string;
  displayName: string;
}

interface Provider {
  displayName: string;
  providerId: string;
  models: Model[];
}

const PROVIDER_MODELS: Record<string, Model[]> = {
  openai: [
    { id: 'o3-mini', displayName: 'o3 Mini' },
    { id: 'o1', displayName: 'o1' },
    { id: 'gpt-4o', displayName: 'GPT-4o' },
    { id: 'gpt-4o-mini', displayName: 'GPT-4o Mini' },
    { id: 'gpt-4-turbo', displayName: 'GPT-4 Turbo' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-latest', displayName: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-5-haiku-latest', displayName: 'Claude 3.5 Haiku' },
    { id: 'claude-3-opus-latest', displayName: 'Claude 3 Opus' },
  ],
  google: [
    { id: 'gemini-2.0-flash-exp', displayName: 'Gemini 2.0 Flash' },
    { id: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash' },
  ],
  xai: [
    { id: 'grok-2', displayName: 'Grok 2' },
    { id: 'grok-beta', displayName: 'Grok Beta' },
  ],
  moonshot: [{ id: 'moonshot-v1-8k', displayName: 'Moonshot V1' }],
  deepseek: [
    { id: 'deepseek-chat', displayName: 'DeepSeek Chat (V3)' },
    { id: 'deepseek-reasoner', displayName: 'DeepSeek Reasoner (R1)' },
  ],
};

export const MODEL_PROVIDERS: Provider[] = PROVIDERS.map((provider) => ({
  displayName: provider.displayName,
  providerId: provider.id,
  models: PROVIDER_MODELS[provider.id] ?? [],
}));

export function getModelsForProvider(providerId: string): Model[] {
  const provider = MODEL_PROVIDERS.find((entry) => entry.providerId === providerId);
  return provider?.models ?? [];
}

export function getModelIdsForProvider(providerId: string): string[] {
  return getModelsForProvider(providerId).map((model) => model.id);
}

export function getDefaultModelForProvider(providerId: string): string | undefined {
  const providerDef = PROVIDERS.find((p) => p.id === providerId);
  if (providerDef?.defaultModel) {
    return providerDef.defaultModel;
  }
  const models = getModelsForProvider(providerId);
  return models[0]?.id;
}

export function getModelDisplayName(modelId: string): string {
  const normalizedId = modelId.replace(/^(ollama|openrouter):/, '');

  for (const provider of MODEL_PROVIDERS) {
    const model = provider.models.find((entry) => entry.id === normalizedId || entry.id === modelId);
    if (model) {
      return model.displayName;
    }
  }

  return normalizedId;
}
