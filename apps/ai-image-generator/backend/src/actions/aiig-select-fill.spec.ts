import * as nodeFetch from 'node-fetch';

import chai, { expect } from 'chai';
import {
  absolutePathToFile,
  arrayBufferFromFile,
  makeMockAppActionCallContext,
  makeMockOpenAiApi,
  mockImagesResponse,
} from '../../test/mocks';
import sinon from 'sinon';
import { OpenAiApiService } from '../services/openaiApiService';
import OpenAI from 'openai';
import sinonChai from 'sinon-chai';
import { ImageEditResult, handler } from './aiig-select-fill';
import { AppInstallationProps, SysLink } from 'contentful-management';
import { APIError } from 'openai/error';
import { AppActionCallResponseError, AppActionCallResponseSuccess } from '../types';

chai.use(sinonChai);

describe('aiigEraseAndFill.handler', () => {
  const cmaRequestStub = sinon.stub();
  const parameters = {
    prompt: 'My image text',
    image: absolutePathToFile('./test/mocks/images/hyundai-new.png'),
    mask: absolutePathToFile('./test/mocks/images/mask.png'),
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
  let fetchStub: sinon.SinonStub;

  beforeEach(() => {
    mockOpenAiApi = makeMockOpenAiApi('edit');
    openAiApiService = new OpenAiApiService(mockOpenAiApi);
    sinon.stub(OpenAiApiService, 'fromOpenAiApiKey').returns(openAiApiService);

    fetchStub = sinon.stub(nodeFetch, 'default');
    fetchStub.callsFake(async (url: string): Promise<nodeFetch.Response> => {
      const fileContents = await arrayBufferFromFile(url);
      return new Promise((resolve) =>
        resolve(new nodeFetch.Response(fileContents, { status: 200 }))
      );
    });
  });

  afterEach(() => {
    fetchStub.restore();
  });

  it('returns the images result', async () => {
    const result = (await handler(
      parameters,
      context
    )) as AppActionCallResponseSuccess<ImageEditResult>;
    expect(result).to.have.property('ok', true);
    expect(result.data).to.have.property('type', 'ImageEditResult');
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
      const imagesStub = mockOpenAiApi.images.edit as sinon.SinonStub;
      imagesStub.throws(new APIError(403, undefined, 'Boom!', undefined));
    });

    it('returns the images result', async () => {
      const result = (await handler(parameters, context)) as AppActionCallResponseError;
      expect(result).to.have.property('ok', false);
      expect(result.errors).to.deep.include({
        message: 'Boom!',
        type: 'APIError',
      });
    });
  });
});
