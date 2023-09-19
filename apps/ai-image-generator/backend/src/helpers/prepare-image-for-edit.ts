import * as nodeFetch from 'node-fetch';
import { default as sharp } from 'sharp';
import { areEqualColors, constrainDimensions, toDimensions, toRGBA, toSharp } from '../utils';
import { Dimensions } from '../types';

export const ERASE_COLOR: sharp.RGBA = { r: 231, g: 235, b: 238 };
export const BAR_COLOR: sharp.RGBA = { r: 0, g: 0, b: 0, alpha: 1 };
export const MAX_SIDE = 1024;

interface PreparedImageData {
  image: Buffer;
  mask: Buffer;
  constrainedDimensions: Dimensions;
}

export class PrepareImageForEdit {
  constructor(
    readonly sourceImage: sharp.Sharp,
    readonly maskImage: sharp.Sharp,
    readonly constrainedDimensions: Dimensions
  ) {}

  static async build(
    sourceImageResponse: nodeFetch.Response,
    maskImageResponse: nodeFetch.Response
  ): Promise<PrepareImageForEdit> {
    const sourceImage = toSharp(sourceImageResponse.body);
    const maskImage = toSharp(maskImageResponse.body);

    const { width: startingWidth, height: startingHeight } = await sourceImage.metadata();
    if (!startingWidth || !startingHeight)
      throw new TypeError('width or height dimensions missing from image metadata!');

    const initialDimensions = toDimensions(startingWidth, startingHeight);
    const constrainedDimensions = constrainDimensions(initialDimensions, MAX_SIDE);
    return new PrepareImageForEdit(sourceImage, maskImage, constrainedDimensions);
  }

  async execute(): Promise<PreparedImageData> {
    const image = await this.normalizeSourceImage();
    const mask = await this.normalizeMaskImage();

    return {
      image,
      mask,
      constrainedDimensions: this.constrainedDimensions,
    };
  }

  private async normalizeSourceImage(): Promise<Buffer> {
    this.squarifyImage(this.sourceImage);

    return await this.sourceImage
      .toFormat('png') // DALL-E requires a PNG file
      .toBuffer();
  }

  private async normalizeMaskImage(): Promise<Buffer> {
    const eraseColor = ERASE_COLOR;

    // width and height are computed during the squarify step
    this.maskImage.resize({
      fit: 'fill', // ignore the aspect ratio of the input and stretch to both provided dimensions
      kernel: 'nearest', // use nearest neighbor interpolation to preserve hard edges of mask erase areas
    });

    this.squarifyImage(this.maskImage);
    const transparentImage = await this.replaceColorWithTransparent(eraseColor, this.maskImage);
    return transparentImage.toFormat('png').toBuffer();
  }

  // take an image and make it square by adding bars to the left/right or top/bottom as needed
  private squarifyImage(sharpImage: sharp.Sharp) {
    const { layout } = this.constrainedDimensions;
    let { width, height } = this.constrainedDimensions;

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
      .pipe(this.maskImage)
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

export const prepareImageForEdit = async (transformParams: {
  sourceImageResponse: nodeFetch.Response;
  maskImageResponse: nodeFetch.Response;
}) => {
  const { sourceImageResponse, maskImageResponse } = transformParams;
  const imagePreparer = await PrepareImageForEdit.build(sourceImageResponse, maskImageResponse);
  return imagePreparer.execute();
};
