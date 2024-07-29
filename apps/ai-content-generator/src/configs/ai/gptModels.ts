import AI from '@utils/aiApi';
import { modelsBaseUrl } from './baseUrl';

async function getGptModels(apiKey: string) {
  const ai = new AI(modelsBaseUrl, apiKey);
  const models = await ai.getModels();

  return models.data;
}

async function getDefaultModel(apiKey: string) {
  const list = await getGptModels(apiKey);

  return list[0];
}

const defaultModelId = 'gpt-3.5-turbo';
const DEFAULT_TEXT_LIMIT = 12000;

export { getGptModels, getDefaultModel, defaultModelId, DEFAULT_TEXT_LIMIT };
