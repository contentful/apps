import { PlainClientAPI, UploadProps } from 'contentful-management';
import sharp from 'sharp';
import path from 'path';
import { Image } from './types';

const UPLOAD_DOMAIN: Record<string, URL> = {
  us: new URL('https://s3.us-east-1.amazonaws.com/upload-api.contentful.com'),
  eu: new URL('https://s3.us-east-1.amazonaws.com/upload-api.contentful.com'),
};

export class SharpStreamsToUrl {
  constructor(
    readonly imageStreams: sharp.Sharp[],
    readonly cmaClient: PlainClientAPI,
    readonly spaceId: string
  ) {}

  async execute(): Promise<Image[]> {
    return Promise.all(this.imageStreams.map((imageStream) => this.streamToImage(imageStream)));
  }

  private async streamToImage(imageStream: sharp.Sharp): Promise<Image> {
    const upload = await this.createUpload(imageStream);
    const url = this.urlFromUpload(upload);
    return {
      url,
      imageType: 'png',
    };
  }

  private async createUpload(imageStream: sharp.Sharp): Promise<UploadProps> {
    return await this.cmaClient.upload.create(
      { spaceId: this.spaceId },
      { file: imageStream.toFormat('png') }
    );
  }

  // TODO Handle eu!
  private urlFromUpload(upload: UploadProps): string {
    const uploadId = upload.sys.id;
    const uploadPath = `${this.spaceId}!upload!${uploadId}`;
    return [UPLOAD_DOMAIN.us.toString(), uploadPath].join('/');
  }
}

export const sharpStreamsToUrl = async (params: {
  imageStreams: sharp.Sharp[];
  cmaClient: PlainClientAPI;
  spaceId: string;
}) => {
  const { imageStreams, cmaClient, spaceId } = params;
  const sharpStreamsToUrlConverter = new SharpStreamsToUrl(imageStreams, cmaClient, spaceId);
  return sharpStreamsToUrlConverter.execute();
};
