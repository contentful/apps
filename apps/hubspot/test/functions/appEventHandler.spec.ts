import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from '../../functions/appEventHandler';
import { createClient } from 'contentful-management';
import ConfigEntryService from '../../src/utils/ConfigEntryService';

vi.mock('contentful-management', () => ({
  createClient: vi.fn(),
}));

vi.mock('@contentful/rich-text-html-renderer', () => ({
  documentToHtmlString: vi.fn(),
}));

vi.mock('../../src/utils');

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

  it('should delete the custom entry and content type on app installation deletion', async () => {
    const event = {
      headers: {
        'X-Contentful-Topic': ['AppInstallation.delete'],
      },
    };

    await handler(event as any, mockContext as any);

    expect(mockCma.entry.unpublish).toHaveBeenCalledWith({ entryId: 'hubspotConfig' });
    expect(mockCma.entry.delete).toHaveBeenCalledWith({ entryId: 'hubspotConfig' });
    expect(mockCma.contentType.unpublish).toHaveBeenCalledWith({
      contentTypeId: 'hubspotConfig',
    });
    expect(mockCma.contentType.delete).toHaveBeenCalledWith({
      contentTypeId: 'hubspotConfig',
    });
  });

  it('should delete the custom entry and content type when they are not published', async () => {
    const event = {
      headers: {
        'X-Contentful-Topic': ['AppInstallation.delete'],
      },
    };

    mockCma.entry.unpublish.mockRejectedValue(new Error('Entry is already unpublished'));
    mockCma.contentType.unpublish.mockRejectedValue(
      new Error('Content type is already unpublished')
    );

    await handler(event as any, mockContext as any);

    expect(mockCma.entry.unpublish).toHaveBeenCalledWith({ entryId: 'hubspotConfig' });
    expect(mockCma.entry.delete).toHaveBeenCalledWith({ entryId: 'hubspotConfig' });
    expect(mockCma.contentType.unpublish).toHaveBeenCalledWith({
      contentTypeId: 'hubspotConfig',
    });
    expect(mockCma.contentType.delete).toHaveBeenCalledWith({
      contentTypeId: 'hubspotConfig',
    });
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
          },
        },
      },
    };

    const getConfigEntryMock = vi
      .spyOn(ConfigEntryService.prototype, 'getConfigEntry')
      .mockResolvedValue(mockConfigEntry as any);
    const updateConfigMock = vi
      .spyOn(ConfigEntryService.prototype, 'updateConfig')
      .mockResolvedValue({} as any);

    await handler(event as any, mockContext as any);

    expect(getConfigEntryMock).toHaveBeenCalled();
    expect(updateConfigMock).toHaveBeenCalled();
  });
});
