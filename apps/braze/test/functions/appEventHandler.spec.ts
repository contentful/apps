import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from '../../functions/appEventHandler';
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
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );

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

  it('should update the config on save failure', async () => {
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

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://test.braze.com/content_blocks/update',
      expect.objectContaining({
        body: JSON.stringify({
          content_block_id: 'test-block-id',
          content: 'test value',
        }),
      })
    );
  });

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

  describe('field stringification in updates', () => {
    it('should stringify Symbol fields', async () => {
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
            symbolField: {
              'en-US': 'Test Symbol',
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
                  fieldId: 'symbolField',
                  contentBlockId: 'symbol-block-id',
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
            id: 'symbolField',
            type: 'Symbol',
          },
        ],
      });
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      await handler(event as any, mockContext as any);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.braze.com/content_blocks/update',
        expect.objectContaining({
          body: JSON.stringify({
            content_block_id: 'symbol-block-id',
            content: 'Test Symbol',
          }),
        })
      );
    });

    it('should stringify Integer fields', async () => {
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
            integerField: {
              'en-US': 42,
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
                  fieldId: 'integerField',
                  contentBlockId: 'integer-block-id',
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
            id: 'integerField',
            type: 'Integer',
          },
        ],
      });
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      await handler(event as any, mockContext as any);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.braze.com/content_blocks/update',
        expect.objectContaining({
          body: JSON.stringify({
            content_block_id: 'integer-block-id',
            content: '42',
          }),
        })
      );
    });

    it('should stringify Number fields', async () => {
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
            numberField: {
              'en-US': 99.99,
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
                  fieldId: 'numberField',
                  contentBlockId: 'number-block-id',
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
            id: 'numberField',
            type: 'Number',
          },
        ],
      });
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      await handler(event as any, mockContext as any);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.braze.com/content_blocks/update',
        expect.objectContaining({
          body: JSON.stringify({
            content_block_id: 'number-block-id',
            content: '99.99',
          }),
        })
      );
    });

    it('should stringify Date fields', async () => {
      const testDate = '2024-01-15T10:30:00Z';
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
            dateField: {
              'en-US': testDate,
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
                  fieldId: 'dateField',
                  contentBlockId: 'date-block-id',
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
            id: 'dateField',
            type: 'Date',
          },
        ],
      });
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      await handler(event as any, mockContext as any);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.braze.com/content_blocks/update',
        expect.objectContaining({
          body: JSON.stringify({
            content_block_id: 'date-block-id',
            content: '2024-01-15T10:30:00.000Z',
          }),
        })
      );
    });

    it('should stringify Boolean fields', async () => {
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
            booleanField: {
              'en-US': true,
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
                  fieldId: 'booleanField',
                  contentBlockId: 'boolean-block-id',
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
            id: 'booleanField',
            type: 'Boolean',
          },
        ],
      });
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      await handler(event as any, mockContext as any);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.braze.com/content_blocks/update',
        expect.objectContaining({
          body: JSON.stringify({
            content_block_id: 'boolean-block-id',
            content: 'true',
          }),
        })
      );
    });

    it('should stringify Object fields', async () => {
      const objectValue = { key: 'value', number: 123, nested: { test: true } };
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
            objectField: {
              'en-US': objectValue,
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
                  fieldId: 'objectField',
                  contentBlockId: 'object-block-id',
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
            id: 'objectField',
            type: 'Object',
          },
        ],
      });
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      await handler(event as any, mockContext as any);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.braze.com/content_blocks/update',
        expect.objectContaining({
          body: JSON.stringify({
            content_block_id: 'object-block-id',
            content: JSON.stringify(objectValue),
          }),
        })
      );
    });

    it('should skip Link fields', async () => {
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
            linkField: {
              'en-US': { sys: { type: 'Link', linkType: 'Asset', id: 'asset-id' } },
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
                  fieldId: 'linkField',
                  contentBlockId: 'link-block-id',
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
            id: 'linkField',
            type: 'Link',
            linkType: 'Asset',
          },
        ],
      });

      await handler(event as any, mockContext as any);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should stringify Location fields', async () => {
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
            locationField: {
              'en-US': { lat: 40.7128, lon: -74.006 },
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
                  fieldId: 'locationField',
                  contentBlockId: 'location-block-id',
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
            id: 'locationField',
            type: 'Location',
          },
        ],
      });
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      await handler(event as any, mockContext as any);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.braze.com/content_blocks/update',
        expect.objectContaining({
          body: JSON.stringify({
            content_block_id: 'location-block-id',
            content: 'lat:40.7128,long:-74.006',
          }),
        })
      );
    });

    it('should skip Array fields', async () => {
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
            arrayField: {
              'en-US': ['tag1', 'tag2', 'tag3'],
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
                  fieldId: 'arrayField',
                  contentBlockId: 'array-block-id',
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
            id: 'arrayField',
            type: 'Array',
            items: {
              type: 'Symbol',
            },
          },
        ],
      });

      await handler(event as any, mockContext as any);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle mixed field types correctly', async () => {
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
            textField: {
              'en-US': 'Text value',
            },
            linkField: {
              'en-US': { sys: { type: 'Link', linkType: 'Asset', id: 'asset-id' } },
            },
            numberField: {
              'en-US': 42,
            },
            locationField: {
              'en-US': { lat: 40.7128, lon: -74.006 },
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
                  fieldId: 'textField',
                  contentBlockId: 'text-block-id',
                },
                {
                  fieldId: 'linkField',
                  contentBlockId: 'link-block-id',
                },
                {
                  fieldId: 'numberField',
                  contentBlockId: 'number-block-id',
                },
                {
                  fieldId: 'locationField',
                  contentBlockId: 'location-block-id',
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
            id: 'textField',
            type: 'Text',
          },
          {
            id: 'linkField',
            type: 'Link',
            linkType: 'Asset',
          },
          {
            id: 'numberField',
            type: 'Number',
          },
          {
            id: 'locationField',
            type: 'Location',
          },
        ],
      });
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      await handler(event as any, mockContext as any);

      // Should update supported fields (text, number, and location)
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        'https://test.braze.com/content_blocks/update',
        expect.objectContaining({
          body: JSON.stringify({
            content_block_id: 'text-block-id',
            content: 'Text value',
          }),
        })
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        'https://test.braze.com/content_blocks/update',
        expect.objectContaining({
          body: JSON.stringify({
            content_block_id: 'number-block-id',
            content: '42',
          }),
        })
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        3,
        'https://test.braze.com/content_blocks/update',
        expect.objectContaining({
          body: JSON.stringify({
            content_block_id: 'location-block-id',
            content: 'lat:40.7128,long:-74.006',
          }),
        })
      );
    });
  });
});
