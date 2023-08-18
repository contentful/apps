import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { PlainClientAPI } from 'contentful-management';
import { OpenAiApiService } from '../services/openaiApiService';

interface AppActionCallParameters {
  prompt: string;
}

interface AppActionResponse {
  status: number;
  prompt: string;
  images: string[];
}

// TODO: Implement real api key fetching
async function fetchOpenAiApiKey(_cma: PlainClientAPI) {
  return 'openai-api-key';
}

async function makeOpenAiApiService(cma: PlainClientAPI): Promise<OpenAiApiService> {
  const openAiApiKey = await fetchOpenAiApiKey(cma);
  return OpenAiApiService.fromOpenAiApiKey(openAiApiKey);
}

export const handler = async (
  payload: AppActionCallParameters,
  context: AppActionCallContext,
  openAiApiService?: OpenAiApiService
): Promise<AppActionResponse> => {
  openAiApiService ??= await makeOpenAiApiService(context.cma);
  const { prompt } = payload;
  const images = await openAiApiService.createImage({
    prompt,
    numImages: 1,
    size: '1024x1024',
  });
  return {
    status: 201,
    prompt,
    images: images.map((image) => (image.url !== undefined ? image.url : '')),
  };
};
