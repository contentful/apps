import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { Adapter, PlainClientAPI, createClient } from 'contentful-management';
import sinon from 'sinon';

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
      cmaHost: 'api.contentful.com',
      uploadHost: 'upload.contentful.com',
    },
  };
};

export const mockEntry = {
  metadata: {
    tags: [],
  },
  sys: {
    space: {
      sys: {
        type: 'Link',
        linkType: 'Space',
        id: '123456',
      },
    },
    id: 'abc123',
    type: 'Entry',
    createdAt: '2023-08-25T15:10:27.806Z',
    updatedAt: '2023-09-01T00:46:53.890Z',
    environment: {
      sys: {
        id: 'staging',
        type: 'Link',
        linkType: 'Environment',
      },
    },
    createdBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: 'qwerty890',
      },
    },
    updatedBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: 'qwerty890',
      },
    },
    publishedCounter: 0,
    version: 4,
    automationTags: [],
    contentType: {
      sys: {
        type: 'Link',
        linkType: 'ContentType',
        id: 'page',
      },
    },
  },
  fields: {
    title: {
      'en-US': 'Sample Title',
    },
  },
};
