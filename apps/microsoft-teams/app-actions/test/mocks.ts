import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import {
  Adapter,
  AppInstallationProps,
  CollectionProp,
  ContentTypeProps,
  LocaleProps,
  PlainClientAPI,
  SysLink,
  UserProps,
  createClient,
} from 'contentful-management';
import sinon from 'sinon';
import { AppInstallationParameters, EntryEvent, TeamInstallation } from '../src/types';
import { Channel } from '../../types';

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

export const mockEntry = {
  metadata: {
    tags: [],
  },
  sys: {
    space: {
      sys: {
        type: 'Link',
        linkType: 'Space',
        id: 'space-id',
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
        id: 'blogPost',
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
    id: 'channel-id',
    name: 'Corporate Marketing',
    teamId: 'team-id',
    teamName: 'Marketing Department',
    tenantId: 'tenant-id',
  },
  contentTypeId: 'blogPost',
  contentTypeName: 'Blog Post',
  selectedEvents: {
    'ContentManagement.Entry.publish': true,
    'ContentManagement.Entry.unpublish': true,
    'ContentManagement.Entry.create': true,
    'ContentManagement.Entry.delete': true,
    'ContentManagement.Entry.archive': true,
    'ContentManagement.Entry.unarchive': true,
  },
};

export const mockNotificationUnsubscribed = {
  ...mockNotification,
  selectedEvents: {
    'ContentManagement.Entry.publish': false,
    'ContentManagement.Entry.unpublish': false,
    'ContentManagement.Entry.create': false,
    'ContentManagement.Entry.delete': false,
    'ContentManagement.Entry.archive': false,
    'ContentManagement.Entry.unarchive': false,
  },
};

export const mockNotificationDifferentTenant = {
  ...mockNotification,
  channel: {
    id: 'abc-123',
    name: 'Corporate Marketing',
    teamId: '789-def',
    teamName: 'Marketing Department',
    tenantId: 'different-tenant-id',
  },
};

export const mockNotificationDifferentContentType = {
  ...mockNotification,
  contentTypeId: 'productPage',
};

export const mockAppInstallationParameters: AppInstallationParameters = {
  tenantId: 'tenant-id',
  orgName: 'Company ABC',
  orgLogo: 'https://example.image/squareLogo',
  authenticatedUsername: 'person1@companyabc.com',
  notifications: [
    mockNotification,
    mockNotificationUnsubscribed,
    mockNotificationDifferentTenant,
    mockNotificationDifferentContentType,
  ],
};

export const mockAppInstallation: AppInstallationProps = {
  sys: {
    type: 'AppInstallation',
    appDefinition: {} as SysLink,
    environment: {} as SysLink,
    space: {} as SysLink,
    organization: {} as SysLink,
    version: 1,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  parameters: mockAppInstallationParameters,
};

export const mockEntryEvent: EntryEvent = {
  entry: mockEntry,
  topic: 'ContentManagement.Entry.archive',
  eventDatetime: '2024-01-22T16:31:13Z',
};

export const mockUser: UserProps = {
  firstName: 'Gavin',
  lastName: 'Matthews',
  avatarUrl:
    'https://www.gravatar.com/avatar/b0972a295bbbc6ee8e39c251b7b64fa8?s=50&d=https%3A%2F%2Favatars.contentful.com%2Finitials%2Fv1%2FGM%2F50',
  email: 'gavin.matthews@contentful.com',
  cookieConsentData:
    '{"userInterface":{"rawConsentRecord":"JC7spqnPc21RVPV-DjFYHVPe3CAywMjM4izwHFehtrv8Ukajr7-P8wL5ejUbIfJaehbPNIrXugT7eK0qsgW0ImlB3RMOakbUoXgK8aGvcTw5C4qtveRQBQaQcGoEUdW_mPqETuosBD186P3c0uh6HDTdknFa5fPgIPoafXAEfvQKfmhMCeeyi3rMVRAKg3VUqDdKpWeBCW-O6j9STvFbHZOi6X1Di-og4J3yesEkXx_-K9iYVUGaotEhWE6f1bBN5rIKwOjNWeMsEbxlU9g37tXKizfx0XgvrGjhJw==","expirationDate":null,"uuid":"23df1eac-dbbe-4c6b-86ac-416df8b8c698","consentRecord":{"ESSENTIAL":"ACCEPT","STORAGE":"ACCEPT","MARKETING":"ACCEPT","PERSONALIZATION":"ACCEPT","ANALYTICS":"ACCEPT","OPT_OUT":"DENY"}},"compose":{"consentRecord":{"ESSENTIAL":"ACCEPT","STORAGE":"ACCEPT","MARKETING":"ACCEPT","PERSONALIZATION":"ACCEPT","ANALYTICS":"ACCEPT","OPT_OUT":"DENY"},"uuid":"8b4a8f50-5c79-447b-a4ba-25e804d1d7f4","expirationDate":null,"rawConsentRecord":"2-GS1x216bGxOYIZsOZHe7tG4cM54ty3SsHSqUnhEA-jn7awiBDzy70eJc_RtFURZtvEWsyKqpCXce6432LakAxm-AJdHdcsSaqGSml8jTEVDJHElbDK0vYIjXdPzVgfObcIdd9FwJL1_96FowMwhyurUdpoPiQLPdZjJRZkMzdf-PM4m6bMWH2T4_9ik065f3F7ed6tP0y1fy8LdXZOTdphIzKJ5NhklHAKSyGxwxB5UbdcC-9RhJesgnDuu71qoRbbR4p_fXM0tXi3sWaYrx5m72CiFMdCPrbvLg=="},"content-ops":{"consentRecord":{"ESSENTIAL":"ACCEPT","STORAGE":"ACCEPT","MARKETING":"ACCEPT","PERSONALIZATION":"ACCEPT","ANALYTICS":"ACCEPT","OPT_OUT":"DENY"},"uuid":"e08415d7-867b-4ab8-bdaa-44282c8bbb79","expirationDate":null,"rawConsentRecord":"qHazPxCwuAZxmVystwPsh9oIFT_ouCBIFElcUUbn4-l6yfhTVdF2ho-YEwrrQxEpS4oeHDAzVvoOns0-GAdfVLXtEQKwe9USLGw3kfOS-SX_TvfKXKA8VRNfjaChvq-NOAjVdybxL67C4tbKCChiGPMS5YrBreSRnaenQzb82WrZK2YUEmOZbPShyuhyw3XWyA8Z57_qsDtILyXnX3HQOcVoTvRc3DTugPEawUU8ecOq9wk2w4yhwW6z59ywAMtD09sOsGu2-uq-RraInDE-wq_Qhinald1QmTNvTw=="}}',
  activated: true,
  signInCount: 487,
  confirmed: true,
  '2faEnabled': false,
  sys: {
    type: 'User',
    id: '7J9Yl0eiCbWcz1a6dZz2ou',
    version: 502,
    createdAt: '2022-06-30T14:29:36Z',
    updatedAt: '2024-01-19T20:54:05Z',
  },
};

export const mockLocale: LocaleProps = {
  name: 'English (United States)',
  internal_code: 'en-US',
  code: 'en-US',
  fallbackCode: null,
  default: true,
  contentManagementApi: true,
  contentDeliveryApi: true,
  optional: false,
  sys: {
    type: 'Locale',
    id: '3565zHU7cDsYRdz0LcFDEc',
    version: 1,
    space: {
      sys: {
        type: 'Link',
        linkType: 'Space',
        id: '89g1bvvv07u0',
      },
    },
    environment: {
      sys: {
        type: 'Link',
        linkType: 'Environment',
        id: 'master',
      },
    },
    createdBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: '2D8ljY8aA7f32Wxhcf8lxD',
      },
    },
    createdAt: '2024-01-04T16:58:23Z',
    updatedBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: '2D8ljY8aA7f32Wxhcf8lxD',
      },
    },
    updatedAt: '2024-01-04T16:58:23Z',
  },
};

export const mockLocaleCollection: CollectionProp<LocaleProps> = {
  sys: {
    type: 'Array',
  },
  total: 2,
  skip: 0,
  limit: 100,
  items: [
    {
      ...mockLocale,
      default: false,
      name: 'French (Canada)',
      code: 'fr-CA',
      fallbackCode: 'en-US',
      internal_code: 'en-US',
    },
    mockLocale,
  ],
};

export const mockContentType: ContentTypeProps = {
  sys: {
    type: 'ContentType',
    id: 'blogPost',
    version: 1,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    environment: {} as SysLink,
    space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
  },
  name: 'Blog Post',
  description: 'description',
  displayField: 'title',
  fields: [
    {
      id: 'title',
      name: 'Title',
      type: 'Symbol',
      localized: false,
      required: false,
      validations: [],
      disabled: false,
      omitted: false,
    },
  ],
};

export const mockTeamInstallations: TeamInstallation[] = [
  {
    conversationReferenceKey: '333_444@thread.tacv2',
    teamDetails: {
      id: 'ed57f808-c14f-4a53-bf53-e36de0783385',
      name: 'Marketing Team',
    },
    channelInfos: [
      {
        id: '19:e3a386bd1e0f4e00a286b4e86b0cfbe9@thread.tacv2',
        name: 'General',
      },
      {
        id: '19:e2a385bd1e0f4e00a286b4e86b0cfbe9@thread.tacv2',
        name: 'Branding',
      },
      {
        id: '19:39ca79ab85df4520af8a459bd1abaea1@thread.tacv2',
        name: 'Corporate Marketing',
      },
    ],
  },
  {
    conversationReferenceKey: '111_222@thread.tacv2',
    teamDetails: {
      id: '1a91e6ef-ac80-4b9b-9989-d3416c38671c',
      name: 'Sales Team',
    },
    channelInfos: [
      {
        id: '19:3bccfda604454e63bd839399e6752ba3@thread.tacv2',
        name: 'General',
      },
    ],
  },
];

export const mockTeamInstallation: TeamInstallation = mockTeamInstallations[0];

export const mockChannels: Channel[] = [
  {
    id: '19:e3a386bd1e0f4e00a286b4e86b0cfbe9@thread.tacv2',
    name: 'General',
    teamId: 'ed57f808-c14f-4a53-bf53-e36de0783385',
    teamName: 'Marketing Team',
    tenantId: '666e56a6-1f2a-47c7-b88c-1ed9e1bb8668',
  },
  {
    id: '19:e2a385bd1e0f4e00a286b4e86b0cfbe9@thread.tacv2',
    name: 'Branding',
    teamId: 'ed57f808-c14f-4a53-bf53-e36de0783385',
    teamName: 'Marketing Team',
    tenantId: '666e56a6-1f2a-47c7-b88c-1ed9e1bb8668',
  },
  {
    id: '19:39ca79ab85df4520af8a459bd1abaea1@thread.tacv2',
    name: 'Corporate Marketing',
    teamId: 'ed57f808-c14f-4a53-bf53-e36de0783385',
    teamName: 'Marketing Team',
    tenantId: '666e56a6-1f2a-47c7-b88c-1ed9e1bb8668',
  },
  {
    id: '19:3bccfda604454e63bd839399e6752ba3@thread.tacv2',
    name: 'General',
    teamId: '1a91e6ef-ac80-4b9b-9989-d3416c38671c',
    teamName: 'Sales Team',
    tenantId: '666e56a6-1f2a-47c7-b88c-1ed9e1bb8668',
  },
];

export const mockRequestHeaders = {
  'Content-Type': 'application/json',
  'x-api-key': 'api-key',
  'X-Contentful-App': 'app-installation-id',
  'X-Contentful-Environment': 'environment-id',
  'X-Contentful-Space': 'space-id',
  'X-Contentful-User': 'user-id',
};
