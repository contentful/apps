import * as nodeFetch from 'node-fetch';
import { default as sharp } from 'sharp';
import { areEqualColors, toRGBA, toSharp } from './utils';

interface TransformedImages {
  image: Buffer;
  mask: Buffer;
}

export const ERASE_COLOR: sharp.RGBA = { r: 174, g: 193, b: 204 };
export const MAX_SIDE = 1024;

interface Dimensions {
  width: number;
  height: number;
}

export class ImageTransformer {
  constructor(
    private readonly sourceImageResponse: nodeFetch.Response,
    private readonly maskImageResponse: nodeFetch.Response
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
    const initialMetadata = await sharpImage.metadata();

    const { format: initialFormat } = initialMetadata;
    if (initialFormat !== 'png') {
      sharpImage.toFormat('png');
    }

    const { width, height } = await sharpImage.metadata();
    if (!width || !height)
      throw new TypeError('width or height dimensions missing from image metadata!');

    const { side, changed: dimensionsChanged } = this.constrainDimensions({ width, height });

    if (dimensionsChanged) {
      sharpImage.resize({
        width: side,
        height: side,
        fit: 'cover', // does a basic crop
      });
    }

    return {
      image: await sharpImage.toBuffer(),
      dimensions: { width: side, height: side },
    };
  }

  private constrainDimensions(dimensions: Dimensions): {
    side: number;
    changed: boolean;
  } {
    const { width, height } = dimensions;

    let side: number;
    if (width !== height) {
      side = Math.min(width, height);
    } else {
      side = width;
    }

    if (side > MAX_SIDE) {
      side = MAX_SIDE;
    }

    return {
      side,
      changed: side !== width || side !== height,
    };
  }

  private async normalizeMaskImage(maskParams: {
    width: number;
    height: number;
    eraseColor: sharp.RGBA;
  }): Promise<Buffer> {
    const { width, height, eraseColor } = maskParams;
    const sharpImage = toSharp(this.maskImageResponse.body);
    const initialMetadata = await sharpImage.metadata();
    const { width: initialWidth, height: initialHeight } = initialMetadata;

    if (width !== initialWidth || height !== initialHeight) {
      sharpImage.resize({
        width,
        height,
        fit: 'fill', // stretches to fit
      });
    }

    const transparentImage = await this.replaceColorWithTransparent(eraseColor, sharpImage);
    return transparentImage.toBuffer();
  }

  private async replaceColorWithTransparent(
    colorToReplace: sharp.RGBA,
    sharpImage: sharp.Sharp
  ): Promise<sharp.Sharp> {
    const metadata = await sharpImage.metadata();
    const { hasAlpha } = metadata;

    if (!hasAlpha) return sharpImage;

    const { data: imagePixels, info } = await sharpImage
      .raw()
      .toBuffer({ resolveWithObject: true });

    // image "pixels" are sets of four integers in a row, ie [red, blue, green, alpha]. so we
    // iterate over the image pixels in batches of 4
    for (let i = 0; i < imagePixels.length; i += 4) {
      // just take the current "batch" of four pixels and convert to RGBA
      const imagePixel = toRGBA(imagePixels.subarray(i, i + 3));

      if (areEqualColors(colorToReplace, imagePixel)) continue;

      // set the alpha pixel bit to 0, i.e. make the current pixel transparent
      imagePixels[i + 3] = 0;
    }

    // return a new sharp image built off the transformed raw buffer
    return sharp(imagePixels, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4,
      },
    }).toFormat('png');
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
