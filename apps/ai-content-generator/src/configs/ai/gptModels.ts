import OpenAI from 'openai';

async function getGptModels(apiKey: string) {
  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  const list = await openai.models.list();

  console.log('List', list.data);
  return list.data;
}

async function getDefaultModel(apiKey: string) {
  const list = await getGptModels(apiKey);

  return list[0];
}

const defaultModelId = 'text-davinci-003';
const DEFAULT_TEXT_LIMIT = 12000;

export { getGptModels, getDefaultModel, defaultModelId, DEFAULT_TEXT_LIMIT };
