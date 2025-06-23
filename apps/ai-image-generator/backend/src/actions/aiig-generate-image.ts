import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { OpenAiApiService } from '../services/openaiApiService';
import { AppActionCallResponse, Image } from '../types';
import { fetchOpenAiApiKey } from '../utils';
import { APIError } from 'openai';

interface AppActionCallParameters {
  prompt: string;
}

export interface ImageCreationResult {
  type: 'ImageCreationResult';
  images: Image[];
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
    if (e instanceof APIError) {
      const message =
        e.type === 'invalid_request_error'
          ? `Image generation failed: Please verify that your OpenAI account has DALL-E credits available.`
          : e.message;
      return {
        ok: false,
        errors: [
          {
            message,
            type: e.constructor.name,
          },
        ],
      };
    }
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
    ok: true,
    data: {
      type: 'ImageCreationResult',
      images,
    },
  };
};
