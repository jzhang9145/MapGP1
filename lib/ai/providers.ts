import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';

// Create individual model instances with type assertions for compatibility
const chatModelInstance = isTestEnvironment
  ? chatModel
  : (openai('gpt-4o') as any);
const reasoningModelInstance = isTestEnvironment
  ? reasoningModel
  : (wrapLanguageModel({
      model: openai('o1-mini') as any,
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }) as any);
const titleModelInstance = isTestEnvironment
  ? titleModel
  : (openai('gpt-4o-mini') as any);
const artifactModelInstance = isTestEnvironment
  ? artifactModel
  : (openai('gpt-4o') as any);

export const myProvider = customProvider({
  languageModels: {
    'chat-model': chatModelInstance,
    'chat-model-reasoning': reasoningModelInstance,
    'title-model': titleModelInstance,
    'artifact-model': artifactModelInstance,
  },
});
