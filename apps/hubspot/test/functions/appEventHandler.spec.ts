import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '../../functions/appEventHandler';
import { createClient } from 'contentful-management';
import ConfigEntryService from '../../src/utils/ConfigEntryService';

vi.mock('contentful-management', () => ({
  createClient: vi.fn(),
}));

describe('app event handler', () => {
  const mockCma = {
    contentType: {
      get: vi.fn(),
      unpublish: vi.fn(),
      delete: vi.fn(),
    },
    entry: {
      unpublish: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  };

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
    (createClient as any).mockReturnValue(mockCma);
    global.fetch = vi.fn();
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

    const mockConfigEntry = {
      fields: {
        connectedFields: {
          'en-US': {
            'test-entry-id': [
              {
                fieldId: 'testField',
                moduleId: 'test-module-id',
              },
            ],
            'another-entry-id': [
              {
                fieldId: 'anotherField',
                moduleId: 'another-module-id',
              },
            ],
          },
        },
      },
    };

    const getConnectedFieldsMock = vi
      .spyOn(ConfigEntryService.prototype, 'getConnectedFields')
      .mockResolvedValue(mockConfigEntry.fields.connectedFields['en-US'] as any);
    const updateConfigMock = vi
      .spyOn(ConfigEntryService.prototype, 'updateConfig')
      .mockResolvedValue({} as any);

    await handler(event as any, mockContext as any);

    expect(getConnectedFieldsMock).toHaveBeenCalled();
    expect(updateConfigMock).toHaveBeenCalled();

    expect(updateConfigMock).toHaveBeenCalledWith({
      'another-entry-id': [
        {
          fieldId: 'anotherField',
          moduleId: 'another-module-id',
        },
      ],
    });
  });
});
