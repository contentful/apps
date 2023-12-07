import * as nodeFetch from 'node-fetch';

import chai, { expect } from 'chai';
import { makeMockAppActionCallContext, makeMockOpenAiApi } from '../../test/mocks';
import { absolutePathToFile, readableStreamFromFile } from '../../test/utils';
import sinon from 'sinon';
import { OpenAiApiService } from '../services/openaiApiService';
import OpenAI from 'openai';
import sinonChai from 'sinon-chai';
import { ImageEditResult, handler } from './aiig-select-edit';
import { SysLink } from 'contentful-management';
import { APIError } from 'openai/error';
import { AppActionCallResponseError, AppActionCallResponseSuccess } from '../types';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';

chai.use(sinonChai);

describe('aiigSelectEdit.handler', () => {
  let cmaRequestStub: sinon.SinonStub;
  let context: AppActionCallContext;

  beforeEach(() => {
    cmaRequestStub = sinon.stub();
  });

  const parameters = {
    prompt: 'My image text',
    image: absolutePathToFile('./test/mocks/images/hyundai-new.png'),
    mask: absolutePathToFile('./test/mocks/images/mask.png'),
  };

  const makeUploadResponse = (uploadId: string) => ({
    sys: {
      type: 'Upload',
      id: uploadId,
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'spaceId',
        },
      },
      expiresAt: '2015-05-18T11:29:46.809Z',
      createdAt: '2015-05-18T11:29:46.809Z',
      createdBy: {
        sys: {
          type: 'Link',
          linkType: 'User',
          id: '4FLrUHftHW3v2BLi9fzfjU',
        },
      },
    },
  });

  const cmaClientMockResponses = [
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
    makeUploadResponse('uploadId-0'),
    makeUploadResponse('uploadId-1'),
    makeUploadResponse('uploadId-2'),
  ];

  let mockOpenAiApi: sinon.SinonStubbedInstance<OpenAI>;
  let openAiApiService: OpenAiApiService;
  let fetchStub: sinon.SinonStub;

  beforeEach(() => {
    mockOpenAiApi = makeMockOpenAiApi('edit');
    openAiApiService = new OpenAiApiService(mockOpenAiApi);
    sinon.stub(OpenAiApiService, 'fromOpenAiApiKey').returns(openAiApiService);

    fetchStub = sinon.stub(nodeFetch, 'default');
    fetchStub.callsFake(async (url: string): Promise<nodeFetch.Response> => {
      const fileContents = await readableStreamFromFile(url);
      return new Promise((resolve) =>
        resolve(new nodeFetch.Response(fileContents, { status: 200 }))
      );
    });

    context = makeMockAppActionCallContext(cmaClientMockResponses, cmaRequestStub);
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

    // note: this URL for now points to the "generated" URL from DALL E. we will deprecate and remove
    // this eventually (when frontend is updated)
    expect(result.data.images[0]).to.have.property(
      'url',
      './test/mocks/images/landscape-result-1.png'
    );

    // using match here to just match the beginning because there's a small race condition in tests where
    // sometimes the first image result gets assigned a different upload id
    expect(result.data.images[0].upload.url).to.match(
      /^https:\/\/s3\.us-east-1\.amazonaws\.com\/upload-api\.contentful\.com\/space-id!upload!uploadId/
    );
    expect(result.data.images[0].upload.sys.id).to.match(/^uploadId/);
  });

  it('calls the cma to get the key and create uploads', async () => {
    await handler(parameters, context);
    expect(cmaRequestStub.firstCall).to.have.been.calledWithMatch({
      entityType: 'AppInstallation',
      action: 'get',
    });
    expect(cmaRequestStub.secondCall).to.have.been.calledWithMatch({
      entityType: 'Upload',
      action: 'create',
    });
    expect(cmaRequestStub.secondCall).to.have.been.calledWithMatch({
      entityType: 'Upload',
      action: 'create',
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
        message: '403 Boom!',
        type: 'APIError',
      });
    });
  });
});
