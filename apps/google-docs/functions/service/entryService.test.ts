import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PlainClientAPI, EntryProps, ContentTypeProps } from 'contentful-management';
import { createEntriesFromPreview, EntryCreationResult } from './entryService';
import { EntryToCreate } from '../agents/documentParserAgent/schema';

// Mock CMA client
const createMockCMA = (): PlainClientAPI => {
  return {
    asset: {
      create: vi.fn(),
      processForAllLocales: vi.fn(),
      get: vi.fn(),
      publish: vi.fn(),
    },
    entry: {
      create: vi.fn(),
    },
  } as unknown as PlainClientAPI;
};

describe('createEntries', () => {
  let mockCMA: PlainClientAPI;
  const mockSpaceId = 'test-space-id';
  const mockEnvironmentId = 'test-environment-id';
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
    mockCMA = createMockCMA();
    vi.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should reject null CMA client', async () => {
      const result = await createEntriesFromPreview(null as any, [], {
        spaceId: mockSpaceId,
        environmentId: mockEnvironmentId,
        contentTypes: mockContentTypes,
      });

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('CMA client is required');
    });

    it('should reject undefined CMA client', async () => {
      const result = await createEntriesFromPreview(undefined as any, [], {
        spaceId: mockSpaceId,
        environmentId: mockEnvironmentId,
        contentTypes: mockContentTypes,
      });

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('CMA client is required');
    });

    it('should reject null entries array', async () => {
      const result = await createEntriesFromPreview(mockCMA, null as any, {
        spaceId: mockSpaceId,
        environmentId: mockEnvironmentId,
        contentTypes: mockContentTypes,
      });

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Entries array is required');
    });

    it('should reject undefined entries array', async () => {
      const result = await createEntriesFromPreview(mockCMA, undefined as any, {
        spaceId: mockSpaceId,
        environmentId: mockEnvironmentId,
        contentTypes: mockContentTypes,
      });

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Entries array is required');
    });

    it('should reject empty entries array', async () => {
      const result = await createEntriesFromPreview(mockCMA, [], {
        spaceId: mockSpaceId,
        environmentId: mockEnvironmentId,
        contentTypes: mockContentTypes,
      });

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Entries array cannot be empty');
    });

    it('should reject non-array entries', async () => {
      const result = await createEntriesFromPreview(mockCMA, {} as any, {
        spaceId: mockSpaceId,
        environmentId: mockEnvironmentId,
        contentTypes: mockContentTypes,
      });

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Entries must be an array');
    });

    it('should reject null config', async () => {
      const entries: EntryToCreate[] = [
        {
          contentTypeId: 'blogPost',
          fields: { title: { 'en-US': 'Test' } },
        },
      ];

      const result = await createEntriesFromPreview(mockCMA, entries, null as any);

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Config is required');
    });

    it('should reject empty spaceId', async () => {
      const entries: EntryToCreate[] = [
        {
          contentTypeId: 'blogPost',
          fields: { title: { 'en-US': 'Test' } },
        },
      ];

      const result = await createEntriesFromPreview(mockCMA, entries, {
        spaceId: '',
        environmentId: mockEnvironmentId,
        contentTypes: mockContentTypes,
      });

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('spaceId');
    });

    it('should reject empty environmentId', async () => {
      const entries: EntryToCreate[] = [
        {
          contentTypeId: 'blogPost',
          fields: { title: { 'en-US': 'Test' } },
        },
      ];

      const result = await createEntriesFromPreview(mockCMA, entries, {
        spaceId: mockSpaceId,
        environmentId: '',
        contentTypes: mockContentTypes,
      });

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('environmentId');
    });

    it('should reject null contentTypes', async () => {
      const entries: EntryToCreate[] = [
        {
          contentTypeId: 'blogPost',
          fields: { title: { 'en-US': 'Test' } },
        },
      ];

      const result = await createEntriesFromPreview(mockCMA, entries, {
        spaceId: mockSpaceId,
        environmentId: mockEnvironmentId,
        contentTypes: null as any,
      });

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('contentTypes');
    });

    it('should reject entry with null contentTypeId', async () => {
      const entries: EntryToCreate[] = [
        {
          contentTypeId: null as any,
          fields: { title: { 'en-US': 'Test' } },
        },
      ];

      const result = await createEntriesFromPreview(mockCMA, entries, {
        spaceId: mockSpaceId,
        environmentId: mockEnvironmentId,
        contentTypes: mockContentTypes,
      });

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

      const result = await createEntriesFromPreview(mockCMA, entries, {
        spaceId: mockSpaceId,
        environmentId: mockEnvironmentId,
        contentTypes: mockContentTypes,
      });

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

      const result = await createEntriesFromPreview(mockCMA, entries, {
        spaceId: mockSpaceId,
        environmentId: mockEnvironmentId,
        contentTypes: mockContentTypes,
      });

      expect(result.createdEntries).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('null value');
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

      vi.mocked(mockCMA.entry.create).mockResolvedValue(mockEntry);

      const entries: EntryToCreate[] = [
        {
          contentTypeId: 'blogPost',
          fields: { title: { 'en-US': 'Test Title' } },
        },
      ];

      const result = await createEntriesFromPreview(mockCMA, entries, {
        spaceId: mockSpaceId,
        environmentId: mockEnvironmentId,
        contentTypes: mockContentTypes,
      });

      expect(result.createdEntries).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(mockCMA.entry.create).toHaveBeenCalledWith(
        { spaceId: mockSpaceId, environmentId: mockEnvironmentId, contentTypeId: 'blogPost' },
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

      vi.mocked(mockCMA.entry.create).mockResolvedValue(mockEntry);

      const entries: EntryToCreate[] = [
        {
          contentTypeId: 'blogPost',
          fields: {
            title: { 'en-US': 'Test Title' },
            content: { 'en-US': 'Some content with <B>bold</B> text' },
          },
        },
      ];

      const result = await createEntriesFromPreview(mockCMA, entries, {
        spaceId: mockSpaceId,
        environmentId: mockEnvironmentId,
        contentTypes: mockContentTypes,
      });

      expect(result.createdEntries).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(mockCMA.entry.create).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle CMA API errors gracefully', async () => {
      const error = new Error('CMA API Error');
      vi.mocked(mockCMA.entry.create).mockRejectedValue(error);

      const entries: EntryToCreate[] = [
        {
          contentTypeId: 'blogPost',
          fields: { title: { 'en-US': 'Test Title' } },
        },
      ];

      const result = await createEntriesFromPreview(mockCMA, entries, {
        spaceId: mockSpaceId,
        environmentId: mockEnvironmentId,
        contentTypes: mockContentTypes,
      });

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
        fields: { title: { 'en-US': 'Test Title 1' } },
      } as unknown as EntryProps;

      vi.mocked(mockCMA.entry.create)
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

      const result = await createEntriesFromPreview(mockCMA, entries, {
        spaceId: mockSpaceId,
        environmentId: mockEnvironmentId,
        contentTypes: mockContentTypes,
      });

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

      vi.mocked(mockCMA.asset.create).mockResolvedValue(mockAsset);
      vi.mocked(mockCMA.asset.processForAllLocales).mockResolvedValue(mockAsset);
      vi.mocked(mockCMA.asset.get).mockResolvedValue(mockAsset);
      vi.mocked(mockCMA.asset.publish).mockResolvedValue(mockAsset);
      vi.mocked(mockCMA.entry.create).mockResolvedValue(mockEntry);

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

      const result = await createEntriesFromPreview(mockCMA, entries, {
        spaceId: mockSpaceId,
        environmentId: mockEnvironmentId,
        contentTypes: mockContentTypes,
      });

      expect(mockCMA.asset.create).toHaveBeenCalled();
      const assetCreateCall = vi.mocked(mockCMA.asset.create).mock.calls[0];
      expect(assetCreateCall[1].fields.title['en-US']).toBe('Alt text');
      expect(assetCreateCall[1].fields.file['en-US'].contentType).toBe('image/png');
      expect(assetCreateCall[1].fields.file['en-US'].fileName).toContain('.png');
    });
  });
});
