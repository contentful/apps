import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from '../../functions/createContentBlocks';
import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import type { PlainClientAPI, EntryProps, ContentTypeProps } from 'contentful-management';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';

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
    const mockEntry = {
      sys: {
        id: 'entry-id',
        type: 'Entry',
        space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
        environment: { sys: { type: 'Link', linkType: 'Environment', id: 'environment-id' } },
        contentType: {
          sys: {
            type: 'Link',
            linkType: 'ContentType',
            id: 'content-type-id',
          },
        },
        locale: 'en-US',
        version: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        automationTags: [],
      },
      fields: {
        title: {
          'en-US': 'Test Title',
        },
      },
    } as unknown as EntryProps;

    // Mock contentType data
    const mockContentType = {
      sys: {
        type: 'ContentType',
        id: 'content-type-id',
        version: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
        environment: { sys: { type: 'Link', linkType: 'Environment', id: 'environment-id' } },
      },
      name: 'Test Content Type',
      description: 'Test Description',
      displayField: 'title',
      fields: [
        {
          id: 'title',
          name: 'Title',
          type: 'Text',
          localized: true,
          required: true,
          validations: [],
          disabled: false,
          omitted: false,
        },
      ],
    } as ContentTypeProps;

    // Mock API responses
    vi.mocked(mockCma.entry.get).mockResolvedValue(mockEntry);
    vi.mocked(mockCma.contentType.get).mockResolvedValue(mockContentType);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content_block_id: 'block-id' }),
    } as Response);

    const event: AppActionRequest<'Custom', { entryId: string; fieldIds: string }> = {
      type: FunctionTypeEnum.AppActionCall,
      body: {
        entryId: 'entry-id',
        fieldIds: 'title',
      },
      headers: {},
    };

    const result = await handler(event, mockContext);

    expect(result).toEqual({
      results: [
        {
          fieldId: 'title',
          success: true,
          contentBlockId: 'block-id',
        },
      ],
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://test.braze.com/content_blocks/create',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-api-key',
        },
        body: JSON.stringify({
          name: 'Test Title-title',
          content: 'Test Title',
          state: 'draft',
        }),
      })
    );
  });

  it('should convert rich text fields to HTML', async () => {
    // Mock entry data
    const mockEntry = {
      sys: {
        id: 'entry-id',
        type: 'Entry',
        space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
        environment: { sys: { type: 'Link', linkType: 'Environment', id: 'environment-id' } },
        contentType: {
          sys: {
            type: 'Link',
            linkType: 'ContentType',
            id: 'content-type-id',
          },
        },
        locale: 'en-US',
        version: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        automationTags: [],
      },
      fields: {
        content: {
          'en-US': {
            nodeType: 'document',
            content: [],
          },
        },
      },
    } as unknown as EntryProps;

    // Mock contentType data
    const mockContentType = {
      sys: {
        type: 'ContentType',
        id: 'content-type-id',
        version: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
        environment: { sys: { type: 'Link', linkType: 'Environment', id: 'environment-id' } },
      },
      name: 'Test Content Type',
      description: 'Test Description',
      displayField: 'title',
      fields: [
        {
          id: 'content',
          name: 'Content',
          type: 'RichText',
          localized: true,
          required: true,
          validations: [],
          disabled: false,
          omitted: false,
        },
      ],
    } as ContentTypeProps;

    // Mock API responses
    vi.mocked(mockCma.entry.get).mockResolvedValue(mockEntry);
    vi.mocked(mockCma.contentType.get).mockResolvedValue(mockContentType);
    vi.mocked(documentToHtmlString).mockReturnValue('<p>Test HTML</p>');
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content_block_id: 'block-id' }),
    } as Response);

    const event: AppActionRequest<'Custom', { entryId: string; fieldIds: string }> = {
      type: FunctionTypeEnum.AppActionCall,
      body: {
        entryId: 'entry-id',
        fieldIds: 'content',
      },
      headers: {},
    };

    const result = await handler(event, mockContext);

    expect(result).toEqual({
      results: [
        {
          fieldId: 'content',
          success: true,
          contentBlockId: 'block-id',
        },
      ],
    });

    expect(documentToHtmlString).toHaveBeenCalledWith(mockEntry.fields.content['en-US']);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://test.braze.com/content_blocks/create',
      expect.objectContaining({
        body: JSON.stringify({
          name: 'Untitled-content',
          content: '<p>Test HTML</p>',
          state: 'draft',
        }),
      })
    );
  });

  it('should handle missing fields', async () => {
    // Mock entry data
    const mockEntry = {
      sys: {
        id: 'entry-id',
        type: 'Entry',
        space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
        environment: { sys: { type: 'Link', linkType: 'Environment', id: 'environment-id' } },
        contentType: {
          sys: {
            type: 'Link',
            linkType: 'ContentType',
            id: 'content-type-id',
          },
        },
        locale: 'en-US',
        version: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        automationTags: [],
      },
      fields: {},
    } as unknown as EntryProps;

    // Mock contentType data
    const mockContentType = {
      sys: {
        type: 'ContentType',
        id: 'content-type-id',
        version: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
        environment: { sys: { type: 'Link', linkType: 'Environment', id: 'environment-id' } },
      },
      name: 'Test Content Type',
      description: 'Test Description',
      displayField: 'title',
      fields: [
        {
          id: 'title',
          name: 'Title',
          type: 'Text',
          localized: true,
          required: true,
          validations: [],
          disabled: false,
          omitted: false,
        },
      ],
    } as ContentTypeProps;

    // Mock API responses
    vi.mocked(mockCma.entry.get).mockResolvedValue(mockEntry);
    vi.mocked(mockCma.contentType.get).mockResolvedValue(mockContentType);

    const event: AppActionRequest<'Custom', { entryId: string; fieldIds: string }> = {
      type: FunctionTypeEnum.AppActionCall,
      body: {
        entryId: 'entry-id',
        fieldIds: 'title',
      },
      headers: {},
    };

    const result = await handler(event, mockContext);

    expect(result).toEqual({
      results: [
        {
          fieldId: 'title',
          success: false,
          message: 'Field title not found or has no value',
        },
      ],
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    // Mock entry data
    const mockEntry = {
      sys: {
        id: 'entry-id',
        type: 'Entry',
        space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
        environment: { sys: { type: 'Link', linkType: 'Environment', id: 'environment-id' } },
        contentType: {
          sys: {
            type: 'Link',
            linkType: 'ContentType',
            id: 'content-type-id',
          },
        },
        locale: 'en-US',
        version: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        automationTags: [],
      },
      fields: {
        title: {
          'en-US': 'Test Title',
        },
      },
    } as unknown as EntryProps;

    // Mock contentType data
    const mockContentType = {
      sys: {
        type: 'ContentType',
        id: 'content-type-id',
        version: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
        environment: { sys: { type: 'Link', linkType: 'Environment', id: 'environment-id' } },
      },
      name: 'Test Content Type',
      description: 'Test Description',
      displayField: 'title',
      fields: [
        {
          id: 'title',
          name: 'Title',
          type: 'Text',
          localized: true,
          required: true,
          validations: [],
          disabled: false,
          omitted: false,
        },
      ],
    } as ContentTypeProps;

    // Mock API responses
    vi.mocked(mockCma.entry.get).mockResolvedValue(mockEntry);
    vi.mocked(mockCma.contentType.get).mockResolvedValue(mockContentType);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      statusText: 'Unauthorized',
    } as Response);

    const event: AppActionRequest<'Custom', { entryId: string; fieldIds: string }> = {
      type: FunctionTypeEnum.AppActionCall,
      body: {
        entryId: 'entry-id',
        fieldIds: 'title',
      },
      headers: {},
    };

    const result = await handler(event, mockContext);

    expect(result).toEqual({
      results: [
        {
          fieldId: 'title',
          success: false,
          message: 'Error creating content block: Unauthorized',
        },
      ],
    });
  });
});
