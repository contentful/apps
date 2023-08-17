import OpenAI from 'openai';

interface CreateImageParams {
  prompt: OpenAI.ImageGenerateParams['prompt'];
  numImages: OpenAI.ImageGenerateParams['n'];
  size: OpenAI.ImageGenerateParams['size'];
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
    const imageEditResponse = await this.openAiApiClient.images.generate({ prompt, n, size });
    return imageEditResponse.data;
  }
}
