import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { Adapter, PlainClientAPI, createClient } from 'contentful-management';
import OpenAI from 'openai';
import sinon from 'sinon';

export const makeMockPlainClient = <T>(response: T, stub: sinon.SinonStub): PlainClientAPI => {
  const apiAdapter: Adapter = {
    makeRequest: async <T>(args: T) => {
      return stub.returns(response)(args);
    },
  };
  return createClient({ apiAdapter }, { type: 'plain' });
};

export const makeMockAppActionCallContext = <T>(
  response: T,
  cmaStub = sinon.stub()
): AppActionCallContext => {
  return {
    cma: makeMockPlainClient(response, cmaStub),
    appActionCallContext: {
      spaceId: 'space-id',
      environmentId: 'environment-id',
      appInstallationId: 'app-installation-id',
      userId: 'user-id',
    },
  };
};

export const mockImagesGenerateResponse: OpenAI.ImagesResponse = {
  created: 1589478378,
  data: [
    {
      url: 'https://placekitten.com/g/1024/1024',
    },
    {
      url: 'https://placekitten.com/g/1024/1024',
    },
    {
      url: 'https://placekitten.com/g/1024/1024',
    },
  ],
};

export const makeMockOpenAiApi = (
  mockResponse = mockImagesGenerateResponse
): sinon.SinonStubbedInstance<OpenAI> => {
  const stubbedClient = sinon.stub(new OpenAI({ apiKey: 'foo' }));
  const generateImageStub = sinon.stub(stubbedClient.images, 'generate');
  generateImageStub.resolves(mockResponse);
  return stubbedClient;
};
