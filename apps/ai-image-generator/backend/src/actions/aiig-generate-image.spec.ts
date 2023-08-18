import chai, { expect } from 'chai';
import {
  makeMockAppActionCallContext,
  makeMockOpenAiApi,
  mockImagesGenerateResponse,
} from '../../test/mocks';
import sinon from 'sinon';
import { OpenAiApiService } from '../services/openaiApiService';
import OpenAI from 'openai';
import sinonChai from 'sinon-chai';
import { handler } from './aiig-generate-image';
import { AppInstallationProps, SysLink } from 'contentful-management';

chai.use(sinonChai);

describe('aiigGenerateImage.handler', () => {
  const cmaRequestStub = sinon.stub();
  const parameters = {
    prompt: 'My image text',
  };
  const mockAppInstallation: AppInstallationProps = {
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
  };
  const context = makeMockAppActionCallContext(mockAppInstallation, cmaRequestStub);

  let mockOpenAiApi: sinon.SinonStubbedInstance<OpenAI>;
  let openAiApiService: OpenAiApiService;

  beforeEach(() => {
    mockOpenAiApi = makeMockOpenAiApi();
    openAiApiService = new OpenAiApiService(mockOpenAiApi);
    sinon.stub(OpenAiApiService, 'fromOpenAiApiKey').returns(openAiApiService);
  });

  it('returns the images result', async () => {
    const result = await handler(parameters, context);
    expect(result).to.have.property('status', 201);
    expect(result).to.have.property('prompt', parameters.prompt);
    expect(result.images).to.include(mockImagesGenerateResponse.data[0].url);
  });

  it('calls the cma to get the api key from app installation params', async () => {
    await handler(parameters, context);
    expect(cmaRequestStub).to.have.been.calledWithMatch({
      entityType: 'AppInstallation',
      action: 'get',
    });
  });
});
