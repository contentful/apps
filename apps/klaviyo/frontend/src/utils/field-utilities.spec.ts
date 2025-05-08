import { vi, describe, it, expect } from 'vitest';
import { getFieldDetails } from './field-utilities';

describe('field-utilities', () => {
  describe('getFieldDetails', () => {
    it('should handle text fields correctly', async () => {
      // Setup
      const fieldId = 'title';
      const isAsset = false;
      const mockContentType = {
        fields: [
          {
            id: 'title',
            name: 'Title',
            type: 'Symbol',
            localized: true,
            required: true,
          },
        ],
      };
      const mockSdk = {
        space: {
          getContentType: vi.fn().mockResolvedValue(mockContentType),
        },
        entry: {
          fields: {
            title: {
              getValue: () => 'Sample Title',
            },
          },
        },
        ids: {
          contentType: 'blogPost',
        },
        locales: {
          default: 'en-US',
        },
      };

      // Act
      const result = await getFieldDetails(fieldId, isAsset, mockSdk as any);

      // Assert
      expect(result).toEqual({
        id: 'title',
        name: 'Title',
        type: 'Symbol',
        value: 'Sample Title',
        contentTypeId: 'blogPost',
        isAsset: false,
      });
      expect(mockSdk.space.getContentType).toHaveBeenCalledWith('blogPost');
    });

    it('should handle reference fields correctly', async () => {
      // Setup
      const fieldId = 'author';
      const isAsset = false;
      const mockContentType = {
        fields: [
          {
            id: 'author',
            name: 'Author',
            type: 'Link',
            linkType: 'Entry',
            required: false,
          },
        ],
      };
      const mockSdk = {
        space: {
          getContentType: vi.fn().mockResolvedValue(mockContentType),
        },
        entry: {
          fields: {
            author: {
              getValue: () => ({
                sys: {
                  id: 'author123',
                },
              }),
            },
          },
        },
        ids: {
          contentType: 'blogPost',
        },
        locales: {
          default: 'en-US',
        },
      };

      // Act
      const result = await getFieldDetails(fieldId, isAsset, mockSdk as any);

      // Assert
      expect(result).toEqual({
        id: 'author',
        name: 'Author',
        type: 'Link',
        value: {
          sys: {
            id: 'author123',
          },
        },
        contentTypeId: 'blogPost',
        isAsset: false,
      });
    });

    it('should handle array fields correctly', async () => {
      // Setup
      const fieldId = 'tags';
      const isAsset = false;
      const mockContentType = {
        fields: [
          {
            id: 'tags',
            name: 'Tags',
            type: 'Array',
            items: {
              type: 'Symbol',
            },
            required: false,
          },
        ],
      };
      const mockSdk = {
        space: {
          getContentType: vi.fn().mockResolvedValue(mockContentType),
        },
        entry: {
          fields: {
            tags: {
              getValue: () => ['tech', 'news', 'tutorial'],
            },
          },
        },
        ids: {
          contentType: 'blogPost',
        },
        locales: {
          default: 'en-US',
        },
      };

      // Act
      const result = await getFieldDetails(fieldId, isAsset, mockSdk as any);

      // Assert
      expect(result).toEqual({
        id: 'tags',
        name: 'Tags',
        type: 'Array',
        value: ['tech', 'news', 'tutorial'],
        contentTypeId: 'blogPost',
        isAsset: false,
      });
    });

    it('should handle asset fields correctly', async () => {
      // Setup
      const fieldId = 'featuredImage';
      const isAsset = true;
      const mockContentType = {
        fields: [
          {
            id: 'featuredImage',
            name: 'Featured Image',
            type: 'Link',
            linkType: 'Asset',
            required: false,
          },
        ],
      };
      const mockAsset = {
        fields: {
          file: {
            'en-US': {
              url: '//images.ctfassets.net/test/image.jpg',
              fileName: 'image.jpg',
              contentType: 'image/jpeg',
            },
          },
          title: {
            'en-US': 'Featured Image',
          },
        },
        sys: {
          id: 'asset123',
        },
      };
      const mockSdk = {
        space: {
          getContentType: vi.fn().mockResolvedValue(mockContentType),
          getAsset: vi.fn().mockResolvedValue(mockAsset),
        },
        entry: {
          fields: {
            featuredImage: {
              getValue: () => ({ sys: { id: 'asset123' } }),
            },
          },
        },
        ids: {
          contentType: 'blogPost',
          entry: 'entry123',
        },
        locales: {
          default: 'en-US',
        },
      };

      // Act
      const result = await getFieldDetails(fieldId, isAsset, mockSdk as any);

      // Assert
      expect(result).toEqual({
        id: 'featuredImage',
        name: 'Featured Image',
        type: 'Link',
        value: { sys: { id: 'asset123' } },
        contentTypeId: 'blogPost',
        isAsset: true,
        assetDetails: expect.arrayContaining([
          expect.objectContaining({
            id: 'asset123',
            title: 'Featured Image',
          }),
        ]),
      });
    });

    it('should handle errors during field processing', async () => {
      // Setup
      const fieldId = 'nonExistentField';
      const isAsset = false;
      const mockSdk = {
        space: {
          getContentType: vi.fn().mockRejectedValue(new Error('Content type error')),
        },
        entry: {
          fields: {},
        },
        ids: {
          contentType: 'blogPost',
        },
        locales: {
          default: 'en-US',
        },
      };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const result = await getFieldDetails(fieldId, isAsset, mockSdk as any);

      // Assert
      expect(result).toEqual({
        id: fieldId,
        name: fieldId,
        type: 'Unknown',
        value: null,
        isAsset: false,
        contentTypeId: 'blogPost',
      });
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
