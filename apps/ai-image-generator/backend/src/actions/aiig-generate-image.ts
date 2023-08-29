import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { PlainClientAPI } from 'contentful-management';
import { OpenAiApiService } from '../services/openaiApiService';
import { AppActionCallResponse, Image } from '../types';

interface AppActionCallParameters {
  prompt: string;
}

export interface ImageCreationResult {
  type: 'ImageCreationResult';
  images: Image[];
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
): Promise<AppActionCallResponse<ImageCreationResult>> => {
  const {
    cma,
    appActionCallContext: { appInstallationId },
  } = context;

  let images: Image[];

  try {
    const openAiApiKey = await fetchOpenAiApiKey(cma, appInstallationId);
    const openAiApiService = OpenAiApiService.fromOpenAiApiKey(openAiApiKey);

    const { prompt } = payload;
    const openAiImages = await openAiApiService.createImage({
      prompt,
      numImages: 4,
      size: '1024x1024',
    });
    images = openAiImages
      .map((image) => ({ url: image.url, imageType: 'png' }))
      .filter((image): image is Image => !!image.url);
  } catch (e) {
    if (!(e instanceof Error)) {
      return {
        ok: false,
        errors: [
          {
            message: 'Unknown error occurred',
            type: 'UnknownError',
          },
        ],
      };
    }
    return {
      ok: false,
      errors: [
        {
          message: e.message,
          type: e.constructor.name,
        },
      ],
    };
  }
  return {
    ok: true,
    data: {
      type: 'ImageCreationResult',
      images,
    },
  };
};
