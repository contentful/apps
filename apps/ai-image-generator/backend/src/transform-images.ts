import * as nodeFetch from 'node-fetch';
import { default as sharp } from 'sharp';
import { areEqualColors, toRGBA, toSharp } from './utils';

export const ERASE_COLOR: sharp.RGBA = { r: 231, g: 235, b: 238 };
export const BAR_COLOR: sharp.RGBA = { r: 0, g: 0, b: 0, alpha: 1 };
export const MAX_SIDE = 1024;

interface TransformedImages {
  image: Buffer;
  mask: Buffer;
}

interface Dimensions {
  width: number;
  height: number;
  ratio: number;
  layout: 'portrait' | 'landscape' | 'square';
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
    this.sourceStartingDimensions = this.toDimensions(startingWidth, startingHeight);

    const constrainedDimensions = this.constrainDimensions(this.sourceStartingDimensions);

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
    const desiredMaskDimensions = { ...this.toDimensions(width, height) };

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
    const { width, height, layout } = newDimensions;

    sharpImage.resize({
      width,
      height,
    });

    // we only need to pad the image for portraits and landscapes -- squares are fine as is
    if (layout === 'portrait') {
      // figure out how many "extra" width pixels we need to make this a square
      const extraWidth = height - width;

      // put half of those extra pixels on the left
      const left = Math.floor(extraWidth / 2);

      // put the rest on the right (in case the number is odd, right will get an extra pixel)
      const right = extraWidth - left;

      sharpImage.extend({
        left,
        right,
        background: BAR_COLOR,
      });
    } else if (layout === 'landscape') {
      // figure out how many "extra" height pixels we need to make this a square
      const extraHeight = width - height;

      // put half of those extra pixels on the top
      const top = Math.floor(extraHeight / 2);

      // put the rest on the bottom (in case the number is odd, bottom will get an extra pixel)
      const bottom = extraHeight - top;
      sharpImage.extend({
        top,
        bottom,
        background: BAR_COLOR,
      });
    }
  }

  // force the provided dimensions within the maximum side constraints
  private constrainDimensions(dimensions: Dimensions): Dimensions {
    const { width: startingWidth, height: startingHeight, layout, ratio } = dimensions;

    let width: number;
    let height: number;

    switch (layout) {
      case 'portrait':
        height = Math.min(startingHeight, MAX_SIDE);
        const computedWidth = Math.round(height * ratio);
        width = Math.min(computedWidth, MAX_SIDE);
        break;
      case 'landscape':
        width = Math.min(startingWidth, MAX_SIDE);
        const computedHeight = Math.round(width / ratio);
        height = Math.min(computedHeight, MAX_SIDE);
        break;
      case 'square':
        width = Math.min(startingWidth, MAX_SIDE);
        height = Math.min(startingHeight, MAX_SIDE);
        break;
    }

    return this.toDimensions(width, height);
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

  private toDimensions(width: number | undefined, height: number | undefined): Dimensions {
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
