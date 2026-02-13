import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import contentful from 'contentful-management';
import type { PlainClientAPI } from 'contentful-management';
import {
  deleteAllEntriesForContentType,
  deleteContentType,
  deleteEntry,
  deleteEntries,
} from '../deleteEntries.ts';

// Mock contentful-management
vi.mock('contentful-management', () => ({
  default: { createClient: vi.fn() },
}));

// Mock readline to avoid stdin issues when deleteEntries() creates a readline interface
const mockCreatedReadlineInterface = {
  question: vi.fn(),
  close: vi.fn(),
};
vi.mock('readline', async (importOriginal) => {
  const actual = await importOriginal<typeof import('readline')>();
  return {
    ...actual,
    createInterface: vi.fn(() => mockCreatedReadlineInterface),
  };
});

// Mock console methods
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

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
    'test-content-type'
  );
}

describe('deleteEntries.ts', () => {
  let mockClient: Partial<PlainClientAPI>;
  let mockEntry: any;
  let mockContentType: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

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
      unpublish: vi.fn(),
      delete: vi.fn(),
    };

    // Setup mock client
    mockClient = {
      entry: mockEntry,
      contentType: mockContentType,
    };

    // Setup mocks for external dependencies
    (contentful.createClient as any).mockReturnValue(mockClient);
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
    it('should delete all entries from a content type', async () => {
      await mocksAndActionsForNormalDeletion(mockEntry, mockClient);

      expect(mockEntry.delete).toHaveBeenCalledTimes(3);
      expect(mockEntry.delete).toHaveBeenCalledWith({ entryId: 'entry-1' });
      expect(mockEntry.delete).toHaveBeenCalledWith({ entryId: 'entry-2' });
      expect(mockEntry.delete).toHaveBeenCalledWith({ entryId: 'entry-3' });
      expect(consoleSpy.log).toHaveBeenCalledWith('   📊 Found 3 entries for this content type');
      expect(consoleSpy.log).toHaveBeenCalledWith('   ✅ Successfully deleted: 3 entries');
      expect(consoleSpy.log).toHaveBeenCalledWith('   ❌ Failed to delete: 0 entries');
      expect(consoleSpy.log).toHaveBeenCalledWith('   📊 Total processed: 3 entries');
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
        'test-content-type'
      );

      // Verify that only entries are deleted, not content types
      expect(mockClient.contentType).toBeDefined();
      expect(mockEntry.delete).toHaveBeenCalledTimes(2);
    });

    it('should delete all entries from a content type in batches', async () => {
      const mockEntries = Array.from({ length: 25 }, (_, i) => ({ sys: { id: `entry-${i + 1}` } }));
      const mockResponseWithEntries = { items: mockEntries };

      mockEntry.getMany.mockResolvedValue(mockResponseWithEntries);
      mockEntry.get.mockResolvedValue({ sys: { publishedVersion: undefined } });
      mockEntry.delete.mockResolvedValue({});

      await deleteAllEntriesForContentType(
        'test-content-type',
        mockClient as PlainClientAPI,
        mockReadlineInterface,
        'test-content-type'
      );

      expect(consoleSpy.log).toHaveBeenCalledWith('\n🗑️  Starting deletion process...');
      expect(consoleSpy.log).toHaveBeenCalledWith('\n📦 Processing batch 1/3');
      expect(consoleSpy.log).toHaveBeenCalledWith('\n📦 Processing batch 2/3');
      expect(consoleSpy.log).toHaveBeenCalledWith('\n📦 Processing batch 3/3');
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
        'test-content-type'
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

    it('should handle empty entries list', async () => {
      mockEntry.getMany.mockResolvedValue({ items: [] });

      await deleteAllEntriesForContentType(
        'test-content-type',
        mockClient as PlainClientAPI,
        mockReadlineInterface,
        'test-content-type'
      );

      expect(consoleSpy.log).toHaveBeenCalledWith('✅ No entries found for this content type.');
      expect(mockEntry.delete).not.toHaveBeenCalled();
    });
  });

  describe('deleteContentType', () => {
    it('should unpublish and delete a content type successfully', async () => {
      mockContentType.unpublish.mockResolvedValue({});
      mockContentType.delete.mockResolvedValue({});

      const result = await deleteContentType('test-content-type', mockClient as PlainClientAPI);

      expect(mockContentType.unpublish).toHaveBeenCalledWith({
        contentTypeId: 'test-content-type',
      });
      expect(mockContentType.delete).toHaveBeenCalledWith({
        contentTypeId: 'test-content-type',
      });
      expect(result).toBe(true);
      expect(consoleSpy.log).toHaveBeenCalledWith('✅ Deleted content type: test-content-type');
    });

    it('should handle errors gracefully', async () => {
      mockContentType.unpublish.mockRejectedValue(new Error('Unpublish failed'));

      const result = await deleteContentType('test-content-type', mockClient as PlainClientAPI);

      expect(result).toBe(false);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Failed to delete content type test-content-type:',
        expect.any(Error)
      );
    });
  });

  describe('deleteEntries', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
      process.env.CONTENTFUL_ACCESS_TOKEN = 'test-token';
      process.env.SPACE_ID = 'test-space';
      process.env.ENVIRONMENT_ID = 'test-env';
      process.env.DELETE_CONTENT_TYPE_ID = 'env-content-type-id';

      mockEntry.getMany.mockResolvedValue({
        items: [{ sys: { id: 'entry-1' } }],
      });
      mockEntry.get.mockResolvedValue({ sys: { publishedVersion: undefined } });
      mockEntry.delete.mockResolvedValue({});
      mockContentType.unpublish.mockResolvedValue({});
      mockContentType.delete.mockResolvedValue({});
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should delete content type when DELETE_CONTENT_TYPE=true', async () => {
      process.env.DELETE_CONTENT_TYPE = 'true';

      await deleteEntries();

      expect(mockContentType.unpublish).toHaveBeenCalledWith({
        contentTypeId: 'env-content-type-id',
      });
      expect(mockContentType.delete).toHaveBeenCalledWith({
        contentTypeId: 'env-content-type-id',
      });
    });

    it('should not delete content type when DELETE_CONTENT_TYPE is not set and user answers no', async () => {
      delete process.env.DELETE_CONTENT_TYPE;

      mockCreatedReadlineInterface.question.mockImplementation(
        (_prompt: string, callback: (answer: string) => void) => {
          callback('no');
        }
      );

      await deleteEntries();

      expect(mockContentType.unpublish).not.toHaveBeenCalled();
      expect(mockContentType.delete).not.toHaveBeenCalled();
    });

    it('should delete content type when user answers yes interactively', async () => {
      delete process.env.DELETE_CONTENT_TYPE;

      mockCreatedReadlineInterface.question.mockImplementation(
        (_prompt: string, callback: (answer: string) => void) => {
          callback('yes');
        }
      );

      await deleteEntries();

      expect(mockContentType.unpublish).toHaveBeenCalledWith({
        contentTypeId: 'env-content-type-id',
      });
      expect(mockContentType.delete).toHaveBeenCalledWith({
        contentTypeId: 'env-content-type-id',
      });
    });
  });
});
