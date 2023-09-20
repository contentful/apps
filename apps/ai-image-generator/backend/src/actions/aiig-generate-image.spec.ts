import chai, { expect } from 'chai';
import {
  makeMockAppActionCallContext,
  makeMockOpenAiApi,
  mockImagesResponse,
} from '../../test/mocks';
import sinon from 'sinon';
import { OpenAiApiService } from '../services/openaiApiService';
import OpenAI from 'openai';
import sinonChai from 'sinon-chai';
import { ImageCreationResult, handler } from './aiig-generate-image';
import { AppInstallationProps, SysLink } from 'contentful-management';
import { APIError } from 'openai/error';
import { AppActionCallResponseError, AppActionCallResponseSuccess } from '../types';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';

chai.use(sinonChai);

describe('aiigGenerateImage.handler', () => {
  let context: AppActionCallContext;
  let cmaRequestStub: sinon.SinonStub;

  const parameters = {
    prompt: 'My image text',
  };
  const cmaClientMockResponses: [AppInstallationProps] = [
    {
      sys: {
        type: 'AppInstallation',
        appDefinition: {} as SysLink,
        environment: {} as SysLink,
        space: {} as SysLink,
        version: 1,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
      parameters: {
        apiKey: 'openai-api-key',
      },
    },
  ];

  let mockOpenAiApi: sinon.SinonStubbedInstance<OpenAI>;
  let openAiApiService: OpenAiApiService;

  beforeEach(() => {
    mockOpenAiApi = makeMockOpenAiApi();
    openAiApiService = new OpenAiApiService(mockOpenAiApi);
    sinon.stub(OpenAiApiService, 'fromOpenAiApiKey').returns(openAiApiService);
    cmaRequestStub = sinon.stub();
    context = makeMockAppActionCallContext(cmaClientMockResponses, cmaRequestStub);
  });

  it('returns the images result', async () => {
    const result = (await handler(
      parameters,
      context
    )) as AppActionCallResponseSuccess<ImageCreationResult>;
    expect(result).to.have.property('ok', true);
    expect(result.data).to.have.property('type', 'ImageCreationResult');
    expect(result.data.images).to.deep.include({
      url: mockImagesResponse.data[0].url,
      imageType: 'png',
    });
  });

  it('calls the cma to get the api key from app installation params', async () => {
    await handler(parameters, context);
    expect(cmaRequestStub).to.have.been.calledWithMatch({
      entityType: 'AppInstallation',
      action: 'get',
    });
  });

  describe('when an error is thrown', async () => {
    beforeEach(() => {
      const generateImageStub = mockOpenAiApi.images.generate as sinon.SinonStub;
      generateImageStub.throws(new APIError(403, undefined, 'Boom!', undefined));
    });

    it('returns the images result', async () => {
      const result = (await handler(parameters, context)) as AppActionCallResponseError;
      console.log('ERRORS', result.errors);
      expect(result).to.have.property('ok', false);
      expect(result.errors).to.deep.include({
        message: '403 Boom!',
        type: 'APIError',
      });
    });
  });
});
