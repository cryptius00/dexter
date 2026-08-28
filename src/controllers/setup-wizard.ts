import { checkApiKeyExists, saveApiKeyToEnv } from '../utils/env.js';
import { getSetting, setSetting } from '../utils/config.js';
import { PROVIDERS } from '../providers.js';

interface SetupStep {
  id: string;
  envVar: string;
  title: string;
  description: string;
}

export class SetupWizardController {
  private steps: SetupStep[] = [];
  private currentStepIndex = 0;
  private readonly onChange: () => void;

  constructor(onChange: () => void) {
    this.onChange = onChange;
    this.initializeSteps();
  }

  private initializeSteps() {
    // Only run the wizard once, driven by a config flag
    if (getSetting('setupComplete', false)) {
      this.currentStepIndex = -1; // -1 means complete
      return;
    }

    // Step 1: LLM Provider (Check if ANY provider has a key)
    const hasAnyLlmKey = PROVIDERS.some(p => p.apiKeyEnvVar && checkApiKeyExists(p.apiKeyEnvVar));
    if (!hasAnyLlmKey) {
      this.steps.push({
        id: 'llm',
        envVar: 'OPENAI_API_KEY', // Defaulting to OpenAI for quick start
        title: 'OpenAI API Key',
        description: 'Dexter needs a primary LLM to think. Enter your OpenAI API Key (starts with sk-...).\nIf you want to use Anthropic or Nvidia instead, skip this and use /model in the chat.'
      });
    }

    // Step 2: Financial Datasets
    if (!checkApiKeyExists('FINANCIAL_DATASETS_API_KEY')) {
      this.steps.push({
        id: 'finance',
        envVar: 'FINANCIAL_DATASETS_API_KEY',
        title: 'Financial Datasets API Key',
        description: 'Required for real-time financial data (SEC filings, prices, fundamentals).\nGet a free key at https://financialdatasets.ai'
      });
    }

    // Step 3: Web Search
    if (!checkApiKeyExists('EXASEARCH_API_KEY') && !checkApiKeyExists('PERPLEXITY_API_KEY')) {
      this.steps.push({
        id: 'search',
        envVar: 'EXASEARCH_API_KEY',
        title: 'Exa Search API Key (Optional)',
        description: 'Allows Dexter to search the web for news and real-time events.\nGet a free key at https://exa.ai'
      });
    }

    if (this.steps.length === 0) {
      this.markComplete();
    }
  }

  isComplete(): boolean {
    return this.currentStepIndex === -1 || this.currentStepIndex >= this.steps.length;
  }

  getCurrentStep(): SetupStep {
    return this.steps[this.currentStepIndex];
  }

  submit(value: string | null) {
    if (value && value.trim()) {
      const step = this.getCurrentStep();
      saveApiKeyToEnv(step.envVar, value.trim());
    }
    this.nextStep();
  }

  skip() {
    this.nextStep();
  }

  private nextStep() {
    this.currentStepIndex++;
    if (this.isComplete()) {
      this.markComplete();
    }
    this.onChange();
  }

  private markComplete() {
    this.currentStepIndex = -1;
    setSetting('setupComplete', true);
  }
}
