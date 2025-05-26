import { makeMockOpenAiApi, mockImagesResponse } from '../../test/mocks';
import { readStreamForFile } from '../../test/utils';
import { expect } from 'chai';
import { SinonStubbedInstance } from 'sinon';
import { OpenAiApiService } from './openaiApiService';
import OpenAI from 'openai';

const validCreateImageParams = () => ({
  prompt: 'A dog sits by the fireplace',
  numImages: 3,
  size: '1024x1024' as const,
});

const validEditImageParms = () => ({
  image: readStreamForFile('./test/mocks/images/hyundai-new.png'),
  mask: readStreamForFile('./test/mocks/images/mask.png'),
  prompt: 'A dog sits by the fireplace',
  numImages: 3,
  size: '512x512' as const,
});

describe('OpenAiApiService', () => {
  let openAIApiService: OpenAiApiService;
  let mockOpenAiApi: SinonStubbedInstance<OpenAI>;

  describe('createImage', () => {
    beforeEach(() => {
      mockOpenAiApi = makeMockOpenAiApi();
      openAIApiService = new OpenAiApiService(mockOpenAiApi);
    });

    it('returns a promise with the image edit response', async () => {
      const result = await openAIApiService.createImage(validCreateImageParams());
      expect(result).to.include(mockImagesResponse.data?.[0]);
    });
  });

  describe('editImage', () => {
    beforeEach(() => {
      mockOpenAiApi = makeMockOpenAiApi('edit');
      openAIApiService = new OpenAiApiService(mockOpenAiApi);
    });

    it('returns a promise with the image edit response', async () => {
      const result = await openAIApiService.editImage(validEditImageParms());
      expect(result).to.include(mockImagesResponse.data?.[0]);
    });
  });
});
