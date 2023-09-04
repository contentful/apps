import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { Adapter, PlainClientAPI, createClient } from 'contentful-management';
import OpenAI from 'openai';
import { Images } from 'openai/resources';
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';

/* `path` path to file, relative to project root */
export const readStreamForFile = (filePath: string): fs.ReadStream => {
  const absolutePath = absolutePathToFile(filePath);
  return fs.createReadStream(absolutePath);
};

export const absolutePathToFile = (filePath: string): string => {
  return path.resolve(process.cwd(), filePath);
};

export const arrayBufferFromFile = async (filepath: string): Promise<ArrayBuffer> => {
  const readStream = readStreamForFile(filepath);

  const buffers: any[] = [];
  for await (const data of readStream) {
    buffers.push(data);
  }
  return Buffer.concat(buffers);
};

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

export const mockImagesResponse: OpenAI.ImagesResponse = {
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
  imagesFunction: keyof Images = 'generate',
  mockResponse = mockImagesResponse
): sinon.SinonStubbedInstance<OpenAI> => {
  const stubbedClient = sinon.stub(new OpenAI({ apiKey: 'foo' }));
  const imagesFunctionStub = sinon.stub(stubbedClient.images, imagesFunction);
  imagesFunctionStub.resolves(mockResponse);
  return stubbedClient;
};
