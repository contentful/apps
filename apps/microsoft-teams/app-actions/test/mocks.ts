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

export const mockNotification = {
  channel: {
    id: 'abc-123',
    name: 'Corporate Marketing',
    teamId: '789-def',
    teamName: 'Marketing Department',
    tenantId: '9876-5432',
  },
  contentTypeId: 'blogPost',
  isEnabled: true,
  selectedEvents: {
    publish: true,
    unpublish: false,
    create: false,
    delete: false,
    archive: false,
    unarchive: false,
  },
};

export const mockAppInstallationParameters: AppInstallationParameters = {
  tenantId: 'tenant-id',
  notifications: [mockNotification],
};

export const mockAppInstallation: AppInstallationProps = {
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
    tenantId: 'tenant-id',
    notifications: [mockNotification],
  },
};
