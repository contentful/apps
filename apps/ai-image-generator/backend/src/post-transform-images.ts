import * as nodeFetch from 'node-fetch';
import { Dimensions, Image, ImageWithStream } from './types';
import { constrainDimensions, toSharp } from './utils';

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

    const constrainedDimensions = constrainDimensions(this.sourceStartingDimensions, width);

    const stream = sharpImage.resize({
      width: constrainedDimensions.width,
      height: constrainedDimensions.height,
      fit: 'cover',
    });

    return { ...image, stream };
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
