import { expect } from 'chai';
import { handler } from './aiig-generate-image';
import {
  makeMockAppActionCallContext,
  makeMockOpenAiApi,
  mockImagesGenerateResponse,
} from '../../test/mocks';
import sinon from 'sinon';
import { OpenAiApiService } from '../services/openaiApiService';
import OpenAI from 'openai';

describe('aiigGenerateImage.handler', () => {
  const parameters = {
    prompt: 'My image text',
  };
  const context = makeMockAppActionCallContext();

  let mockOpenAiApi: sinon.SinonStubbedInstance<OpenAI>;
  let openAiApiService: OpenAiApiService;

  beforeEach(() => {
    mockOpenAiApi = makeMockOpenAiApi();
    openAiApiService = new OpenAiApiService(mockOpenAiApi);
  });

  it('returns the images result', async () => {
    const result = await handler(parameters, context, openAiApiService);
    expect(result).to.have.property('status', 201);
    expect(result).to.have.property('prompt', parameters.prompt);
    expect(result.images).to.include(mockImagesGenerateResponse.data[0].url);
  });
});
