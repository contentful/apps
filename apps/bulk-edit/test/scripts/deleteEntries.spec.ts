import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClient, PlainClientAPI } from 'contentful-management';
import { deleteAllEntriesForContentType, deleteEntry } from '../../src/scripts/deleteEntries';
import { getContentTypeIdByName } from '../../src/scripts/utils';

// Mock contentful-management
vi.mock('contentful-management', () => ({
  createClient: vi.fn(),
}));

// Mock console methods
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

// Mock process.env
const originalEnv = process.env;

// Mock readline interface
const mockReadlineInterface = {
  question: vi.fn(),
  close: vi.fn(),
} as any;

async function mocksAndActionsForNormalDeletion(
  mockEntry: any,
  mockClient: Partial<PlainClientAPI>
) {
  const mockResponseWithEntries = {
    items: [{ sys: { id: 'entry-1' } }, { sys: { id: 'entry-2' } }, { sys: { id: 'entry-3' } }],
  };

  mockEntry.getMany.mockResolvedValue(mockResponseWithEntries);
  mockEntry.get.mockResolvedValue({ sys: { publishedVersion: undefined } });
  mockEntry.delete.mockResolvedValue({});

  await deleteAllEntriesForContentType(
    'test-content-type',
    mockClient as PlainClientAPI,
    mockReadlineInterface,
    process.env.DELETE_CONTENT_TYPE_NAME
  );
}

describe('deleteEntries.ts', () => {
  let mockClient: Partial<PlainClientAPI>;
  let mockEntry: any;
  let mockContentType: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Reset environment variables to test values
    process.env = { ...originalEnv };

    // Setup mock entry with all required methods
    mockEntry = {
      get: vi.fn(),
      getMany: vi.fn(),
      unpublish: vi.fn(),
      delete: vi.fn(),
    };

    // Setup mock content type
    mockContentType = {
      getMany: vi.fn(),
    };

    // Setup mock client
    mockClient = {
      entry: mockEntry,
      contentType: mockContentType,
    };

    // Setup mocks for external dependencies
    (createClient as any).mockReturnValue(mockClient);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should handle content type not found', async () => {
    const contentTypeName = 'unknown-content-type';
    mockContentType.getMany.mockRejectedValue('Content type not found');

    await getContentTypeIdByName(mockClient as PlainClientAPI, contentTypeName);

    expect(consoleSpy.error).toHaveBeenCalledWith(
      '❌ Error fetching content types:',
      'Content type not found'
    );
  });

  describe('deleteEntry', () => {
    it('should delete an unpublished entry successfully', async () => {
      mockEntry.get.mockResolvedValue({ sys: { publishedVersion: undefined } });
      mockEntry.delete.mockResolvedValue({});

      const result = await deleteEntry('entry-1', mockClient as PlainClientAPI);

      expect(mockEntry.get).toHaveBeenCalledWith({ entryId: 'entry-1' });
      expect(mockEntry.delete).toHaveBeenCalledWith({ entryId: 'entry-1' });
      expect(mockEntry.unpublish).not.toHaveBeenCalled();
      expect(result).toBe(true);
      expect(consoleSpy.log).toHaveBeenCalledWith('   ✅ Deleted entry: entry-1');
    });

    it('should unpublish and then delete a published entry', async () => {
      mockEntry.get.mockResolvedValue({ sys: { publishedVersion: 1 } });
      mockEntry.unpublish.mockResolvedValue({});
      mockEntry.delete.mockResolvedValue({});

      const result = await deleteEntry('entry-1', mockClient as PlainClientAPI);

      expect(mockEntry.get).toHaveBeenCalledWith({ entryId: 'entry-1' });
      expect(mockEntry.unpublish).toHaveBeenCalledWith({ entryId: 'entry-1' });
      expect(mockEntry.delete).toHaveBeenCalledWith({ entryId: 'entry-1' });
      expect(result).toBe(true);
      expect(consoleSpy.log).toHaveBeenCalledWith('   📤 Unpublished entry: entry-1');
      expect(consoleSpy.log).toHaveBeenCalledWith('   ✅ Deleted entry: entry-1');
    });

    it('should handle entry get errors gracefully', async () => {
      mockEntry.get.mockRejectedValue(new Error('Entry not found'));
      mockEntry.delete.mockResolvedValue({});

      const result = await deleteEntry('entry-1', mockClient as PlainClientAPI);

      expect(mockEntry.get).toHaveBeenCalledWith({ entryId: 'entry-1' });
      expect(mockEntry.delete).toHaveBeenCalledWith({ entryId: 'entry-1' });
      expect(result).toBe(true);
      expect(consoleSpy.log).toHaveBeenCalledWith('   ✅ Deleted entry: entry-1');
    });

    it('should handle deletion errors gracefully', async () => {
      mockEntry.get.mockResolvedValue({ sys: { publishedVersion: undefined } });
      mockEntry.delete.mockRejectedValue(new Error('Deletion failed'));

      const result = await deleteEntry('entry-1', mockClient as PlainClientAPI);

      expect(mockEntry.get).toHaveBeenCalledWith({ entryId: 'entry-1' });
      expect(mockEntry.delete).toHaveBeenCalledWith({ entryId: 'entry-1' });
      expect(result).toBe(false);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '   ❌ Failed to delete entry entry-1:',
        expect.any(Error)
      );
    });
  });

  describe('deleteAllEntriesForContentType', () => {
    it('should fetch all the existing entries correctly', async () => {
      await mocksAndActionsForNormalDeletion(mockEntry, mockClient);

      expect(mockEntry.getMany).toHaveBeenCalledWith({
        query: {
          content_type: 'test-content-type',
          limit: 1000,
        },
      });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '\n🔍 Fetching all entries for content type: test-content-type'
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '   📄 Fetching all entries for content type: test-content-type...'
      );
      expect(consoleSpy.log).toHaveBeenCalledWith('   📊 Got 3 entries for this content type');
      expect(consoleSpy.log).toHaveBeenCalledWith('📊 Found 3 entries to delete.');
    });

    it('should delete all entries from a content type', async () => {
      await mocksAndActionsForNormalDeletion(mockEntry, mockClient);

      expect(mockEntry.delete).toHaveBeenCalledTimes(3);
      expect(mockEntry.delete).toHaveBeenCalledWith({ entryId: 'entry-1' });
      expect(mockEntry.delete).toHaveBeenCalledWith({ entryId: 'entry-2' });
      expect(mockEntry.delete).toHaveBeenCalledWith({ entryId: 'entry-3' });
    });

    it('should not delete content type', async () => {
      const mockResponseWithEntries = {
        items: [{ sys: { id: 'entry-1' } }, { sys: { id: 'entry-2' } }],
      };

      mockEntry.getMany.mockResolvedValue(mockResponseWithEntries);
      mockEntry.get.mockResolvedValue({ sys: { publishedVersion: undefined } });
      mockEntry.delete.mockResolvedValue({});

      await deleteAllEntriesForContentType(
        'test-content-type',
        mockClient as PlainClientAPI,
        mockReadlineInterface,
        process.env.DELETE_CONTENT_TYPE_NAME
      );

      // Verify that only entries are deleted, not content types
      expect(mockClient.contentType).toBeDefined();
      expect(mockEntry.delete).toHaveBeenCalledTimes(2);
    });

    it('should log progress and summary information', async () => {
      const mockEntries = Array.from({ length: 25 }, (_, i) => ({ sys: { id: `entry-${i + 1}` } }));
      const mockResponseWithEntries = { items: mockEntries };

      mockEntry.getMany.mockResolvedValue(mockResponseWithEntries);
      mockEntry.get.mockResolvedValue({ sys: { publishedVersion: undefined } });
      mockEntry.delete.mockResolvedValue({});

      await deleteAllEntriesForContentType(
        'test-content-type',
        mockClient as PlainClientAPI,
        mockReadlineInterface,
        process.env.DELETE_CONTENT_TYPE_NAME
      );

      expect(consoleSpy.log).toHaveBeenCalledWith('\n🗑️  Starting deletion process...');
      expect(consoleSpy.log).toHaveBeenCalledWith('\n📦 Processing batch 1/3');
      expect(consoleSpy.log).toHaveBeenCalledWith('\n📦 Processing batch 2/3');
      expect(consoleSpy.log).toHaveBeenCalledWith('\n📦 Processing batch 3/3');
      expect(consoleSpy.log).toHaveBeenCalledWith('⏳ Waiting 2 seconds before next batch...');
      expect(consoleSpy.log).toHaveBeenCalledWith('\n📋 Deletion Summary:');
      expect(consoleSpy.log).toHaveBeenCalledWith('   ✅ Successfully deleted: 25 entries');
      expect(consoleSpy.log).toHaveBeenCalledWith('   ❌ Failed to delete: 0 entries');
      expect(consoleSpy.log).toHaveBeenCalledWith('   📊 Total processed: 25 entries');
    });

    it('should handle entry deletion errors gracefully', async () => {
      const mockResponseWithEntries = {
        items: [{ sys: { id: 'entry-1' } }, { sys: { id: 'entry-2' } }, { sys: { id: 'entry-3' } }],
      };

      mockEntry.getMany.mockResolvedValue(mockResponseWithEntries);
      mockEntry.get.mockResolvedValue({ sys: { publishedVersion: undefined } });

      // First entry succeeds, second fails, third succeeds
      mockEntry.delete
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Deletion failed'))
        .mockResolvedValueOnce({});

      await deleteAllEntriesForContentType(
        'test-content-type',
        mockClient as PlainClientAPI,
        mockReadlineInterface,
        process.env.DELETE_CONTENT_TYPE_NAME
      );

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '   ❌ Failed to delete entry entry-2:',
        expect.any(Error)
      );
      expect(consoleSpy.log).toHaveBeenCalledWith('   ✅ Deleted entry: entry-1');
      expect(consoleSpy.log).toHaveBeenCalledWith('   ✅ Deleted entry: entry-3');
      expect(consoleSpy.log).toHaveBeenCalledWith('   ✅ Successfully deleted: 2 entries');
      expect(consoleSpy.log).toHaveBeenCalledWith('   ❌ Failed to delete: 1 entries');
    });

    it('should delete entries in batches', async () => {
      const mockEntries = Array.from({ length: 25 }, (_, i) => ({ sys: { id: `entry-${i + 1}` } }));
      const mockResponseWithEntries = { items: mockEntries };

      mockEntry.getMany.mockResolvedValue(mockResponseWithEntries);
      mockEntry.get.mockResolvedValue({ sys: { publishedVersion: undefined } });
      mockEntry.delete.mockResolvedValue({});

      await deleteAllEntriesForContentType(
        'test-content-type',
        mockClient as PlainClientAPI,
        mockReadlineInterface,
        process.env.DELETE_CONTENT_TYPE_NAME
      );

      // Should process 25 entries in 3 batches: 10, 10, 5
      expect(consoleSpy.log).toHaveBeenCalledWith('\n📦 Processing batch 1/3');
      expect(consoleSpy.log).toHaveBeenCalledWith('\n📦 Processing batch 2/3');
      expect(consoleSpy.log).toHaveBeenCalledWith('\n📦 Processing batch 3/3');
      expect(consoleSpy.log).toHaveBeenCalledWith('⏳ Waiting 2 seconds before next batch...');
    });

    it('should handle empty entries list', async () => {
      mockEntry.getMany.mockResolvedValue({ items: [] });

      await deleteAllEntriesForContentType(
        'test-content-type',
        mockClient as PlainClientAPI,
        mockReadlineInterface,
        process.env.DELETE_CONTENT_TYPE_NAME
      );

      expect(consoleSpy.log).toHaveBeenCalledWith('✅ No entries found for this content type.');
      expect(mockEntry.delete).not.toHaveBeenCalled();
    });
  });
});
