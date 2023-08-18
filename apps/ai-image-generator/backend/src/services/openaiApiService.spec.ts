import { makeMockOpenAiApi, mockImagesGenerateResponse } from '../../test/mocks';
import { expect } from 'chai';
import { SinonStubbedInstance } from 'sinon';
import { OpenAiApiService } from './openaiApiService';
import OpenAI from 'openai';

const validCreateImageEditParams = async () => ({
  prompt: 'A dog sits by the fireplace',
  numImages: 3,
  size: '1024x1024' as const,
});

describe('OpenAiApiService', () => {
  let openAIApiService: OpenAiApiService;
  let mockOpenAiApi: SinonStubbedInstance<OpenAI>;

  beforeEach(() => {
    mockOpenAiApi = makeMockOpenAiApi();
    openAIApiService = new OpenAiApiService(mockOpenAiApi);
  });

  describe('createImageEdit', () => {
    it('returns a promise with the image edit response', async () => {
      const result = await openAIApiService.createImage(await validCreateImageEditParams());
      expect(result).to.include(mockImagesGenerateResponse.data[0]);
    });
  });
});
