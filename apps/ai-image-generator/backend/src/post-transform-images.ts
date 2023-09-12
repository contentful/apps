import sharp from 'sharp';
import * as nodeFetch from 'node-fetch';
import { Dimensions, Image } from './types';
import { constrainDimensions, toSharp } from './utils';

export class PostTransformImages {
  constructor(readonly images: Image[], readonly sourceStartingDimensions: Dimensions) {}

  async execute(): Promise<sharp.Sharp[]> {
    return await Promise.all(this.images.map((image) => this.postTransformImage(image)));
  }

  async postTransformImage(image: Image): Promise<sharp.Sharp> {
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

    return sharpImage.resize({
      width: constrainedDimensions.width,
      height: constrainedDimensions.height,
      fit: 'cover',
    });
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
