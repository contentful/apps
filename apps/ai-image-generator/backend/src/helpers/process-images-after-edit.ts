import * as nodeFetch from 'node-fetch';
import { Dimensions, Image, ImageWithStream } from '../types';
import { difference, toSharp } from '../utils';
import sharp, { Region } from 'sharp';
import OpenAI from 'openai';

export class ProcessImagesAfterEdit {
  constructor(
    readonly openAiImages: OpenAI.Images.Image[],
    readonly initialSourceDimensions: Dimensions
  ) {}

  async execute(): Promise<ImageWithStream[]> {
    return await Promise.all(this.images.map((image) => this.processImage(image)));
  }

  // OpenAI images type may or may not have a url
  get images(): Image[] {
    return this.openAiImages
      .map((image) => ({ url: image.url, imageType: 'png' })) // TODO: Don't assume png
      .filter((image): image is Image => !!image.url);
  }

  // remove the black bars that were added and restore the image
  // back to its original size
  async processImage(image: Image): Promise<ImageWithStream> {
    const sharpImage = await this.toSharpImage(image);
    const { width, height } = await sharpImage.metadata();
    if (!width || !height) {
      throw new Error('missing dimensions from provided image');
    }

    if (width !== height) {
      throw new Error('invalid image, not a square');
    }

    // see https://sharp.pixelplumbing.com/api-resize#extract for explanation
    // of extract region parameters and how they work
    const extractRegion = this.computeExtractRegion(width, height);

    // important that we _extract first_ (to clip the black bars off) and then _resize
    // second_ (to restore the original image dimensions proportionally)
    const stream = sharpImage.extract(extractRegion).resize({
      width: this.initialSourceDimensions.width,
      height: this.initialSourceDimensions.height,
      fit: 'cover',
    });

    return { ...image, stream };
  }

  private async toSharpImage(image: Image): Promise<sharp.Sharp> {
    const fetch = nodeFetch.default;
    const imageResponse = await fetch(image.url);
    return toSharp(imageResponse.body);
  }

  // given the image width and height and a set of "target dimensions", compute the extract
  // region needed to get rid of the black bars before the resize operation
  private computeExtractRegion(imageWidth: number, imageHeight: number): Region {
    let top = 0,
      left = 0,
      width = imageWidth,
      height = imageHeight;
    const { layout, width: targetWidth, height: targetHeight } = this.initialSourceDimensions;

    // note: logic below is "intentionally" duplicated because abstracting it made it
    // much harder to reason about than it already is!
    if (layout === 'landscape') {
      // remove the top and bottom bars by computing the "top" offset (how far down we have to go)
      // and the "height" (how tall the extract area will be to match our starting dimensions)
      const sizeRatio = targetWidth / width;
      const innerImageHeight = Math.floor(targetHeight / sizeRatio);
      const totalBarHeight = difference(height, innerImageHeight);
      top = Math.floor(totalBarHeight / 2);
      height = innerImageHeight;
    } else if (layout === 'portrait') {
      // remove the left and right bars by computing the "left" offset (how left we have to go)
      // and the "width" (how wide the extract area will be to match our starting dimensions)
      const sizeRatio = targetHeight / height;
      const innerImageWidth = Math.floor(targetWidth / sizeRatio);
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

export const processImagesAfterEdit = async (params: {
  images: OpenAI.Images.Image[];
  initialSourceDimensions: Dimensions;
}) => {
  const { images, initialSourceDimensions } = params;
  const afterEditImageProcessor = new ProcessImagesAfterEdit(images, initialSourceDimensions);
  return afterEditImageProcessor.execute();
};
