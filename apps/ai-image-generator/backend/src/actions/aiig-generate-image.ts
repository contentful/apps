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

async function fetchOpenAiApiKey(cma: PlainClientAPI, appInstallationId: string): Promise<string> {
  const appInstallation = await cma.appInstallation.get({ appDefinitionId: appInstallationId });
  const appInstallationParams = appInstallation.parameters;
  if (typeof appInstallationParams === 'object' && 'apiKey' in appInstallationParams) {
    return appInstallationParams['apiKey'];
  } else {
    throw new Error('No OpenAI API Key was found in the installation parameters');
  }
}

export const handler = async (
  payload: AppActionCallParameters,
  context: AppActionCallContext
): Promise<AppActionResponse> => {
  const {
    cma,
    appActionCallContext: { appInstallationId },
  } = context;
  const openAiApiKey = await fetchOpenAiApiKey(cma, appInstallationId);
  const openAiApiService = OpenAiApiService.fromOpenAiApiKey(openAiApiKey);

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
