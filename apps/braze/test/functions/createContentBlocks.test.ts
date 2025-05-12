import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppActionParameters, handler } from '../../functions/createContentBlocks';
import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';

import type { PlainClientAPI } from 'contentful-management';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { createContentType, createEntry, mockFetchSuccess } from '../mocks/mocksForFunctions';

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
    const mockEntry = createEntry({ title: 'Test Title' });
    const mockContentType = createContentType(['title']);

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
        fieldIds: 'title',
        contentBlockNames: JSON.stringify({ title: 'custom-title-name' }),
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
          name: 'custom-title-name',
          content: 'Test Title',
          state: 'draft',
        }),
      })
    );
  });

  it('should convert rich text fields to HTML', async () => {
    // Mock Entry data
    const entry = createEntry({ content: { nodeType: 'document', content: [] } });
    const contentType = createContentType(['content'], 'RichText');

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
        }),
      })
    );
  });

  it('should handle missing fields', async () => {
    // Mock Entry data
    const entry = createEntry({});
    const contentType = createContentType(['title']);

    // Mock API responses
    vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
    vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);

    const event: AppActionRequest<'Custom', AppActionParameters> = {
      type: FunctionTypeEnum.AppActionCall,
      body: {
        entryId: 'entry-id',
        fieldIds: 'title',
        contentBlockNames: JSON.stringify({ title: 'custom-title-name' }),
      },
      headers: {},
    };

    const result = await handler(event, mockContext);

    expect(result).toEqual({
      results: [
        {
          fieldId: 'title',
          success: false,
          statusCode: 404,
          message: 'Field title not found or has no value',
        },
      ],
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    // Mock Entry data
    const entry = createEntry({ title: 'Test Title' });
    const contentType = createContentType(['title']);

    // Mock API responses
    vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
    vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Unauthorized',
    } as Partial<Response> as Response);

    const event: AppActionRequest<'Custom', AppActionParameters> = {
      type: FunctionTypeEnum.AppActionCall,
      body: {
        entryId: 'entry-id',
        fieldIds: 'title',
        contentBlockNames: JSON.stringify({ title: 'custom-title-name' }),
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
          message: 'Error creating content block for field title: Unauthorized',
        },
      ],
    });
  });

  it('should handle multiple fields with custom names', async () => {
    // Mock Entry data
    const entry = createEntry({ title: 'Test Title', description: 'Test Description' });
    const contentType = createContentType(['title', 'description']);

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
        fieldIds: 'title,description',
        contentBlockNames: JSON.stringify({
          title: 'custom-title-name',
          description: 'custom-description-name',
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
          fieldId: 'description',
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
        }),
      })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'https://test.braze.com/content_blocks/create',
      expect.objectContaining({
        body: JSON.stringify({
          name: 'custom-description-name',
          content: 'Test Description',
          state: 'draft',
        }),
      })
    );
  });

  it('should handle invalid contentBlockNames JSON', async () => {
    // Mock Entry data
    const entry = createEntry({ title: 'Test Title' });
    const contentType = createContentType(['title']);

    // Mock API responses
    vi.mocked(mockCma.entry.get).mockResolvedValue(entry);
    vi.mocked(mockCma.contentType.get).mockResolvedValue(contentType);

    const event: AppActionRequest<'Custom', AppActionParameters> = {
      type: FunctionTypeEnum.AppActionCall,
      body: {
        entryId: 'entry-id',
        fieldIds: 'title',
        contentBlockNames: 'invalid-json',
      },
      headers: {},
    };

    await expect(handler(event, mockContext)).rejects.toThrow();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle missing contentBlockNames for a field', async () => {
    // Mock Entry data
    const entry = createEntry({ title: 'Test Title', description: 'Test Description' });
    const contentType = createContentType(['title', 'description']);

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
        fieldIds: 'title,description',
        contentBlockNames: JSON.stringify({
          title: 'custom-title-name',
          // description name is missing
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
          fieldId: 'description',
          success: false,
          statusCode: 404,
          message: 'Content block name not found or has no value for field description',
        },
      ],
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
