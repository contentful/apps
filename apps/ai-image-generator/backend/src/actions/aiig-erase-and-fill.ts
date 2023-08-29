console.log('prod');
import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { PlainClientAPI } from 'contentful-management';
import { OpenAiApiService } from '../services/openaiApiService';
import * as nodeFetch from 'node-fetch';

interface AppActionCallParameters {
  prompt: string;
  image: string;
  mask: string;
}

interface Image {
  url: string;
  imageType: string;
}

interface ActionError {
  type: string;
  message: string;
  details?: Record<string, any>;
}

// TODO: Create generic versions of success and error
export interface AppActionCallResponseSuccess {
  ok: true;
  data: {
    type: 'ImageEditResult';
    images: Image[];
  };
}

export interface AppActionCallResponseError {
  ok: false;
  errors: ActionError[];
}

type AppActionCallResponse = AppActionCallResponseSuccess | AppActionCallResponseError;

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
): Promise<AppActionCallResponse> => {
  const {
    cma,
    appActionCallContext: { appInstallationId },
  } = context;

  let images: Image[];

  try {
    const openAiApiKey = await fetchOpenAiApiKey(cma, appInstallationId);
    const openAiApiService = OpenAiApiService.fromOpenAiApiKey(openAiApiKey);
    const { prompt, image: imageUrl, mask: maskUrl } = payload;
    const fetch = nodeFetch.default;

    const image = await fetch(imageUrl);
    if (!image) {
      throw new Error(`'imageUrl' ${imageUrl} didn't work`);
    }

    const mask = await fetch(maskUrl);
    if (!mask) {
      throw new Error(`'maskUrl' ${maskUrl} didn't work`);
    }

    const openAiImages = await openAiApiService.editImage({
      prompt,
      image,
      mask,
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
      type: 'ImageEditResult',
      images,
    },
  };
};
