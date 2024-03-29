import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import {
  Adapter,
  AppInstallationProps,
  PlainClientAPI,
  SysLink,
  createClient,
} from 'contentful-management';
import sinon from 'sinon';
import { AppInstallationParameters } from '../src/types';

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

export const makeMockFetchResponse = (
  body: object,
  headers: Record<string, string> = {}
): Response => {
  const responseBody = JSON.stringify(body);
  return new Response(responseBody, { headers });
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
      cmaHost: 'api.contentful.com',
      uploadHost: 'upload.contentful.com',
    },
  };
};

export const mockAppInstallationParameters: AppInstallationParameters = {
  vercelAccessToken: 'vercel-access-token',
  selectedProject: 'selected-project-id',
  contentTypePreviewPathSelections: [{ contentType: 'blog', previewPath: 'test-blog-path' }],
};

export const makeMockAppInstallation = (
  parameters = mockAppInstallationParameters
): AppInstallationProps => ({
  sys: {
    type: 'AppInstallation',
    appDefinition: {} as SysLink,
    environment: {} as SysLink,
    space: {} as SysLink,
    version: 1,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  parameters,
});
