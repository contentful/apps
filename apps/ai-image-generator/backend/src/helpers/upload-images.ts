import { PlainClientAPI, UploadProps } from 'contentful-management';
import { ImageWithStream, ImageWithUpload } from '../types';

const UPLOAD_DOMAIN: Record<string, URL> = {
  'api.contentful.com': new URL('https://s3.us-east-1.amazonaws.com/upload-api.contentful.com'),
  'api.eu.contentful.com': new URL(
    'https://s3.eu-central-1.amazonaws.com/upload-api.eu.contentful.com'
  ),
};

export class UploadImages {
  constructor(
    readonly imagesWithStreams: ImageWithStream[],
    readonly cmaClient: PlainClientAPI,
    readonly spaceId: string,
    readonly cmaHost: string
  ) {}

  async execute(): Promise<ImageWithUpload[]> {
    return Promise.all(
      this.imagesWithStreams.map((imageWithStream) => this.streamToImage(imageWithStream))
    );
  }

  private async streamToImage(imageWithStream: ImageWithStream): Promise<ImageWithUpload> {
    const uploadProps = await this.createUpload(imageWithStream);
    const url = this.urlFromUpload(uploadProps);
    const upload = { ...uploadProps, url };
    return {
      url: imageWithStream.url,
      imageType: imageWithStream.imageType,
      upload,
    };
  }

  private async createUpload(imageWithStream: ImageWithStream): Promise<UploadProps> {
    const file = imageWithStream.stream.toFormat('png'); // TODO: change to whatever is specified in imagewithstream
    return await this.cmaClient.upload.create({ spaceId: this.spaceId }, { file });
  }

  private urlFromUpload(upload: UploadProps): string {
    const uploadId = upload.sys.id;
    const uploadPath = `${this.spaceId}!upload!${uploadId}`;
    const uploadDomain = UPLOAD_DOMAIN[this.cmaHost];
    if (!uploadDomain)
      throw new Error(`Invalid cmaHost '${this.cmaHost}' -- could not find upload bucket`);
    return [uploadDomain, uploadPath].join('/');
  }
}

export const uploadImages = async (params: {
  imagesWithStreams: ImageWithStream[];
  cmaClient: PlainClientAPI;
  spaceId: string;
  cmaHost: string;
}) => {
  const { imagesWithStreams, cmaClient, spaceId, cmaHost } = params;
  const imageUploader = new UploadImages(imagesWithStreams, cmaClient, spaceId, cmaHost);
  return imageUploader.execute();
};
