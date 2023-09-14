import { PlainClientAPI, UploadProps } from 'contentful-management';
import { ImageWithStream, ImageWithUpload } from './types';

const UPLOAD_DOMAIN: Record<string, URL> = {
  us: new URL('https://s3.us-east-1.amazonaws.com/upload-api.contentful.com'),
  eu: new URL('https://s3.us-east-1.amazonaws.com/upload-api.contentful.com'),
};

export class SharpStreamsToUrl {
  constructor(
    readonly imagesWithStreams: ImageWithStream[],
    readonly cmaClient: PlainClientAPI,
    readonly spaceId: string
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

  // TODO Handle eu!
  private urlFromUpload(upload: UploadProps): string {
    const uploadId = upload.sys.id;
    const uploadPath = `${this.spaceId}!upload!${uploadId}`;
    return [UPLOAD_DOMAIN.us.toString(), uploadPath].join('/');
  }
}

export const sharpStreamsToUrl = async (params: {
  imagesWithStreams: ImageWithStream[];
  cmaClient: PlainClientAPI;
  spaceId: string;
}) => {
  const { imagesWithStreams, cmaClient, spaceId } = params;
  const sharpStreamsToUrlConverter = new SharpStreamsToUrl(imagesWithStreams, cmaClient, spaceId);
  return sharpStreamsToUrlConverter.execute();
};
