import { vi } from 'vitest';
import { mockChannels } from './mockChannels';
import { AppInstallationParameters } from '@customTypes/configPage';

const mockParameters: AppInstallationParameters = {
  tenantId: 'abc-123',
  orgName: 'Company ABC',
  orgLogo: 'https://example.image/squareLogo',
  authenticatedUsername: 'person1@companyabc.com',
  notifications: [],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValue({
      tenantId: 'tenantId',
      notifications: [
        {
          channel: mockChannels[0],
          contentTypeId: 'blogPost',
          selectedEvents: {
            'ContentManagement.Entry.archive': false,
            'ContentManagement.Entry.create': false,
            'ContentManagement.Entry.delete': false,
            'ContentManagement.Entry.publish': false,
            'ContentManagement.Entry.unarchive': false,
            'ContentManagement.Entry.unpublish': false,
          },
        },
      ],
    }),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
    onConfigurationCompleted: vi.fn(),
    isInstalled: vi.fn().mockReturnValue(true),
  },
  parameters: {
    instance: [],
    installation: mockParameters,
  },
  ids: {
    app: 'test-app',
    space: 'xyz789',
    environment: 'master',
  },
  hostnames: {
    webapp: 'app.contentful.com',
  },
  cma: {
    contentType: {
      getMany: vi.fn().mockReturnValueOnce({}),
    },
    appActionCall: {
      createWithResponse: vi.fn(),
    },
  },
  notifier: {
    error: vi.fn(),
  },
};

export { mockSdk, mockParameters };
