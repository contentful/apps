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
import { createGetEntryResponse } from '../mocks/entryResponse';
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
    const mockEntry = createGetEntryResponse({ title: 'Test Title', author: 'Test Author' });
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
        fieldIds: 'title,author',
        contentBlockNames: JSON.stringify({
          title: 'custom-title-name',
          author: 'custom-author-name',
        }),
        contentBlockDescriptions: JSON.stringify({
          title: 'custom-title-description',
          author: 'custom-author-description',
        }),
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
    const entry = createGetEntryResponse({ content: { nodeType: 'document', content: [] } });
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
        fieldIds: 'content',
        contentBlockNames: JSON.stringify({ content: 'custom-content-name' }),
        contentBlockDescriptions: JSON.stringify({ content: 'custom-content-description' }),
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
    // Mock Entry data
    const entry = createGetEntryResponse({});
    const contentType = createContentTypeResponse(['title', 'author']);

    // Mock API responses
    vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
    vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);

    const event: AppActionRequest<'Custom', AppActionParameters> = {
      type: FunctionTypeEnum.AppActionCall,
      body: {
        entryId: 'entry-id',
        fieldIds: 'title,author',
        contentBlockNames: JSON.stringify({
          title: 'custom-title-name',
          author: 'custom-author-name',
        }),
        contentBlockDescriptions: JSON.stringify({
          title: 'custom-title-description',
          author: 'custom-author-description',
        }),
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
          message: 'Field title does not exist or is empty',
        },
        {
          fieldId: 'author',
          success: false,
          statusCode: 400,
          message: 'Field author does not exist or is empty',
        },
      ],
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    // Mock Entry data
    const entry = createGetEntryResponse({ title: 'Test Title', author: 'Test Author' });
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
    } as Partial<Response> as Response);

    const event: AppActionRequest<'Custom', AppActionParameters> = {
      type: FunctionTypeEnum.AppActionCall,
      body: {
        entryId: 'entry-id',
        fieldIds: 'title,author',
        contentBlockNames: JSON.stringify({
          title: 'custom-title-name',
          author: 'custom-author-name',
        }),
        contentBlockDescriptions: JSON.stringify({
          title: 'custom-title-description',
          author: 'custom-author-description',
        }),
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
          message: 'Error creating content block for field title: Unauthorized',
        },
        {
          fieldId: 'author',
          success: false,
          statusCode: 401,
          message: 'Error creating content block for field author: Unauthorized',
        },
      ],
    });
  });

  it('should handle multiple fields with custom names', async () => {
    // Mock Entry data
    const entry = createGetEntryResponse({ title: 'Test Title', author: 'Test Author' });
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
        fieldIds: 'title,author',
        contentBlockNames: JSON.stringify({
          title: 'custom-title-name',
          author: 'custom-author-name',
        }),
        contentBlockDescriptions: JSON.stringify({
          title: 'custom-title-description',
          author: 'custom-author-description',
        }),
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

  it('should handle invalid contentBlockNames JSON', async () => {
    // Mock Entry data
    const entry = createGetEntryResponse({ title: 'Test Title', author: 'Test Author' });
    const contentType = createContentTypeResponse(['title', 'author']);

    // Mock API responses
    vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
    vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);

    const event: AppActionRequest<'Custom', AppActionParameters> = {
      type: FunctionTypeEnum.AppActionCall,
      body: {
        entryId: 'entry-id',
        fieldIds: 'title,author',
        contentBlockNames: 'invalid-json',
        contentBlockDescriptions: JSON.stringify({
          title: 'custom-title-description',
          author: 'custom-author-description',
        }),
      },
      headers: {},
    };

    await expect(handler(event, mockContext)).rejects.toThrow();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle missing contentBlockNames for a field', async () => {
    // Mock Entry data
    const entry = createGetEntryResponse({ title: 'Test Title', author: 'Test Author' });
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
        fieldIds: 'title,author',
        contentBlockNames: JSON.stringify({
          title: 'custom-title-name',
          // author name is missing
        }),
        contentBlockDescriptions: JSON.stringify({
          title: 'custom-title-description',
          author: 'custom-author-description',
        }),
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
          statusCode: 400,
          message: 'Unexpected error: Content block name not found for field author',
        },
      ],
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
