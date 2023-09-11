import { PlainClientAPI } from 'contentful-management';
import { default as sharp } from 'sharp';

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

const difference = (a: number, b: number): number => {
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
