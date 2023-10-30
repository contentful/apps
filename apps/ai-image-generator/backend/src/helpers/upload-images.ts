import { PlainClientAPI, UploadProps } from 'contentful-management';
import { ImageWithStream, ImageWithUpload } from '../types';
import sharp from 'sharp';
import { toDimensions } from '../utils';

const UPLOAD_DOMAIN: Record<string, URL> = {
  'upload.contentful.com': new URL('https://s3.us-east-1.amazonaws.com/upload-api.contentful.com'),
  'upload.eu.contentful.com': new URL(
    'https://s3.eu-west-1.amazonaws.com/upload-api.eu.contentful.com'
  ),
};

export class UploadImages {
  constructor(
    readonly imagesWithStreams: ImageWithStream[],
    readonly cmaClient: PlainClientAPI,
    readonly spaceId: string,
    readonly environmentId: string,
    readonly uploadHost: string
  ) {}

  async execute(): Promise<ImageWithUpload[]> {
    return Promise.all(
      this.imagesWithStreams.map((imageWithStream) => this.streamToImage(imageWithStream))
    );
  }

  private async streamToImage(imageWithStream: ImageWithStream): Promise<ImageWithUpload> {
    const file = imageWithStream.stream.toFormat('png'); // TODO: change to whatever is specified in imagewithstream
    const metadata = await this.calculateImageUploadMetadata(file);
    const { size, dimensions } = metadata;
    const uploadProps = await this.createUpload(file);
    const url = this.urlFromUpload(uploadProps);
    const upload = { ...uploadProps, url };
    return {
      url: imageWithStream.url,
      imageType: imageWithStream.imageType,
      dimensions,
      size,
      upload,
    };
  }

  private async calculateImageUploadMetadata(file: sharp.Sharp) {
    const fileCloneBuffer = await file.clone().toBuffer();
    const metadata = await sharp(fileCloneBuffer).metadata();
    const dimensions = toDimensions(metadata.width, metadata.height);
    const size = metadata.size;
    if (!size) {
      throw new Error('Missing size from provided upload image');
    }

    return { dimensions, size };
  }

  private async createUpload(file: sharp.Sharp): Promise<UploadProps> {
    return await this.cmaClient.upload.create(
      { spaceId: this.spaceId, environmentId: this.environmentId },
      { file }
    );
  }

  private urlFromUpload(upload: UploadProps): string {
    const uploadId = upload.sys.id;
    const uploadPath = `${this.spaceId}!upload!${uploadId}`;
    const uploadDomain = UPLOAD_DOMAIN[this.uploadHost];
    if (!uploadDomain)
      throw new Error(`Invalid uploadHost '${this.uploadHost}' -- could not find upload bucket`);
    return [uploadDomain, uploadPath].join('/');
  }
}

export const uploadImages = async (params: {
  imagesWithStreams: ImageWithStream[];
  cmaClient: PlainClientAPI;
  spaceId: string;
  environmentId: string;
  uploadHost: string;
}) => {
  const { imagesWithStreams, cmaClient, spaceId, environmentId, uploadHost } = params;
  const imageUploader = new UploadImages(
    imagesWithStreams,
    cmaClient,
    spaceId,
    environmentId,
    uploadHost
  );
  return imageUploader.execute();
};
