import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { OpenAiApiService } from '../services/openaiApiService';
import * as nodeFetch from 'node-fetch';
import { AppActionCallResponse, Image, ImageWithUpload } from '../types';
import { fetchOpenAiApiKey } from '../utils';
import { toFile } from 'openai';
import { transformImages } from '../transform-images';
import { postTransformImages } from '../post-transform-images';
import { sharpStreamsToUrl } from '../upload-images';

interface AppActionCallParameters {
  prompt: string;
  image: string;
  mask: string;
}

export interface ImageEditResult {
  type: 'ImageEditResult';
  images: ImageWithUpload[];
}

export const handler = async (
  payload: AppActionCallParameters,
  context: AppActionCallContext
): Promise<AppActionCallResponse<ImageEditResult>> => {
  const {
    cma,
    appActionCallContext: { appInstallationId, spaceId },
  } = context;

  let images: ImageWithUpload[];

  try {
    const openAiApiKey = await fetchOpenAiApiKey(cma, appInstallationId);
    const openAiApiService = OpenAiApiService.fromOpenAiApiKey(openAiApiKey);
    const { prompt, image: imageUrl, mask: maskUrl } = payload;
    const fetch = nodeFetch.default;

    const sourceImageResponse = await fetch(imageUrl);
    if (!sourceImageResponse) {
      throw new Error(`Unable to fetch imageUrl: ${imageUrl}`);
    }

    const maskImageResponse = await fetch(maskUrl);
    if (!maskImageResponse) {
      throw new Error(`Unable to fetch maskUrl: ${maskUrl}`);
    }

    const {
      mask: maskBuffer,
      image: imageBuffer,
      sourceStartingDimensions,
    } = await transformImages({
      sourceImageResponse,
      maskImageResponse,
    });

    const openAiImages = await openAiApiService.editImage({
      prompt,
      image: await toFile(imageBuffer),
      mask: await toFile(maskBuffer),
      numImages: 3,
      size: '1024x1024',
    });

    const rawImages = openAiImages
      .map((image) => ({ url: image.url, imageType: 'png' }))
      .filter((image): image is Image => !!image.url);

    const processedImages = await postTransformImages({
      images: rawImages,
      sourceStartingDimensions,
    });

    images = await sharpStreamsToUrl({
      imagesWithStreams: processedImages,
      cmaClient: cma,
      spaceId,
    });
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
