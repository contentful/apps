import * as nodeFetch from 'node-fetch';
import { default as sharp } from 'sharp';
import { areEqualColors, constrainDimensions, toDimensions, toRGBA, toSharp } from './utils';
import { Dimensions } from './types';

export const ERASE_COLOR: sharp.RGBA = { r: 231, g: 235, b: 238 };
export const BAR_COLOR: sharp.RGBA = { r: 0, g: 0, b: 0, alpha: 1 };
export const MAX_SIDE = 1024;

interface TransformedImages {
  image: Buffer;
  mask: Buffer;
  sourceStartingDimensions: Dimensions;
}

export class ImageTransformer {
  sourceStartingDimensions: Dimensions | undefined;

  constructor(
    readonly sourceImageResponse: nodeFetch.Response,
    readonly maskImageResponse: nodeFetch.Response
  ) {}

  async execute(): Promise<TransformedImages> {
    const { image, dimensions: sourceImageDimensions } = await this.normalizeSourceImage();
    const { height: imageHeight, width: imageWidth } = sourceImageDimensions;
    const mask = await this.normalizeMaskImage({
      width: imageWidth,
      height: imageHeight,
      eraseColor: ERASE_COLOR,
    });

    return {
      image,
      mask,
      sourceStartingDimensions: this.sourceStartingDimensions!,
    };
  }

  private async normalizeSourceImage(): Promise<{
    image: Buffer;
    dimensions: Dimensions;
  }> {
    const sharpImage = toSharp(this.sourceImageResponse.body);

    const { width: startingWidth, height: startingHeight } = await sharpImage.metadata();
    if (!startingWidth || !startingHeight)
      throw new TypeError('width or height dimensions missing from image metadata!');

    // preserve starting dimensions so we can restore to correct size at the end
    this.sourceStartingDimensions = toDimensions(startingWidth, startingHeight);

    const constrainedDimensions = constrainDimensions(this.sourceStartingDimensions, MAX_SIDE);

    this.squarifyImage(sharpImage, constrainedDimensions);

    return {
      image: await sharpImage
        .toFormat('png') // DALL-E requires a PNG file
        .toBuffer(),
      dimensions: constrainedDimensions,
    };
  }

  private async normalizeMaskImage(maskParams: {
    width: number;
    height: number;
    eraseColor: sharp.RGBA;
  }): Promise<Buffer> {
    const { width, height, eraseColor } = maskParams;
    const sharpImage = toSharp(this.maskImageResponse.body);
    const desiredMaskDimensions = { ...toDimensions(width, height) };

    // width and height are computed during the squarify step
    sharpImage.resize({
      fit: 'fill', // ignore the aspect ratio of the input and stretch to both provided dimensions
      kernel: 'nearest', // use nearest neighbor interpolation to preserve hard edges of mask erase areas
    });

    this.squarifyImage(sharpImage, desiredMaskDimensions);
    const transparentImage = await this.replaceColorWithTransparent(eraseColor, sharpImage);
    return transparentImage.toFormat('png').toBuffer();
  }

  // take an image and make it square by adding bars to the left/right or top/bottom as needed
  private squarifyImage(sharpImage: sharp.Sharp, newDimensions: Dimensions) {
    const { layout } = newDimensions;
    let { width, height } = newDimensions;

    if (layout === 'portrait') {
      // extend the width to match the height
      width = height;
    } else if (layout === 'landscape') {
      // extend the height to match the width
      height = width;
    }

    sharpImage.resize({
      width,
      height,
      fit: 'contain', // preserving aspect ratio, contain within both provided dimensions using "letterboxing" where necessary
      background: BAR_COLOR,
    });
  }

  private async replaceColorWithTransparent(
    colorToReplace: sharp.RGBA,
    sharpImage: sharp.Sharp
  ): Promise<sharp.Sharp> {
    const { data: imagePixels, info } = await sharpImage
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    for (let i = 0; i < imagePixels.length; i += 4) {
      const subarray = imagePixels.subarray(i, i + 4);
      const imagePixel = toRGBA(subarray);

      if (!areEqualColors(colorToReplace, imagePixel, { tolerance: 1 })) continue;

      // set the alpha pixel bit to 0, i.e. make the current pixel transparent
      imagePixels[i + 3] = 0;
    }

    return sharp(imagePixels, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4,
      },
    });
  }
}

export const transformImages = async (transformParams: {
  sourceImageResponse: nodeFetch.Response;
  maskImageResponse: nodeFetch.Response;
}) => {
  const { sourceImageResponse, maskImageResponse } = transformParams;
  const imageTransformer = new ImageTransformer(sourceImageResponse, maskImageResponse);
  return imageTransformer.execute();
};
