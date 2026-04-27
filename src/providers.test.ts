import { describe, test, expect } from 'bun:test';
import { getProviderById, resolveProvider } from './providers.js';

describe('providers', () => {
  describe('getProviderById', () => {
    test('returns the correct provider for a valid ID (anthropic)', () => {
      const provider = getProviderById('anthropic');
      expect(provider).toBeDefined();
      expect(provider?.id).toBe('anthropic');
      expect(provider?.displayName).toBe('Anthropic');
    });

    test('returns the correct provider for a valid ID (openai)', () => {
      const provider = getProviderById('openai');
      expect(provider).toBeDefined();
      expect(provider?.id).toBe('openai');
      expect(provider?.displayName).toBe('OpenAI');
    });

    test('returns undefined for a non-existent ID', () => {
      const provider = getProviderById('non-existent');
      expect(provider).toBeUndefined();
    });
  });

  describe('resolveProvider', () => {
    test('resolves to anthropic for models starting with claude-', () => {
      const provider = resolveProvider('claude-3-5-sonnet');
      expect(provider.id).toBe('anthropic');
    });

    test('resolves to google for models starting with gemini-', () => {
      const provider = resolveProvider('gemini-1.5-pro');
      expect(provider.id).toBe('google');
    });

    test('resolves to ollama for models starting with ollama:', () => {
      const provider = resolveProvider('ollama:llama3');
      expect(provider.id).toBe('ollama');
    });

    test('resolves to openai for models with no matching prefix', () => {
      const provider = resolveProvider('gpt-4o');
      expect(provider.id).toBe('openai');
    });
  });
});
