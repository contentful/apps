import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from '../../functions/appEventHandler';
import * as appEventHandlerModule from '../../functions/appEventHandler';
import { createClient } from 'contentful-management';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { getConfigEntry, updateConfig } from '../../src/utils';

vi.mock('contentful-management', () => ({
  createClient: vi.fn(),
}));

vi.mock('@contentful/rich-text-html-renderer', () => ({
  documentToHtmlString: vi.fn(),
}));

vi.mock('../../src/utils');

describe('updateContentBlocks', () => {
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
      brazeApiKey: 'test-api-key',
      brazeEndpoint: 'https://test.braze.com',
    },
    cmaClientOptions: {},
    spaceId: 'test-space',
    environmentId: 'test-env',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as any).mockReturnValue(mockCma);
    global.fetch = vi.fn();
    vi.spyOn(appEventHandlerModule, 'updateFieldErrors').mockImplementation(vi.fn());
  });

  it('should delete the custom entry and content type on app installation deletion', async () => {
    const event = {
      headers: {
        'X-Contentful-Topic': ['AppInstallation.delete'],
      },
    };

    await handler(event as any, mockContext as any);

    expect(mockCma.entry.unpublish).toHaveBeenCalledWith({ entryId: 'brazeConfig' });
    expect(mockCma.entry.delete).toHaveBeenCalledWith({ entryId: 'brazeConfig' });
    expect(mockCma.contentType.unpublish).toHaveBeenCalledWith({
      contentTypeId: 'brazeConfig',
    });
    expect(mockCma.contentType.delete).toHaveBeenCalledWith({
      contentTypeId: 'brazeConfig',
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
                contentBlockId: 'test-block-id',
              },
            ],
          },
        },
      },
    };

    vi.mocked(getConfigEntry).mockResolvedValue(mockConfigEntry as any);

    await handler(event as any, mockContext as any);

    expect(vi.mocked(updateConfig)).toHaveBeenCalled();
  });

  it('should update content block on entry save with RichText field', async () => {
    const mockRichTextValue = { nodeType: 'document', data: {}, content: [] };
    const mockHtmlValue = '<p>Test HTML</p>';

    const event = {
      headers: {
        'X-Contentful-Topic': ['Entry.save'],
      },
      body: {
        sys: {
          id: 'test-entry-id',
          contentType: {
            sys: {
              id: 'test-content-type',
            },
          },
        },
        fields: {
          testField: {
            'en-US': mockRichTextValue,
          },
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
                contentBlockId: 'test-block-id',
              },
            ],
          },
        },
      },
    };

    vi.mocked(getConfigEntry).mockResolvedValue(mockConfigEntry as any);
    vi.mocked(documentToHtmlString).mockReturnValue(mockHtmlValue);
    mockCma.contentType.get.mockResolvedValue({
      fields: [
        {
          id: 'testField',
          type: 'RichText',
        },
      ],
    });

    await handler(event as any, mockContext as any);

    expect(documentToHtmlString).toHaveBeenCalledWith(mockRichTextValue);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://test.braze.com/content_blocks/update',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-api-key',
        },
        body: JSON.stringify({
          content_block_id: 'test-block-id',
          content: mockHtmlValue,
        }),
      })
    );
  });

  /* TODO : fix implementation
  it('should retry on failure', async () => {
    const event = {
      headers: {
        'X-Contentful-Topic': ['Entry.save'],
      },
      body: {
        sys: {
          id: 'test-entry-id',
          contentType: {
            sys: {
              id: 'test-content-type',
            },
          },
        },
        fields: {
          testField: {
            'en-US': 'test value',
          },
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
                contentBlockId: 'test-block-id',
              },
            ],
          },
        },
      },
    };

    vi.mocked(getConfigEntry).mockResolvedValue(mockConfigEntry as any);
    mockCma.contentType.get.mockResolvedValue({
      fields: [
        {
          id: 'testField',
          type: 'Text',
        },
      ],
    });

    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          message: 'Server Error',
        }),
    } as Response);

    await handler(event as any, mockContext as any);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(mockCma.entry.update).toHaveBeenCalledOnce();
  });*/

  it('should update content block for each locale on entry save', async () => {
    const event = {
      headers: {
        'X-Contentful-Topic': ['Entry.save'],
      },
      body: {
        sys: {
          id: 'test-entry-id',
          contentType: {
            sys: {
              id: 'test-content-type',
            },
          },
        },
        fields: {
          localizedField: {
            'en-US': 'English value',
            'es-ES': 'Spanish value',
          },
        },
      },
    };

    const mockConfigEntry = {
      fields: {
        connectedFields: {
          'en-US': {
            'test-entry-id': [
              {
                fieldId: 'localizedField',
                locale: 'en-US',
                contentBlockId: 'block-id-en',
              },
              {
                fieldId: 'localizedField',
                locale: 'es-ES',
                contentBlockId: 'block-id-es',
              },
            ],
          },
        },
      },
    };

    vi.mocked(getConfigEntry).mockResolvedValue(mockConfigEntry as any);
    mockCma.contentType.get.mockResolvedValue({
      fields: [
        {
          id: 'localizedField',
          type: 'Text',
        },
      ],
    });

    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );

    await handler(event as any, mockContext as any);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      'https://test.braze.com/content_blocks/update',
      expect.objectContaining({
        body: JSON.stringify({
          content_block_id: 'block-id-en',
          content: 'English value',
        }),
      })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'https://test.braze.com/content_blocks/update',
      expect.objectContaining({
        body: JSON.stringify({
          content_block_id: 'block-id-es',
          content: 'Spanish value',
        }),
      })
    );
  });
});
