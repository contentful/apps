import * as nodeFetch from 'node-fetch';
import { Dimensions, Image, ImageWithStream } from './types';
import { constrainDimensions, difference, toSharp } from './utils';
import { Region } from 'sharp';

export class PostTransformImages {
  constructor(readonly images: Image[], readonly sourceStartingDimensions: Dimensions) {}

  async execute(): Promise<ImageWithStream[]> {
    return await Promise.all(this.images.map((image) => this.postTransformImage(image)));
  }

  async postTransformImage(image: Image): Promise<ImageWithStream> {
    const fetch = nodeFetch.default;
    const imageResponse = await fetch(image.url);
    const sharpImage = toSharp(imageResponse.body);
    const { width, height } = await sharpImage.metadata();
    if (!width || !height) {
      throw new Error('missing dimensions from provided image');
    }

    if (width !== height) {
      throw new Error('invalid image, not a square');
    }

    const originalConstrainedDimensions = constrainDimensions(this.sourceStartingDimensions, 1024);
    const extractRegion = this.computeExtractRegion(width, height, originalConstrainedDimensions);

    const stream = sharpImage.extract(extractRegion).resize({
      width: originalConstrainedDimensions.width,
      height: originalConstrainedDimensions.height,
      fit: 'cover',
    });

    return { ...image, stream };
  }

  // given the image width and height and a set of "target dimensions", compute the extract
  // region needed to get rid of the black bars before the resize operation
  private computeExtractRegion(
    imageWidth: number,
    imageHeight: number,
    targetDimensions: Dimensions
  ): Region {
    let top = 0,
      left = 0,
      width = imageWidth,
      height = imageHeight;
    const { layout, width: targetWidth, height: targetHeight } = targetDimensions;

    if (layout === 'landscape') {
      const ratio = targetWidth / width;
      const innerImageHeight = Math.floor(targetHeight / ratio);
      const totalBarHeight = difference(height, innerImageHeight);
      top = Math.floor(totalBarHeight / 2);
      height = innerImageHeight;
    } else if (layout === 'portrait') {
      const ratio = targetHeight / height;
      const innerImageWidth = Math.floor(targetWidth / ratio);
      const totalBarWidth = difference(width, innerImageWidth);
      left = Math.floor(totalBarWidth / 2);
      width = innerImageWidth;
    }

    return {
      top,
      left,
      width,
      height,
    };
  }
}

export const postTransformImages = async (params: {
  images: Image[];
  sourceStartingDimensions: Dimensions;
}) => {
  const { images, sourceStartingDimensions } = params;
  const postImageTransformer = new PostTransformImages(images, sourceStartingDimensions);
  return postImageTransformer.execute();
};
