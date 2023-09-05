import * as nodeFetch from 'node-fetch';
import { default as sharp } from 'sharp';
import { areEqualColors, toRGBA, toSharp } from './utils';

export const ERASE_COLOR: sharp.RGBA = { r: 231, g: 235, b: 238 };
export const MAX_SIDE = 1024;

interface TransformedImages {
  image: Buffer;
  mask: Buffer;
}

interface Dimensions {
  width: number;
  height: number;
}

interface ConstrainedDimensions {
  side: number;
  changed: boolean;
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

    const { format: initialFormat } = await sharpImage.metadata();
    if (initialFormat !== 'png') {
      sharpImage.toFormat('png');
    }

    // we get the width and height separately, after the initial format,
    // because certain file types don't have width and height. doing this check
    // after we enforce PNG ensures we have values for width and height
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

  private constrainDimensions(dimensions: Dimensions): ConstrainedDimensions {
    const { width, height } = dimensions;

    const side = Math.min(width, height, MAX_SIDE);
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
    let sharpImage = toSharp(this.maskImageResponse.body);

    const { width: initialWidth, height: initialHeight } = await sharpImage.metadata();
    if (width !== initialWidth || height !== initialHeight) {
      sharpImage = sharpImage.resize({
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
    const { data: imagePixels, info } = await sharpImage
      .raw()
      .toBuffer({ resolveWithObject: true });

    for (let i = 0; i < imagePixels.length; i += 4) {
      const imagePixel = toRGBA(imagePixels.subarray(i, i + 4));
      console.log(imagePixel);

      if (!areEqualColors(colorToReplace, imagePixel)) continue;

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
