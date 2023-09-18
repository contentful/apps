import { PlainClientAPI } from 'contentful-management';
import { default as sharp } from 'sharp';
import { Dimensions } from './types';

export interface AreEqualColorOpts {
  tolerance?: number;
  compareAlpha?: boolean;
}

export async function fetchOpenAiApiKey(
  cma: PlainClientAPI,
  appInstallationId: string
): Promise<string> {
  const appInstallation = await cma.appInstallation.get({ appDefinitionId: appInstallationId });
  const appInstallationParams = appInstallation.parameters;
  if (typeof appInstallationParams === 'object' && 'apiKey' in appInstallationParams) {
    return appInstallationParams['apiKey'];
  } else {
    throw new Error('No OpenAI API Key was found in the installation parameters');
  }
}

export const toSharp = (imageStream: NodeJS.ReadableStream): sharp.Sharp => {
  const sharpStream = sharp({ failOn: 'none' });
  return imageStream.pipe(sharpStream);
};

export const difference = (a: number, b: number): number => {
  return Math.abs(a - b);
};

// note: we don't care about alpha channel here, only the RGB color
export const areEqualColors = (
  colorA: sharp.RGBA,
  colorB: sharp.RGBA,
  opts: AreEqualColorOpts = {}
): boolean => {
  const { tolerance, compareAlpha } = { tolerance: 0, compareAlpha: false, ...opts };
  if (difference(colorA.r!, colorB.r!) > tolerance) {
    return false;
  }
  if (difference(colorA.b!, colorB.b!) > tolerance) {
    return false;
  }
  if (difference(colorA.g!, colorB.g!) > tolerance) {
    return false;
  }
  if (compareAlpha) {
    if (difference(colorA.alpha!, colorB.alpha!) > tolerance) {
      return false;
    }
  }
  return true;
};

export const toRGBA = (rawPixels: Buffer): sharp.RGBA => {
  return {
    r: rawPixels[0],
    g: rawPixels[1],
    b: rawPixels[2],
    alpha: rawPixels[3],
  };
};

export const toDimensions = (width: number | undefined, height: number | undefined): Dimensions => {
  if (typeof width === 'undefined' || typeof height === 'undefined') {
    throw new Error('no width or height');
  }
  const ratio = width / height;
  let layout: Dimensions['layout'];

  if (ratio > 1) {
    layout = 'landscape';
  } else if (ratio > 0 && ratio < 1) {
    layout = 'portrait';
  } else if (ratio === 1) {
    layout = 'square';
  } else {
    throw new Error('invalid ratio provided');
  }

  return {
    width,
    height,
    ratio,
    layout,
  };
};

// force the provided dimensions within the maximum side constraints
export const constrainDimensions = (dimensions: Dimensions, maxSide: number): Dimensions => {
  const { width: startingWidth, height: startingHeight, layout, ratio } = dimensions;

  let width: number;
  let height: number;

  switch (layout) {
    case 'portrait':
      height = Math.min(startingHeight, maxSide);
      const computedWidth = Math.round(height * ratio);
      width = Math.min(computedWidth, maxSide);
      break;
    case 'landscape':
      width = Math.min(startingWidth, maxSide);
      const computedHeight = Math.round(width / ratio);
      height = Math.min(computedHeight, maxSide);
      break;
    case 'square':
      width = Math.min(startingWidth, maxSide);
      height = Math.min(startingHeight, maxSide);
      break;
  }

  return toDimensions(width, height);
};
