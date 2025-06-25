import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppActionParameters, handler } from '../../functions/createContentBlocks';
import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';

import type { PlainClientAPI } from 'contentful-management';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { mockFetchSuccess } from '../mocks/mocksForFunctions';
import { createEntryResponse } from '../mocks/entryResponse';
import { createContentTypeResponse } from '../mocks/contentTypeResponse';

const mockCma = {
  entry: {
    get: vi.fn(),
  },
  contentType: {
    get: vi.fn(),
  },
} as unknown as PlainClientAPI;

// Mock the contentful-management client
vi.mock('contentful-management', () => ({
  createClient: () => mockCma,
}));

// Mock the rich-text-html-renderer
vi.mock('@contentful/rich-text-html-renderer', () => ({
  documentToHtmlString: vi.fn(),
}));

describe('createContentBlocks', () => {
  const mockContext: FunctionEventContext = {
    spaceId: 'space-id',
    environmentId: 'environment-id',
    appInstallationParameters: {
      brazeApiKey: 'test-api-key',
      brazeEndpoint: 'https://test.braze.com',
    },
    cmaClientOptions: {
      accessToken: 'test-token',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should create content blocks for text fields', async () => {
    // Mock entry data
    const mockEntry = createEntryResponse({
      title: { 'en-US': 'Test Title' },
      author: { 'en-US': 'Test Author' },
    });
    const mockContentType = createContentTypeResponse(['title', 'author']);

    // Mock API responses
    vi.mocked(mockCma.entry.get).mockResolvedValue(mockEntry);
    vi.mocked(mockCma.contentType.get).mockResolvedValue(mockContentType);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content_block_id: 'block-id' }),
    } as Response);

    const event: AppActionRequest<'Custom', AppActionParameters> = {
      type: FunctionTypeEnum.AppActionCall,
      body: {
        entryId: 'entry-id',
        fieldsData: JSON.stringify([
          {
            fieldId: 'title',
            contentBlockName: 'custom-title-name',
            contentBlockDescription: 'custom-title-description',
          },
          {
            fieldId: 'author',
            contentBlockName: 'custom-author-name',
            contentBlockDescription: 'custom-author-description',
          },
        ]),
      },
      headers: {},
    };

    const result = await handler(event, mockContext);

    expect(result).toEqual({
      results: [
        {
          fieldId: 'title',
          success: true,
          statusCode: 201,
          contentBlockId: 'block-id',
        },
        {
          fieldId: 'author',
          success: true,
          statusCode: 201,
          contentBlockId: 'block-id',
        },
      ],
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      'https://test.braze.com/content_blocks/create',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-api-key',
        },
        body: JSON.stringify({
          name: 'custom-title-name',
          content: 'Test Title',
          state: 'draft',
          description: 'custom-title-description',
        }),
      })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'https://test.braze.com/content_blocks/create',
      expect.objectContaining({
        body: JSON.stringify({
          name: 'custom-author-name',
          content: 'Test Author',
          state: 'draft',
          description: 'custom-author-description',
        }),
      })
    );
  });

  it('should convert rich text fields to HTML', async () => {
    // Mock Entry data
    const entry = createEntryResponse({
      content: { 'en-US': { nodeType: 'document', content: [] } },
    });
    const contentType = createContentTypeResponse(['content'], 'RichText');

    // Mock API responses
    vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
    vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);
    vi.mocked(documentToHtmlString).mockReturnValue('<p>Test HTML</p>');
    mockFetchSuccess({ content_block_id: 'block-id' });

    const event: AppActionRequest<'Custom', AppActionParameters> = {
      type: FunctionTypeEnum.AppActionCall,
      body: {
        entryId: 'entry-id',
        fieldsData: JSON.stringify([
          {
            fieldId: 'content',
            contentBlockName: 'custom-content-name',
            contentBlockDescription: 'custom-content-description',
          },
        ]),
      },
      headers: {},
    };

    const result = await handler(event, mockContext);

    expect(result).toEqual({
      results: [
        {
          fieldId: 'content',
          success: true,
          statusCode: 201,
          contentBlockId: 'block-id',
        },
      ],
    });

    expect(documentToHtmlString).toHaveBeenCalledWith(entry.fields.content['en-US']);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://test.braze.com/content_blocks/create',
      expect.objectContaining({
        body: JSON.stringify({
          name: 'custom-content-name',
          content: '<p>Test HTML</p>',
          state: 'draft',
          description: 'custom-content-description',
        }),
      })
    );
  });

  it('should handle missing fields', async () => {
    const entry = createEntryResponse({
      title: { 'es-AR': 'Test Title' },
    });
    const contentType = createContentTypeResponse(['title', 'author']);

    vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
    vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);

    const event: AppActionRequest<'Custom', AppActionParameters> = {
      type: FunctionTypeEnum.AppActionCall,
      body: {
        entryId: 'entry-id',
        fieldsData: JSON.stringify([
          {
            fieldId: 'title',
            locale: 'en-US',
            contentBlockName: 'custom-title-name',
            contentBlockDescription: 'custom-title-description',
          },
          {
            fieldId: 'author',
            contentBlockName: 'custom-author-name',
            contentBlockDescription: 'custom-author-description',
          },
        ]),
      },
      headers: {},
    };

    const result = await handler(event, mockContext);

    expect(result).toEqual({
      results: [
        {
          fieldId: 'title',
          locale: 'en-US',
          success: false,
          statusCode: 600,
          message: 'Field title with locale en-US is empty',
        },
        {
          fieldId: 'author',
          success: false,
          statusCode: 600,
          message: 'Field author is empty',
        },
      ],
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    // Mock Entry data
    const entry = createEntryResponse({
      title: { 'en-US': 'Test Title' },
      author: { 'en-US': 'Test Author' },
    });
    const contentType = createContentTypeResponse(['title', 'author']);

    // Mock API responses
    vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
    vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: () =>
        Promise.resolve({
          message: 'Unauthorized',
        }),
    } as Response);

    const event: AppActionRequest<'Custom', AppActionParameters> = {
      type: FunctionTypeEnum.AppActionCall,
      body: {
        entryId: 'entry-id',
        fieldsData: JSON.stringify([
          {
            fieldId: 'title',
            contentBlockName: 'custom-title-name',
            contentBlockDescription: 'custom-title-description',
          },
          {
            fieldId: 'author',
            contentBlockName: 'custom-author-name',
            contentBlockDescription: 'custom-author-description',
          },
        ]),
      },
      headers: {},
    };

    const result = await handler(event, mockContext);

    expect(result).toEqual({
      results: [
        {
          fieldId: 'title',
          success: false,
          statusCode: 401,
          message:
            'Error creating content block for field title: Invalid API Key or Braze Endpoint',
        },
        {
          fieldId: 'author',
          success: false,
          statusCode: 401,
          message:
            'Error creating content block for field author: Invalid API Key or Braze Endpoint',
        },
      ],
    });
  });

  it('should handle 401 errors for localized fields', async () => {
    // Mock Entry data
    const entry = createEntryResponse({
      title: { 'en-US': 'Test Title' },
    });
    const contentType = createContentTypeResponse(['title']);

    // Mock API responses
    vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
    vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: () =>
        Promise.resolve({
          message: 'Unauthorized',
        }),
    } as Response);

    const event: AppActionRequest<'Custom', AppActionParameters> = {
      type: FunctionTypeEnum.AppActionCall,
      body: {
        entryId: 'entry-id',
        fieldsData: JSON.stringify([
          {
            fieldId: 'title',
            locale: 'en-US',
            contentBlockName: 'custom-title-name',
            contentBlockDescription: 'custom-title-description',
          },
        ]),
      },
      headers: {},
    };

    const result = await handler(event, mockContext);

    expect(result).toEqual({
      results: [
        {
          fieldId: 'title',
          locale: 'en-US',
          success: false,
          statusCode: 401,
          message:
            'Error creating content block for field title and locale en-US: Invalid API Key or Braze Endpoint',
        },
      ],
    });
  });

  it('should handle other API errors with custom messages', async () => {
    // Mock Entry data
    const entry = createEntryResponse({
      title: { 'en-US': 'Test Title' },
    });
    const contentType = createContentTypeResponse(['title']);

    // Mock API responses
    vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
    vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          message: 'Content block name already exists',
        }),
    } as Response);

    const event: AppActionRequest<'Custom', AppActionParameters> = {
      type: FunctionTypeEnum.AppActionCall,
      body: {
        entryId: 'entry-id',
        fieldsData: JSON.stringify([
          {
            fieldId: 'title',
            contentBlockName: 'custom-title-name',
            contentBlockDescription: 'custom-title-description',
          },
        ]),
      },
      headers: {},
    };

    const result = await handler(event, mockContext);

    expect(result).toEqual({
      results: [
        {
          fieldId: 'title',
          success: false,
          statusCode: 400,
          message:
            'Error creating content block for field title: Content block name already exists',
        },
      ],
    });
  });

  it('should handle other API errors for localized fields with custom messages', async () => {
    // Mock Entry data
    const entry = createEntryResponse({
      title: { 'en-US': 'Test Title' },
    });
    const contentType = createContentTypeResponse(['title']);

    // Mock API responses
    vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
    vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 422,
      json: () =>
        Promise.resolve({
          message: 'Invalid content format',
        }),
    } as Response);

    const event: AppActionRequest<'Custom', AppActionParameters> = {
      type: FunctionTypeEnum.AppActionCall,
      body: {
        entryId: 'entry-id',
        fieldsData: JSON.stringify([
          {
            fieldId: 'title',
            locale: 'en-US',
            contentBlockName: 'custom-title-name',
            contentBlockDescription: 'custom-title-description',
          },
        ]),
      },
      headers: {},
    };

    const result = await handler(event, mockContext);

    expect(result).toEqual({
      results: [
        {
          fieldId: 'title',
          locale: 'en-US',
          success: false,
          statusCode: 422,
          message:
            'Error creating content block for field title and locale en-US: Invalid content format',
        },
      ],
    });
  });

  it('should handle multiple fields with custom names', async () => {
    // Mock Entry data
    const entry = createEntryResponse({
      title: { 'en-US': 'Test Title' },
      author: { 'en-US': 'Test Author' },
    });
    const contentType = createContentTypeResponse(['title', 'author']);

    // Mock API responses
    vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
    vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content_block_id: 'block-id-1' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content_block_id: 'block-id-2' }),
      } as Response);

    const event: AppActionRequest<'Custom', AppActionParameters> = {
      type: FunctionTypeEnum.AppActionCall,
      body: {
        entryId: 'entry-id',
        fieldsData: JSON.stringify([
          {
            fieldId: 'title',
            contentBlockName: 'custom-title-name',
            contentBlockDescription: 'custom-title-description',
          },
          {
            fieldId: 'author',
            contentBlockName: 'custom-author-name',
            contentBlockDescription: 'custom-author-description',
          },
        ]),
      },
      headers: {},
    };

    const result = await handler(event, mockContext);

    expect(result).toEqual({
      results: [
        {
          fieldId: 'title',
          success: true,
          statusCode: 201,
          contentBlockId: 'block-id-1',
        },
        {
          fieldId: 'author',
          success: true,
          statusCode: 201,
          contentBlockId: 'block-id-2',
        },
      ],
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      'https://test.braze.com/content_blocks/create',
      expect.objectContaining({
        body: JSON.stringify({
          name: 'custom-title-name',
          content: 'Test Title',
          state: 'draft',
          description: 'custom-title-description',
        }),
      })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'https://test.braze.com/content_blocks/create',
      expect.objectContaining({
        body: JSON.stringify({
          name: 'custom-author-name',
          content: 'Test Author',
          state: 'draft',
          description: 'custom-author-description',
        }),
      })
    );
  });

  it('should handle invalid fieldsData JSON', async () => {
    // Mock Entry data
    const entry = createEntryResponse({
      title: { 'en-US': 'Test Title' },
      author: { 'en-US': 'Test Author' },
    });
    const contentType = createContentTypeResponse(['title', 'author']);

    // Mock API responses
    vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
    vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);

    const event: AppActionRequest<'Custom', AppActionParameters> = {
      type: FunctionTypeEnum.AppActionCall,
      body: {
        entryId: 'entry-id',
        fieldsData: 'invalid-json',
      },
      headers: {},
    };

    await expect(handler(event, mockContext)).rejects.toThrow();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle missing contentBlockNames for a field', async () => {
    // Mock Entry data
    const entry = createEntryResponse({
      title: { 'en-US': 'Test Title' },
      author: { 'en-US': 'Test Author' },
    });
    const contentType = createContentTypeResponse(['title', 'author']);

    // Mock API responses
    vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
    vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content_block_id: 'block-id' }),
    } as Response);

    const event: AppActionRequest<'Custom', AppActionParameters> = {
      type: FunctionTypeEnum.AppActionCall,
      body: {
        entryId: 'entry-id',
        fieldsData: JSON.stringify([
          {
            fieldId: 'title',
            contentBlockName: 'custom-title-name',
            contentBlockDescription: 'custom-title-description',
          },
          {
            fieldId: 'author',
            // author name is missing
            contentBlockDescription: 'custom-author-description',
          },
        ]),
      },
      headers: {},
    };

    const result = await handler(event, mockContext);

    expect(result).toEqual({
      results: [
        {
          fieldId: 'title',
          success: true,
          statusCode: 201,
          contentBlockId: 'block-id',
        },
        {
          fieldId: 'author',
          success: false,
          statusCode: 601,
          message:
            'Unexpected error: Information missing. Field ID: author - Content block name: undefined',
        },
      ],
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should create content blocks for localized fields', async () => {
    const mockEntry = createEntryResponse({
      title: {
        'en-US': 'English Title',
        'es-ES': 'Spanish Title',
      },
    });
    const mockContentType = createContentTypeResponse(['title']);

    vi.mocked(mockCma.entry.get).mockResolvedValue(mockEntry);
    vi.mocked(mockCma.contentType.get).mockResolvedValue(mockContentType);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content_block_id: 'block-id-localized' }),
    } as Response);

    const event: AppActionRequest<'Custom', AppActionParameters> = {
      type: FunctionTypeEnum.AppActionCall,
      body: {
        entryId: 'entry-id',
        fieldsData: JSON.stringify([
          {
            fieldId: 'title',
            locale: 'es-ES',
            contentBlockName: 'custom-title-name-es',
            contentBlockDescription: 'custom-title-description-es',
          },
        ]),
      },
      headers: {},
    };

    const result = await handler(event, mockContext);

    expect(result).toEqual({
      results: [
        {
          fieldId: 'title',
          locale: 'es-ES',
          success: true,
          statusCode: 201,
          contentBlockId: 'block-id-localized',
        },
      ],
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://test.braze.com/content_blocks/create',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-api-key',
        },
        body: JSON.stringify({
          name: 'custom-title-name-es',
          content: 'Spanish Title',
          state: 'draft',
          description: 'custom-title-description-es',
        }),
      })
    );
  });

  describe('field stringification', () => {
    it('should stringify Symbol fields', async () => {
      const entry = createEntryResponse({
        title: { 'en-US': 'Test Symbol' },
      });
      const contentType = createContentTypeResponse(['title'], 'Symbol');

      vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
      vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);
      mockFetchSuccess({ content_block_id: 'block-id' });

      const event: AppActionRequest<'Custom', AppActionParameters> = {
        type: FunctionTypeEnum.AppActionCall,
        body: {
          entryId: 'entry-id',
          fieldsData: JSON.stringify([
            {
              fieldId: 'title',
              contentBlockName: 'symbol-field',
              contentBlockDescription: 'Symbol field test',
            },
          ]),
        },
        headers: {},
      };

      const result = await handler(event, mockContext);

      expect(result.results[0].success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.braze.com/content_blocks/create',
        expect.objectContaining({
          body: JSON.stringify({
            name: 'symbol-field',
            content: 'Test Symbol',
            state: 'draft',
            description: 'Symbol field test',
          }),
        })
      );
    });

    it('should stringify Integer fields', async () => {
      const entry = createEntryResponse({
        count: { 'en-US': 42 },
      });
      const contentType = createContentTypeResponse(['count'], 'Integer');

      vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
      vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);
      mockFetchSuccess({ content_block_id: 'block-id' });

      const event: AppActionRequest<'Custom', AppActionParameters> = {
        type: FunctionTypeEnum.AppActionCall,
        body: {
          entryId: 'entry-id',
          fieldsData: JSON.stringify([
            {
              fieldId: 'count',
              contentBlockName: 'integer-field',
              contentBlockDescription: 'Integer field test',
            },
          ]),
        },
        headers: {},
      };

      const result = await handler(event, mockContext);

      expect(result.results[0].success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.braze.com/content_blocks/create',
        expect.objectContaining({
          body: JSON.stringify({
            name: 'integer-field',
            content: '42',
            state: 'draft',
            description: 'Integer field test',
          }),
        })
      );
    });

    it('should stringify Number fields', async () => {
      const entry = createEntryResponse({
        price: { 'en-US': 99.99 },
      });
      const contentType = createContentTypeResponse(['price'], 'Number');

      vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
      vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);
      mockFetchSuccess({ content_block_id: 'block-id' });

      const event: AppActionRequest<'Custom', AppActionParameters> = {
        type: FunctionTypeEnum.AppActionCall,
        body: {
          entryId: 'entry-id',
          fieldsData: JSON.stringify([
            {
              fieldId: 'price',
              contentBlockName: 'number-field',
              contentBlockDescription: 'Number field test',
            },
          ]),
        },
        headers: {},
      };

      const result = await handler(event, mockContext);

      expect(result.results[0].success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.braze.com/content_blocks/create',
        expect.objectContaining({
          body: JSON.stringify({
            name: 'number-field',
            content: '99.99',
            state: 'draft',
            description: 'Number field test',
          }),
        })
      );
    });

    it('should stringify Date fields', async () => {
      const testDate = '2024-01-15T10:30:00Z';
      const entry = createEntryResponse({
        publishedAt: { 'en-US': testDate },
      });
      const contentType = createContentTypeResponse(['publishedAt'], 'Date');

      vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
      vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);
      mockFetchSuccess({ content_block_id: 'block-id' });

      const event: AppActionRequest<'Custom', AppActionParameters> = {
        type: FunctionTypeEnum.AppActionCall,
        body: {
          entryId: 'entry-id',
          fieldsData: JSON.stringify([
            {
              fieldId: 'publishedAt',
              contentBlockName: 'date-field',
              contentBlockDescription: 'Date field test',
            },
          ]),
        },
        headers: {},
      };

      const result = await handler(event, mockContext);

      expect(result.results[0].success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.braze.com/content_blocks/create',
        expect.objectContaining({
          body: JSON.stringify({
            name: 'date-field',
            content: '2024-01-15T10:30:00.000Z',
            state: 'draft',
            description: 'Date field test',
          }),
        })
      );
    });

    it('should stringify Boolean fields', async () => {
      const entry = createEntryResponse({
        isPublished: { 'en-US': true },
      });
      const contentType = createContentTypeResponse(['isPublished'], 'Boolean');

      vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
      vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);
      mockFetchSuccess({ content_block_id: 'block-id' });

      const event: AppActionRequest<'Custom', AppActionParameters> = {
        type: FunctionTypeEnum.AppActionCall,
        body: {
          entryId: 'entry-id',
          fieldsData: JSON.stringify([
            {
              fieldId: 'isPublished',
              contentBlockName: 'boolean-field',
              contentBlockDescription: 'Boolean field test',
            },
          ]),
        },
        headers: {},
      };

      const result = await handler(event, mockContext);

      expect(result.results[0].success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.braze.com/content_blocks/create',
        expect.objectContaining({
          body: JSON.stringify({
            name: 'boolean-field',
            content: 'true',
            state: 'draft',
            description: 'Boolean field test',
          }),
        })
      );
    });

    it('should stringify Object fields', async () => {
      const objectValue = { key: 'value', number: 123, nested: { test: true } };
      const entry = createEntryResponse({
        metadata: { 'en-US': objectValue },
      });
      const contentType = createContentTypeResponse(['metadata'], 'Object');

      vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
      vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);
      mockFetchSuccess({ content_block_id: 'block-id' });

      const event: AppActionRequest<'Custom', AppActionParameters> = {
        type: FunctionTypeEnum.AppActionCall,
        body: {
          entryId: 'entry-id',
          fieldsData: JSON.stringify([
            {
              fieldId: 'metadata',
              contentBlockName: 'object-field',
              contentBlockDescription: 'Object field test',
            },
          ]),
        },
        headers: {},
      };

      const result = await handler(event, mockContext);

      expect(result.results[0].success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.braze.com/content_blocks/create',
        expect.objectContaining({
          body: JSON.stringify({
            name: 'object-field',
            content: JSON.stringify(objectValue),
            state: 'draft',
            description: 'Object field test',
          }),
        })
      );
    });

    it('should reject Link fields', async () => {
      const entry = createEntryResponse({
        asset: { 'en-US': { sys: { type: 'Link', linkType: 'Asset', id: 'asset-id' } } },
      });
      const contentType = createContentTypeResponse(['asset'], 'Link');

      vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
      vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);

      const event: AppActionRequest<'Custom', AppActionParameters> = {
        type: FunctionTypeEnum.AppActionCall,
        body: {
          entryId: 'entry-id',
          fieldsData: JSON.stringify([
            {
              fieldId: 'asset',
              contentBlockName: 'link-field',
              contentBlockDescription: 'Link field test',
            },
          ]),
        },
        headers: {},
      };

      const result = await handler(event, mockContext);

      expect(result.results[0].success).toBe(false);
      expect(result.results[0].statusCode).toBe(500);
      expect(result.results[0].message).toBe("Field type 'Link' is not supported");
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should stringify Location fields', async () => {
      const entry = createEntryResponse({
        location: { 'en-US': { lat: 40.7128, lon: -74.006 } },
      });
      const contentType = createContentTypeResponse(['location'], 'Location');

      vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
      vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);
      mockFetchSuccess({ content_block_id: 'block-id' });

      const event: AppActionRequest<'Custom', AppActionParameters> = {
        type: FunctionTypeEnum.AppActionCall,
        body: {
          entryId: 'entry-id',
          fieldsData: JSON.stringify([
            {
              fieldId: 'location',
              contentBlockName: 'location-field',
              contentBlockDescription: 'Location field test',
            },
          ]),
        },
        headers: {},
      };

      const result = await handler(event, mockContext);

      expect(result.results[0].success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.braze.com/content_blocks/create',
        expect.objectContaining({
          body: JSON.stringify({
            name: 'location-field',
            content: 'lat:40.7128,long:-74.006',
            state: 'draft',
            description: 'Location field test',
          }),
        })
      );
    });

    it('should reject Array fields', async () => {
      const entry = createEntryResponse({
        tags: { 'en-US': ['tag1', 'tag2', 'tag3'] },
      });
      const contentType = createContentTypeResponse(['tags'], 'Array');

      vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
      vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);

      const event: AppActionRequest<'Custom', AppActionParameters> = {
        type: FunctionTypeEnum.AppActionCall,
        body: {
          entryId: 'entry-id',
          fieldsData: JSON.stringify([
            {
              fieldId: 'tags',
              contentBlockName: 'array-field',
              contentBlockDescription: 'Array field test',
            },
          ]),
        },
        headers: {},
      };

      const result = await handler(event, mockContext);

      expect(result.results[0].success).toBe(false);
      expect(result.results[0].statusCode).toBe(500);
      expect(result.results[0].message).toBe("Field type 'Array' is not supported");
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle field not found in content type', async () => {
      const entry = createEntryResponse({
        title: { 'en-US': 'Test Title' },
      });
      const contentType = createContentTypeResponse(['title']);

      vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
      vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);

      const event: AppActionRequest<'Custom', AppActionParameters> = {
        type: FunctionTypeEnum.AppActionCall,
        body: {
          entryId: 'entry-id',
          fieldsData: JSON.stringify([
            {
              fieldId: 'nonexistent',
              contentBlockName: 'nonexistent-field',
              contentBlockDescription: 'Nonexistent field test',
            },
          ]),
        },
        headers: {},
      };

      const result = await handler(event, mockContext);

      expect(result.results[0].success).toBe(false);
      expect(result.results[0].statusCode).toBe(600);
      expect(result.results[0].message).toBe('Field nonexistent is empty');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
