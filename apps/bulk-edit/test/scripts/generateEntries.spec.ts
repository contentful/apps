import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClient, PlainClientAPI } from 'contentful-management';
import {
  generateEntries,
  createContentTypeWithAllFields,
  createSampleEntry,
  batchEntries,
} from '../../src/scripts/generateEntries';

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

describe('generateEntries.ts', () => {
  let mockClient: Partial<PlainClientAPI>;
  let mockContentType: any;
  let mockEntry: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Reset environment variables to test values
    process.env = { ...originalEnv };

    // Setup mock content type
    mockContentType = {
      create: vi.fn(),
      publish: vi.fn(),
    };

    // Setup mock entry
    mockEntry = {
      create: vi.fn(),
      publish: vi.fn(),
    };

    // Setup mock client
    mockClient = {
      contentType: mockContentType,
      entry: mockEntry,
    };

    // Setup mocks for external dependencies only
    (createClient as any).mockReturnValue(mockClient);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createContentTypeWithAllFields', () => {
    it('should create a content type with all field types', async () => {
      const mockContentTypeProps = {
        sys: { id: 'test-content-type-id' },
        name: 'All Field Types',
        displayField: 'shortText',
        fields: [],
      };

      mockContentType.create.mockResolvedValue(mockContentTypeProps);
      mockContentType.publish.mockResolvedValue(mockContentTypeProps);

      const result = await createContentTypeWithAllFields(mockClient as PlainClientAPI);

      expect(mockContentType.create).toHaveBeenCalledWith(
        {},
        {
          name: 'All Field Types',
          displayField: 'shortText',
          description:
            'A comprehensive content type with all possible field types for testing the app integration',
          fields: expect.arrayContaining([
            expect.objectContaining({ id: 'shortText', type: 'Symbol' }),
            expect.objectContaining({ id: 'longText', type: 'Text' }),
            expect.objectContaining({ id: 'richText', type: 'RichText' }),
            expect.objectContaining({ id: 'integerNumber', type: 'Integer' }),
            expect.objectContaining({ id: 'decimalNumber', type: 'Number' }),
            expect.objectContaining({ id: 'dateTime', type: 'Date' }),
            expect.objectContaining({ id: 'boolean', type: 'Boolean' }),
            expect.objectContaining({ id: 'jsonObject', type: 'Object' }),
            expect.objectContaining({ id: 'location', type: 'Location' }),
            expect.objectContaining({ id: 'asset', type: 'Link', linkType: 'Asset' }),
            expect.objectContaining({ id: 'reference', type: 'Link', linkType: 'Entry' }),
            expect.objectContaining({
              id: 'symbolArray',
              type: 'Array',
              items: { type: 'Symbol' },
            }),
            expect.objectContaining({
              id: 'assetArray',
              type: 'Array',
              items: { type: 'Link', linkType: 'Asset' },
            }),
            expect.objectContaining({
              id: 'entryArray',
              type: 'Array',
              items: { type: 'Link', linkType: 'Entry' },
            }),
          ]),
        }
      );

      expect(mockContentType.publish).toHaveBeenCalledWith(
        { contentTypeId: 'test-content-type-id' },
        mockContentTypeProps
      );
      expect(result).toBe('test-content-type-id');
    });

    it('should handle content type creation errors gracefully', async () => {
      const mockError = new Error('Content type creation failed');
      mockContentType.create.mockRejectedValue(mockError);

      await expect(createContentTypeWithAllFields(mockClient as PlainClientAPI)).rejects.toThrow(
        'Content type creation failed'
      );

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Content type creation failed')
      );
    });

    it('should log progress messages during content type creation', async () => {
      const mockContentTypeProps = {
        sys: { id: 'test-content-type-id' },
        name: 'All Field Types',
        displayField: 'shortText',
        fields: [],
      };

      mockContentType.create.mockResolvedValue(mockContentTypeProps);
      mockContentType.publish.mockResolvedValue(mockContentTypeProps);

      await createContentTypeWithAllFields(mockClient as PlainClientAPI);

      expect(consoleSpy.log).toHaveBeenCalledWith('Creating content type: All Field Types');
      expect(consoleSpy.log).toHaveBeenCalledWith('Created content type: test-content-type-id');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '✅ Created and published content type: test-content-type-id'
      );
    });
  });

  describe('createSampleEntry', () => {
    it('should create an entry with correct field values', async () => {
      const mockEntryProps = {
        sys: { id: 'entry-1' },
        fields: {
          title: { 'en-US': 'Sample Entry 1' },
          shortText: { 'en-US': 'Sample Short Text' },
          longText: { 'en-US': expect.stringContaining('This is a sample long text field') },
          richText: { 'en-US': expect.objectContaining({ nodeType: 'document' }) },
          integerNumber: { 'en-US': 42 },
          decimalNumber: { 'en-US': 3.14159 },
          dateTime: { 'en-US': '2024-01-15T10:30:00.000Z' },
          boolean: { 'en-US': true },
          jsonObject: { 'en-US': { key: 'value', nested: { data: 'example' } } },
          location: { 'en-US': { lat: 40.7128, lon: -74.006 } },
          symbolArray: { 'en-US': ['Item 1', 'Item 2', 'Item 3'] },
        },
      };

      mockEntry.create.mockResolvedValue(mockEntryProps);
      mockEntry.publish.mockResolvedValue(mockEntryProps);

      const result = await createSampleEntry(
        'test-content-type-id',
        0,
        mockClient as PlainClientAPI
      );

      expect(mockEntry.create).toHaveBeenCalledWith(
        { contentTypeId: 'test-content-type-id' },
        expect.objectContaining({
          title: { 'en-US': 'Sample Entry 1' },
          fields: expect.objectContaining({
            shortText: { 'en-US': expect.stringContaining('Sample Short Text') },
            longText: { 'en-US': expect.stringContaining('This is a sample long text field') },
            richText: { 'en-US': expect.objectContaining({ nodeType: 'document' }) },
            integerNumber: { 'en-US': 42 },
            decimalNumber: { 'en-US': 3.14159 },
            dateTime: { 'en-US': '2024-01-15T10:30:00.000Z' },
            boolean: { 'en-US': true },
            jsonObject: { 'en-US': { key: 'value', nested: { data: 'example' } } },
            location: { 'en-US': { lat: 40.7128, lon: -74.006 } },
            symbolArray: { 'en-US': ['Item 1', 'Item 2', 'Item 3'] },
          }),
        })
      );

      expect(mockEntry.publish).toHaveBeenCalledWith({ entryId: 'entry-1' }, mockEntryProps);
      expect(result).toBe('entry-1');
    });

    it('should handle entry creation errors gracefully', async () => {
      const mockError = new Error('Entry creation failed');
      mockEntry.create.mockRejectedValue(mockError);

      await expect(
        createSampleEntry('test-content-type-id', 0, mockClient as PlainClientAPI)
      ).rejects.toThrow('Entry creation failed');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Entry 1 creation failed')
      );
    });

    it('should log progress messages during entry creation', async () => {
      const mockEntryProps = {
        sys: { id: 'entry-1' },
        fields: { title: { 'en-US': 'Sample Entry 1' } },
      };

      mockEntry.create.mockResolvedValue(mockEntryProps);
      mockEntry.publish.mockResolvedValue(mockEntryProps);

      await createSampleEntry('test-content-type-id', 0, mockClient as PlainClientAPI);

      expect(consoleSpy.log).toHaveBeenCalledWith('Creating sample entry 1...');
      expect(consoleSpy.log).toHaveBeenCalledWith('✅ Created sample entry: entry-1');
      expect(consoleSpy.log).toHaveBeenCalledWith('✅ Published sample entry 1');
    });
  });

  describe('batchEntries', () => {
    beforeEach(() => {
      // Setup successful content type creation for batch tests
      const mockContentTypeProps = {
        sys: { id: 'test-content-type-id' },
        name: 'All Field Types',
        displayField: 'shortText',
        fields: [],
      };

      mockContentType.create.mockResolvedValue(mockContentTypeProps);
      mockContentType.publish.mockResolvedValue(mockContentTypeProps);
    });

    it('should create entries in batches', async () => {
      const mockEntryProps = {
        sys: { id: 'entry-1' },
        fields: { title: { 'en-US': 'Sample Entry 1' } },
      };

      mockEntry.create.mockResolvedValue(mockEntryProps);
      mockEntry.publish.mockResolvedValue(mockEntryProps);

      await batchEntries(25, 'test-content-type-id', mockClient as PlainClientAPI);

      // Should create 25 entries (3 batches: 10, 10, 5)
      expect(mockEntry.create).toHaveBeenCalledTimes(25);
      expect(mockEntry.publish).toHaveBeenCalledTimes(25);
    });

    it('should handle batch failures gracefully', async () => {
      const mockError = new Error('Batch creation failed');
      mockEntry.create.mockRejectedValue(mockError);

      await batchEntries(5, 'test-content-type-id', mockClient as PlainClientAPI);

      // Check that individual entry errors are logged
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Entry 1 creation failed')
      );
      // Check that batch error is also logged (with the actual format)
      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Batch 1 failed:', expect.any(Error));
    });

    it('should log batch processing information', async () => {
      const mockEntryProps = {
        sys: { id: 'entry-1' },
        fields: { title: { 'en-US': 'Sample Entry 1' } },
      };

      mockEntry.create.mockResolvedValue(mockEntryProps);
      mockEntry.publish.mockResolvedValue(mockEntryProps);

      await batchEntries(15, 'test-content-type-id', mockClient as PlainClientAPI);

      expect(consoleSpy.log).toHaveBeenCalledWith('Creating 15 entries in batches...');
      expect(consoleSpy.log).toHaveBeenCalledWith('\n📦 Processing batch 1/2');
      expect(consoleSpy.log).toHaveBeenCalledWith('✅ Completed batch 1');
      expect(consoleSpy.log).toHaveBeenCalledWith('⏳ Waiting 1 second before next batch...');
      expect(consoleSpy.log).toHaveBeenCalledWith('\n📦 Processing batch 2/2');
      expect(consoleSpy.log).toHaveBeenCalledWith('✅ Completed batch 2');
    });

    it('should log summary information at the end', async () => {
      const mockEntryProps = {
        sys: { id: 'entry-1' },
        fields: { title: { 'en-US': 'Sample Entry 1' } },
      };

      mockEntry.create.mockResolvedValue(mockEntryProps);
      mockEntry.publish.mockResolvedValue(mockEntryProps);

      await batchEntries(5, 'test-content-type-id', mockClient as PlainClientAPI);

      expect(consoleSpy.log).toHaveBeenCalledWith('\n📊 Creation Summary:');
      expect(consoleSpy.log).toHaveBeenCalledWith('   ✅ Successfully created: 5 entries');
      expect(consoleSpy.log).toHaveBeenCalledWith('   ❌ Failed to create: 0 entries');
      expect(consoleSpy.log).toHaveBeenCalledWith('   📊 Total processed: 5 entries');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '\n🎉 Success! Content type generation complete.'
      );
      expect(consoleSpy.log).toHaveBeenCalledWith('\n📋 Summary:');
      expect(consoleSpy.log).toHaveBeenCalledWith('   • Content Type ID: test-content-type-id');
      expect(consoleSpy.log).toHaveBeenCalledWith('   • Total Fields: 14');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '   • Field Types: Symbol, Text, RichText, Integer, Number, Date, Boolean, Object, Location, Link, Link, Array, Array, Array'
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '\n🔗 You can now use this content type to test the app integration.'
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '   Visit your Contentful space to see the new content type and sample entry.'
      );
    });
  });

  describe('generateEntries (main function)', () => {
    it('should use AMOUNT_OF_ENTRIES environment variable when available', async () => {
      process.env.AMOUNT_OF_ENTRIES = '10';

      const mockContentTypeProps = {
        sys: { id: 'test-content-type-id' },
        name: 'All Field Types',
        displayField: 'shortText',
        fields: [],
      };

      mockContentType.create.mockResolvedValue(mockContentTypeProps);
      mockContentType.publish.mockResolvedValue(mockContentTypeProps);

      const mockEntryProps = {
        sys: { id: 'entry-1' },
        fields: { title: { 'en-US': 'Sample Entry 1' } },
      };

      mockEntry.create.mockResolvedValue(mockEntryProps);
      mockEntry.publish.mockResolvedValue(mockEntryProps);

      await generateEntries();

      expect(mockEntry.create).toHaveBeenCalledTimes(10);
      expect(mockEntry.publish).toHaveBeenCalledTimes(10);
    });

    it('should handle errors during execution', async () => {
      const mockError = new Error('Script execution failed');
      mockContentType.create.mockRejectedValue(mockError);

      await expect(generateEntries()).rejects.toThrow('Script execution failed');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Content type creation failed')
      );
    });
  });

  describe('Field Types Configuration', () => {
    it('should include all required field types', async () => {
      const mockContentTypeProps = {
        sys: { id: 'test-content-type-id' },
        name: 'All Field Types',
        displayField: 'shortText',
        fields: [],
      };

      mockContentType.create.mockResolvedValue(mockContentTypeProps);
      mockContentType.publish.mockResolvedValue(mockContentTypeProps);

      await createContentTypeWithAllFields(mockClient as PlainClientAPI);

      const callArgs = mockContentType.create.mock.calls[0];
      const fields = callArgs[1].fields;

      // Check that all field types are included
      const fieldIds = fields.map((f: any) => f.id);
      expect(fieldIds).toContain('shortText');
      expect(fieldIds).toContain('longText');
      expect(fieldIds).toContain('richText');
      expect(fieldIds).toContain('integerNumber');
      expect(fieldIds).toContain('decimalNumber');
      expect(fieldIds).toContain('dateTime');
      expect(fieldIds).toContain('boolean');
      expect(fieldIds).toContain('jsonObject');
      expect(fieldIds).toContain('location');
      expect(fieldIds).toContain('asset');
      expect(fieldIds).toContain('reference');
      expect(fieldIds).toContain('symbolArray');
      expect(fieldIds).toContain('assetArray');
      expect(fieldIds).toContain('entryArray');

      expect(fields).toHaveLength(14);
    });

    it('should configure field properties correctly', async () => {
      const mockContentTypeProps = {
        sys: { id: 'test-content-type-id' },
        name: 'All Field Types',
        displayField: 'shortText',
        fields: [],
      };

      mockContentType.create.mockResolvedValue(mockContentTypeProps);
      mockContentType.publish.mockResolvedValue(mockContentTypeProps);

      await createContentTypeWithAllFields(mockClient as PlainClientAPI);

      const callArgs = mockContentType.create.mock.calls[0];
      const fields = callArgs[1].fields;

      // Check field properties
      const shortTextField = fields.find((f: any) => f.id === 'shortText');
      expect(shortTextField).toEqual({
        id: 'shortText',
        name: 'Short Text',
        type: 'Symbol',
        required: false,
        localized: false,
        validations: [],
        disabled: false,
        omitted: false,
      });

      const linkField = fields.find((f: any) => f.id === 'asset');
      expect(linkField).toEqual({
        id: 'asset',
        name: 'Asset',
        type: 'Link',
        linkType: 'Asset',
        required: false,
        localized: false,
        validations: [],
        disabled: false,
        omitted: false,
      });

      const arrayField = fields.find((f: any) => f.id === 'symbolArray');
      expect(arrayField).toEqual({
        id: 'symbolArray',
        name: 'Symbol Array',
        type: 'Array',
        items: { type: 'Symbol' },
        required: false,
        localized: false,
        validations: [],
        disabled: false,
        omitted: false,
      });
    });
  });
});
