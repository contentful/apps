import OpenAI from 'openai';

interface CreateImageParams {
  prompt: OpenAI.ImageGenerateParams['prompt'];
  numImages: OpenAI.ImageGenerateParams['n'];
  size: OpenAI.ImageGenerateParams['size'];
}

interface EditImageParams {
  image: OpenAI.ImageEditParams['image'];
  mask: OpenAI.ImageEditParams['mask'];
  prompt: OpenAI.ImageEditParams['prompt'];
  numImages: OpenAI.ImageEditParams['n'];
  size: OpenAI.ImageEditParams['size'];
}

export class OpenAiApiService {
  constructor(private readonly openAiApiClient: OpenAI) {}

  static fromOpenAiApiKey(openAiApiKey: string): OpenAiApiService {
    const openAiApiClient = new OpenAI({
      apiKey: openAiApiKey,
    });
    return new OpenAiApiService(openAiApiClient);
  }

  async createImage(params: CreateImageParams): Promise<OpenAI.Images.Image[]> {
    const { prompt, numImages: n, size } = params;
    const response = await this.openAiApiClient.images.generate({ prompt, n, size });
    return response.data ?? [];
  }

  async editImage(params: EditImageParams): Promise<OpenAI.Images.Image[]> {
    const { prompt, numImages: n, size, image, mask } = params;
    const response = await this.openAiApiClient.images.edit({
      prompt,
      n,
      size,
      image,
      mask,
    });
    return response.data ?? [];
  }
}
