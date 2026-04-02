import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PageAppSDK } from '@contentful/app-sdk';
import type { EntryProps, ContentTypeProps } from 'contentful-management';
import {
  createEntriesFromPreview,
  createEntriesFromPreviewPayload,
} from '../../src/services/entryService';
import { EntryToCreate, type PreviewPayload } from '@types';
import { createMockSDK } from '../mocks';

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

  describe('Content types', () => {
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

  describe('Assets from agent payload', () => {
    it('should create assets and resolve Rich Text asset placeholders', async () => {
      const mockAsset: any = {
        sys: { id: 'createdAssetId00000000001', type: 'Asset' },
        fields: { title: { 'en-US': 'Alt text' } },
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
              'en-US': {
                nodeType: 'document',
                data: {},
                content: [
                  {
                    nodeType: 'embedded-asset-block',
                    data: {
                      target: {
                        sys: { id: 'img-0', type: 'Link', linkType: 'Asset' },
                      },
                    },
                    content: [],
                  },
                ],
              },
            },
          },
        },
      ];

      const result = await createEntriesFromPreview(
        mockSDK,
        entries,
        ['blogPost'],
        [
          {
            url: 'https://example.com/image.png',
            altText: 'Alt text',
            placeholderId: 'img-0',
            contentType: 'image/png',
            fileName: 'image.png',
          },
        ]
      );

      expect(mockSDK.cma.asset.create).toHaveBeenCalled();
      const assetCreateCall = vi.mocked(mockSDK.cma.asset.create).mock.calls[0];
      expect(assetCreateCall[1].fields.title['en-US']).toBe('Alt text');
      expect(assetCreateCall[1].fields.file['en-US'].contentType).toBe('image/png');
      expect(assetCreateCall[1].fields.file['en-US'].fileName).toContain('.png');

      const entryCreateCall = vi.mocked(mockSDK.cma.entry.create).mock.calls[0];
      const richText = entryCreateCall[1].fields.content['en-US'] as {
        content: Array<{ data?: { target?: { sys?: { id?: string } } } }>;
      };
      expect(richText.content[0].data?.target?.sys?.id).toBe('createdAssetId00000000001');

      expect(result.createdEntries).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });
  });
});

describe('createEntriesFromPreviewPayload', () => {
  let mockSDK: PageAppSDK;
  const mockContentTypes: ContentTypeProps[] = [
    {
      sys: { id: 'blogPost', type: 'ContentType' },
      name: 'Blog Post',
      fields: [{ id: 'title', name: 'Title', type: 'Symbol', required: true, localized: false }],
    } as ContentTypeProps,
  ];

  beforeEach(() => {
    mockSDK = createMockSDK() as PageAppSDK;
    vi.clearAllMocks();
    vi.mocked(mockSDK.cma.contentType.getMany).mockResolvedValue({
      items: mockContentTypes,
      total: mockContentTypes.length,
    } as any);
  });

  function buildPayload(overrides: Partial<PreviewPayload> = {}): PreviewPayload {
    return {
      entries: [],
      assets: [],
      referenceGraph: {},
      normalizedDocument: { documentId: '', contentBlocks: [], tables: [] },
      ...overrides,
    };
  }

  it('orders entry creation by referenceGraph.creationOrder when present', async () => {
    const entries: EntryToCreate[] = [
      {
        tempId: 'author_1',
        contentTypeId: 'blogPost',
        fields: { title: { 'en-US': 'Author first in payload array' } },
      },
      {
        tempId: 'post_1',
        contentTypeId: 'blogPost',
        fields: { title: { 'en-US': 'Post second in payload array' } },
      },
    ];

    vi.mocked(mockSDK.cma.entry.create)
      .mockResolvedValueOnce({
        sys: {
          id: 'entry-post',
          type: 'Entry',
          contentType: { sys: { id: 'blogPost', type: 'Link', linkType: 'ContentType' } },
        },
        fields: {},
      } as EntryProps)
      .mockResolvedValueOnce({
        sys: {
          id: 'entry-author',
          type: 'Entry',
          contentType: { sys: { id: 'blogPost', type: 'Link', linkType: 'ContentType' } },
        },
        fields: {},
      } as EntryProps);

    await createEntriesFromPreviewPayload(
      mockSDK,
      buildPayload({
        entries,
        referenceGraph: { creationOrder: ['post_1', 'author_1'] },
      })
    );

    const calls = vi.mocked(mockSDK.cma.entry.create).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[0][1].fields.title['en-US']).toBe('Post second in payload array');
    expect(calls[1][1].fields.title['en-US']).toBe('Author first in payload array');
  });

  it('remaps en-US field locales to the space default locale before create', async () => {
    mockSDK = createMockSDK() as PageAppSDK;
    mockSDK.locales.default = 'de-DE';

    vi.mocked(mockSDK.cma.contentType.getMany).mockResolvedValue({
      items: mockContentTypes,
      total: mockContentTypes.length,
    } as any);

    vi.mocked(mockSDK.cma.entry.create).mockResolvedValue({
      sys: {
        id: 'entry-1',
        type: 'Entry',
        contentType: { sys: { id: 'blogPost', type: 'Link', linkType: 'ContentType' } },
      },
      fields: {},
    } as EntryProps);

    await createEntriesFromPreviewPayload(
      mockSDK,
      buildPayload({
        entries: [
          {
            contentTypeId: 'blogPost',
            fields: { title: { 'en-US': 'German space title' } },
          },
        ],
      })
    );

    expect(mockSDK.cma.entry.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        fields: { title: { 'de-DE': 'German space title' } },
      })
    );
  });
});
