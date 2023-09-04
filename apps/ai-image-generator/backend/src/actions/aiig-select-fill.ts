import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { OpenAiApiService } from '../services/openaiApiService';
import * as nodeFetch from 'node-fetch';
import { AppActionCallResponse, Image } from '../types';
import { fetchOpenAiApiKey } from '../utils';

interface AppActionCallParameters {
  prompt: string;
  image: string;
  mask: string;
}

export interface ImageEditResult {
  type: 'ImageEditResult';
  images: Image[];
}

export const handler = async (
  payload: AppActionCallParameters,
  context: AppActionCallContext
): Promise<AppActionCallResponse<ImageEditResult>> => {
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
      throw new Error(`Unable to fetch imageUrl: ${imageUrl}`);
    }

    const mask = await fetch(maskUrl);
    if (!mask) {
      throw new Error(`Unable to fetch maskUrl: ${maskUrl}`);
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
