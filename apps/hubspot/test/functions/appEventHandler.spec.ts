import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '../../functions/appEventHandler';
import ConfigEntryService from '../../src/utils/ConfigEntryService';

const mockCma = {
  entry: {
    get: vi.fn().mockResolvedValue({
      fields: {
        connectedFields: {
          'en-US': {
            'test-entry-id': [],
          },
        },
      },
    }),
    update: vi.fn(),
  },
};

vi.mock('contentful-management', () => ({
  createClient: () => mockCma,
}));

describe('app event handler', () => {
  const mockContext = {
    appInstallationParameters: {
      hubspotAccessToken: 'test-api-key',
    },
    cmaClientOptions: {},
    spaceId: 'test-space',
    environmentId: 'test-env',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should remove the entry id from the config on entry deletion', async () => {
    const event = {
      headers: {
        'X-Contentful-Topic': ['Entry.delete'],
      },
      body: {
        sys: {
          id: 'test-entry-id',
        },
      },
    };

    const removeEntryConnectedFieldsMock = vi.spyOn(
      ConfigEntryService.prototype,
      'removeEntryConnectedFields'
    );

    await handler(event as any, mockContext as any);

    expect(removeEntryConnectedFieldsMock).toHaveBeenCalled();
    expect(removeEntryConnectedFieldsMock).toHaveBeenCalledWith(event.body.sys.id);
  });
});
