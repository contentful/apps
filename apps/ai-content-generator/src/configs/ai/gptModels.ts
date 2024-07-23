import OpenAI from 'openai';

async function getGptModels(apiKey: string) {
  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  const list = await openai.models.list();

  return list.data;
}

async function getDefaultModel(apiKey: string) {
  const list = await getGptModels(apiKey);

  return list[0];
}

const defaultModelId = 'gpt-3.5-turbo';
const DEFAULT_TEXT_LIMIT = 12000;

export { getGptModels, getDefaultModel, defaultModelId, DEFAULT_TEXT_LIMIT };
