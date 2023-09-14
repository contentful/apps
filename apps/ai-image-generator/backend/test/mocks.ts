import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { Adapter, PlainClientAPI, createClient } from 'contentful-management';
import OpenAI from 'openai';
import { Images } from 'openai/resources';
import sinon from 'sinon';
import { Image } from '../src/types';

export const makeMockPlainClient = (responses: any[], stub: sinon.SinonStub): PlainClientAPI => {
  for (const [callNumber, response] of responses.entries()) {
    stub.onCall(callNumber).returns(response);
  }
  const apiAdapter: Adapter = {
    makeRequest: async <T>(args: T) => {
      return stub(args);
    },
  };
  return createClient({ apiAdapter }, { type: 'plain' });
};

export const makeMockAppActionCallContext = (
  responses: any[],
  cmaStub = sinon.stub()
): AppActionCallContext => {
  return {
    cma: makeMockPlainClient(responses, cmaStub),
    appActionCallContext: {
      spaceId: 'space-id',
      environmentId: 'environment-id',
      appInstallationId: 'app-installation-id',
      userId: 'user-id',
    },
  };
};

export const mockImagesResponse: OpenAI.ImagesResponse = {
  created: 1589478378,
  data: [
    {
      url: './test/mocks/images/landscape-result-1.png',
    },
    {
      url: './test/mocks/images/landscape-result-2.png',
    },
  ],
};

export const mockPortraitAiImages: Image[] = [
  {
    url: './test/mocks/images/portrait-result-1.png',
    imageType: 'png',
  },
  {
    url: './test/mocks/images/portrait-result-2.png',
    imageType: 'png',
  },
];

export const mockLandscapeAiImages: Image[] = [
  {
    url: './test/mocks/images/landscape-result-1.png',
    imageType: 'png',
  },
  {
    url: './test/mocks/images/landscape-result-2.png',
    imageType: 'png',
  },
];

export const makeMockOpenAiApi = (
  imagesFunction: keyof Images = 'generate',
  mockResponse = mockImagesResponse
): sinon.SinonStubbedInstance<OpenAI> => {
  const stubbedClient = sinon.stub(new OpenAI({ apiKey: 'foo' }));
  const imagesFunctionStub = sinon.stub(stubbedClient.images, imagesFunction);
  imagesFunctionStub.resolves(mockResponse);
  return stubbedClient;
};
