import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler as originalHandler } from '../../functions/getContentBlocks';
import {
  getConfigAndConnectedFields,
  initContentfulManagementClient,
} from '../../functions/common';
import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import {
  AppInstallationParameters,
  ConnectedField,
  SidebarContentBlockInfo,
} from '../../src/utils';
import { AppActionParameters } from '../../functions/createContentBlocks';
import { mockContext } from '../mocks/mocksForFunctions';

vi.mock('../../functions/common', () => ({
  initContentfulManagementClient: vi.fn(),
  getConfigAndConnectedFields: vi.fn(),
}));

global.fetch = vi.fn();

const mockCma = {};

type HandlerResponse = {
  contentBlocks: SidebarContentBlockInfo[];
};

const handler: (
  event: AppActionRequest<'Custom', AppActionParameters>,
  context: FunctionEventContext
) => Promise<HandlerResponse> = originalHandler as any;

const mockEvent = {
  type: FunctionTypeEnum.AppActionCall,
  body: {
    entryId: 'test-entry-id',
    fieldsData: JSON.stringify([]),
  },
} as AppActionRequest<'Custom', AppActionParameters>;

describe('getContentBlocks handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (initContentfulManagementClient as ReturnType<typeof vi.fn>).mockReturnValue(mockCma);
    (getConfigAndConnectedFields as ReturnType<typeof vi.fn>).mockReset();
    (global.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('should retrieve and format content blocks successfully', async () => {
    const mockConnectedFields: ConnectedField[] = [
      { fieldId: 'field1', locale: 'en-US', contentBlockId: 'cbId1' },
      { fieldId: 'field2', locale: 'en-US', contentBlockId: 'cbId2' },
    ];

    (getConfigAndConnectedFields as ReturnType<typeof vi.fn>).mockResolvedValue({
      entryConnectedFields: mockConnectedFields,
    });

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content_block_id: 'cbId1',
          name: 'Test Block 1',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content_block_id: 'cbId2',
          name: 'Test Block 2',
        }),
      });

    const result = await handler(mockEvent, mockContext);

    expect(initContentfulManagementClient).toHaveBeenCalledWith(mockContext);
    expect(getConfigAndConnectedFields).toHaveBeenCalledWith(mockCma, 'test-entry-id');
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://test.braze.com/content_blocks/info?content_block_id=cbId1',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-api-key',
        },
      }
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'https://test.braze.com/content_blocks/info?content_block_id=cbId2',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-api-key',
        },
      }
    );
    expect(result).toEqual({
      contentBlocks: [
        {
          contentBlockId: 'cbId1',
          contentBlockName: 'Test Block 1',
          fieldId: 'field1',
          locale: 'en-US',
        },
        {
          contentBlockId: 'cbId2',
          contentBlockName: 'Test Block 2',
          fieldId: 'field2',
          locale: 'en-US',
        },
      ],
    });
  });

  it('should return an empty array if no connected fields are found', async () => {
    (getConfigAndConnectedFields as ReturnType<typeof vi.fn>).mockResolvedValue({
      entryConnectedFields: [],
    });

    const result = await handler(mockEvent, mockContext);

    expect(initContentfulManagementClient).toHaveBeenCalledWith(mockContext);
    expect(getConfigAndConnectedFields).toHaveBeenCalledWith(mockCma, 'test-entry-id');
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result).toEqual({ contentBlocks: [] });
  });

  it('should handle errors from Braze API and map to undefined for failed blocks', async () => {
    const mockConnectedFields: ConnectedField[] = [
      { fieldId: 'field1', locale: 'en-US', contentBlockId: 'cbId1' },
      { fieldId: 'field2', locale: 'en-US', contentBlockId: 'cbId2' },
      { fieldId: 'field3', locale: 'en-US', contentBlockId: 'cbId3' },
    ];

    (getConfigAndConnectedFields as ReturnType<typeof vi.fn>).mockResolvedValue({
      entryConnectedFields: mockConnectedFields,
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
      if (url.includes('cbId1')) {
        return {
          ok: true,
          json: async () => ({ content_block_id: 'cbId1', name: 'Test Block 1' }),
        };
      } else if (url.includes('cbId2')) {
        return {
          ok: false,
          status: 500,
          json: async () => ({ error: 'Braze API Error for cbId2' }),
        };
      } else if (url.includes('cbId3')) {
        return {
          ok: true,
          json: async () => ({ content_block_id: 'cbId3', name: 'Test Block 3' }),
        };
      }
      return { ok: false, status: 404, json: async () => ({ message: 'Not Found' }) };
    });

    const result = await handler(mockEvent, mockContext);

    expect(initContentfulManagementClient).toHaveBeenCalledWith(mockContext);
    expect(getConfigAndConnectedFields).toHaveBeenCalledWith(mockCma, 'test-entry-id');
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(result.contentBlocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          contentBlockId: 'cbId1',
          contentBlockName: 'Test Block 1',
          fieldId: 'field1',
          locale: 'en-US',
        }),
        expect.objectContaining({
          contentBlockId: undefined,
          contentBlockName: undefined,
          fieldId: 'field2',
          locale: 'en-US',
        }),
        expect.objectContaining({
          contentBlockId: 'cbId3',
          contentBlockName: 'Test Block 3',
          fieldId: 'field3',
          locale: 'en-US',
        }),
      ])
    );
    expect(result.contentBlocks.length).toBe(3);
    const failedBlock = result.contentBlocks.find((b) => b.fieldId === 'field2');
    expect(failedBlock?.contentBlockId).toBeUndefined();
    expect(failedBlock?.contentBlockName).toBeUndefined();
  });
});
