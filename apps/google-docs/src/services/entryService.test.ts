import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PageAppSDK } from '@contentful/app-sdk';
import type { EntryProps, ContentTypeProps } from 'contentful-management';
import { createEntriesFromPreview } from './entryService';
import { EntryToCreate } from '../../functions/agents/documentParserAgent/schema';
import { createMockSDK } from '../../test/mocks';

describe('createEntriesFromPreview', () => {
  let mockSDK: PageAppSDK;
  const mockContentTypes: ContentTypeProps[] = [
    {
      sys: { id: 'blogPost', type: 'ContentType' },
      name: 'Blog Post',
      fields: [
        { id: 'title', name: 'Title', type: 'Symbol', required: true, localized: false },
        { id: 'content', name: 'Content', type: 'RichText', required: false, localized: false },
      ],
    } as ContentTypeProps,
  ];

  beforeEach(() => {
    mockSDK = createMockSDK();
    vi.clearAllMocks();
    // Mock contentType.getMany to return our mock content types
    vi.mocked(mockSDK.cma.contentType.getMany).mockResolvedValue({
      items: mockContentTypes,
      total: mockContentTypes.length,
    } as any);
  });

  describe('Input Validation', () => {
    it('should reject null SDK', async () => {
      const result = await createEntriesFromPreview(null as any, [], ['blogPost']);

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('SDK is required');
    });

    it('should reject undefined SDK', async () => {
      const result = await createEntriesFromPreview(undefined as any, [], ['blogPost']);

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('SDK is required');
    });

    it('should reject null entries array', async () => {
      const result = await createEntriesFromPreview(mockSDK, null as any, ['blogPost']);

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Entries array is required');
    });

    it('should reject undefined entries array', async () => {
      const result = await createEntriesFromPreview(mockSDK, undefined as any, ['blogPost']);

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Entries array is required');
    });

    it('should reject empty entries array', async () => {
      const result = await createEntriesFromPreview(mockSDK, [], ['blogPost']);

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Entries cannot be empty');
    });

    it('should reject non-array entries', async () => {
      const result = await createEntriesFromPreview(mockSDK, {} as any, ['blogPost']);

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Entries must be an array');
    });

    it('should reject null contentTypeIds', async () => {
      const entries: EntryToCreate[] = [
        {
          contentTypeId: 'blogPost',
          fields: { title: { 'en-US': 'Test' } },
        },
      ];

      const result = await createEntriesFromPreview(mockSDK, entries, null as any);

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('contentTypeIds');
    });

    it('should reject empty contentTypeIds array', async () => {
      const entries: EntryToCreate[] = [
        {
          contentTypeId: 'blogPost',
          fields: { title: { 'en-US': 'Test' } },
        },
      ];

      const result = await createEntriesFromPreview(mockSDK, entries, []);

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('contentTypeIds cannot be empty');
    });

    it('should reject entry with null contentTypeId', async () => {
      const entries: EntryToCreate[] = [
        {
          contentTypeId: null as any,
          fields: { title: { 'en-US': 'Test' } },
        },
      ];

      const result = await createEntriesFromPreview(mockSDK, entries, ['blogPost']);

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('contentTypeId');
    });

    it('should reject entry with null fields', async () => {
      const entries: EntryToCreate[] = [
        {
          contentTypeId: 'blogPost',
          fields: null as any,
        },
      ];

      const result = await createEntriesFromPreview(mockSDK, entries, ['blogPost']);

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('fields');
    });

    it('should reject entry with null field value', async () => {
      const entries: EntryToCreate[] = [
        {
          contentTypeId: 'blogPost',
          fields: { title: { 'en-US': null as any } },
        },
      ];

      const result = await createEntriesFromPreview(mockSDK, entries, ['blogPost']);

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('null value');
    });

    it('should handle no matching content types', async () => {
      vi.mocked(mockSDK.cma.contentType.getMany).mockResolvedValue({
        items: [],
        total: 0,
      } as any);

      const entries: EntryToCreate[] = [
        {
          contentTypeId: 'blogPost',
          fields: { title: { 'en-US': 'Test' } },
        },
      ];

      const result = await createEntriesFromPreview(mockSDK, entries, ['blogPost']);

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('No matching content types found');
    });
  });

  describe('Successful Entry Creation', () => {
    it('should create a simple entry without images', async () => {
      const mockEntry: EntryProps = {
        sys: {
          id: 'entry-1',
          type: 'Entry',
          contentType: { sys: { id: 'blogPost', type: 'Link', linkType: 'ContentType' } },
        },
        fields: { title: { 'en-US': 'Test Title' } },
      } as unknown as EntryProps;

      vi.mocked(mockSDK.cma.entry.create).mockResolvedValue(mockEntry);

      const entries: EntryToCreate[] = [
        {
          contentTypeId: 'blogPost',
          fields: { title: { 'en-US': 'Test Title' } },
        },
      ];

      const result = await createEntriesFromPreview(mockSDK, entries, ['blogPost']);

      expect(result.createdEntries).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(mockSDK.cma.entry.create).toHaveBeenCalledWith(
        {
          spaceId: mockSDK.ids.space,
          environmentId: mockSDK.ids.environment,
          contentTypeId: 'blogPost',
        },
        { fields: { title: { 'en-US': 'Test Title' } } }
      );
    });

    it('should handle entry with RichText field', async () => {
      const mockEntry: EntryProps = {
        sys: {
          id: 'entry-1',
          type: 'Entry',
          contentType: { sys: { id: 'blogPost', type: 'Link', linkType: 'ContentType' } },
        },
        fields: { content: { 'en-US': { nodeType: 'document', content: [] } } },
      } as unknown as EntryProps;

      vi.mocked(mockSDK.cma.entry.create).mockResolvedValue(mockEntry);

      const entries: EntryToCreate[] = [
        {
          contentTypeId: 'blogPost',
          fields: {
            title: { 'en-US': 'Test Title' },
            content: { 'en-US': 'Some content with <B>bold</B> text' },
          },
        },
      ];

      const result = await createEntriesFromPreview(mockSDK, entries, ['blogPost']);

      expect(result.createdEntries).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(mockSDK.cma.entry.create).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle CMA API errors gracefully', async () => {
      const error = new Error('CMA API Error');
      vi.mocked(mockSDK.cma.entry.create).mockRejectedValue(error);

      const entries: EntryToCreate[] = [
        {
          contentTypeId: 'blogPost',
          fields: { title: { 'en-US': 'Test Title' } },
        },
      ];

      const result = await createEntriesFromPreview(mockSDK, entries, ['blogPost']);

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].contentTypeId).toBe('blogPost');
      expect(result.errors[0].error).toContain('CMA API Error');
    });

    it('should continue processing other entries after one fails', async () => {
      const mockEntry1: EntryProps = {
        sys: {
          id: 'entry-1',
          type: 'Entry',
          contentType: { sys: { id: 'blogPost', type: 'Link', linkType: 'ContentType' } },
        },
        fields: { title: { 'en-US': 'Test Title 2' } },
      } as unknown as EntryProps;

      vi.mocked(mockSDK.cma.entry.create)
        .mockRejectedValueOnce(new Error('First entry failed'))
        .mockResolvedValueOnce(mockEntry1);

      const entries: EntryToCreate[] = [
        {
          contentTypeId: 'blogPost',
          fields: { title: { 'en-US': 'Test Title 1' } },
        },
        {
          contentTypeId: 'blogPost',
          fields: { title: { 'en-US': 'Test Title 2' } },
        },
      ];

      const result = await createEntriesFromPreview(mockSDK, entries, ['blogPost']);

      expect(result.createdEntries).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('First entry failed');
    });
  });

  describe('Image Metadata Extraction', () => {
    it('should extract image metadata from RichText with image tokens', async () => {
      const mockAsset: any = {
        sys: { id: 'asset-1', type: 'Asset' },
        fields: { title: { 'en-US': 'Test Image' } },
      };

      const mockEntry: EntryProps = {
        sys: {
          id: 'entry-1',
          type: 'Entry',
          contentType: { sys: { id: 'blogPost', type: 'Link', linkType: 'ContentType' } },
        },
        fields: {},
      } as EntryProps;

      vi.mocked(mockSDK.cma.asset.create).mockResolvedValue(mockAsset);
      vi.mocked(mockSDK.cma.asset.processForAllLocales).mockResolvedValue(mockAsset);
      vi.mocked(mockSDK.cma.entry.create).mockResolvedValue(mockEntry);

      const entries: EntryToCreate[] = [
        {
          contentTypeId: 'blogPost',
          fields: {
            content: {
              'en-US': 'Check out this image: ![Alt text](https://example.com/image.png)',
            },
          },
        },
      ];

      const result = await createEntriesFromPreview(mockSDK, entries, ['blogPost']);

      expect(mockSDK.cma.asset.create).toHaveBeenCalled();
      const assetCreateCall = vi.mocked(mockSDK.cma.asset.create).mock.calls[0];
      expect(assetCreateCall[1].fields.title['en-US']).toBe('Alt text');
      expect(assetCreateCall[1].fields.file['en-US'].contentType).toBe('image/png');
      expect(assetCreateCall[1].fields.file['en-US'].fileName).toContain('.png');
      expect(result.createdEntries).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });
  });
});
