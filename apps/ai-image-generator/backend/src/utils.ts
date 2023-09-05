import { PlainClientAPI } from 'contentful-management';
import { default as sharp } from 'sharp';

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

// note: we don't care about alpha channel here, only the RGB color
export const areEqualColors = (colorA: sharp.RGBA, colorB: sharp.RGBA): boolean => {
  // console.log({colorA, colorB})
  if (colorA.r !== colorB.r) {
    // console.log('foo')
    return false;
  }
  if (colorA.g !== colorB.g) {
    // console.log('foo')
    return false;
  }
  if (colorA.b !== colorB.b) {
    // console.log('foo')
    return false;
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
