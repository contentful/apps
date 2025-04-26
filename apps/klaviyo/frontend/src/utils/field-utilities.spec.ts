import { vi, describe, it, expect } from 'vitest';
import { getFieldDetails } from './field-utilities';

describe('field-utilities', () => {
  describe('getFieldDetails', () => {
    it('should return field details for a regular text field', async () => {
      // Arrange
      const fieldId = 'title';
      const isAsset = false;
      const mockSdk = {
        space: {
          getContentType: vi.fn().mockResolvedValue({
            fields: [
              {
                id: 'title',
                name: 'Title',
                type: 'Symbol',
              },
            ],
          }),
        },
        entry: {
          fields: {
            title: {
              getValue: vi.fn().mockReturnValue('Test Title'),
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
        value: 'Test Title',
        isAsset: false,
      });
      expect(mockSdk.space.getContentType).toHaveBeenCalledWith('blogPost');
    });

    it('should return field details with asset information', async () => {
      // Arrange
      const fieldId = 'image';
      const isAsset = true;
      const assetId = 'asset123';
      const mockSdk = {
        space: {
          getContentType: vi.fn().mockResolvedValue({
            fields: [
              {
                id: 'image',
                name: 'Image',
                type: 'Link',
              },
            ],
          }),
          getAsset: vi.fn().mockResolvedValue({
            sys: {
              id: assetId,
            },
            fields: {
              title: {
                'en-US': 'Test Image',
              },
              description: {
                'en-US': 'Test Description',
              },
              file: {
                'en-US': {
                  url: '//images.ctfassets.net/test.jpg',
                  fileName: 'test.jpg',
                  contentType: 'image/jpeg',
                },
              },
            },
          }),
        },
        entry: {
          fields: {
            image: {
              getValue: vi.fn().mockReturnValue({
                sys: {
                  id: assetId,
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
        id: 'image',
        name: 'Image',
        type: 'Link',
        value: {
          sys: {
            id: assetId,
          },
        },
        isAsset: true,
        assetDetails: [
          {
            id: assetId,
            title: 'Test Image',
            description: 'Test Description',
            url: '//images.ctfassets.net/test.jpg',
            fileName: 'test.jpg',
            contentType: 'image/jpeg',
          },
        ],
      });
      expect(mockSdk.space.getAsset).toHaveBeenCalledWith(assetId);
    });

    it('should handle multiple assets', async () => {
      // Arrange
      const fieldId = 'gallery';
      const isAsset = true;
      const assetIds = ['asset123', 'asset456'];
      const mockSdk = {
        space: {
          getContentType: vi.fn().mockResolvedValue({
            fields: [
              {
                id: 'gallery',
                name: 'Gallery',
                type: 'Array',
              },
            ],
          }),
          getAsset: vi
            .fn()
            .mockResolvedValueOnce({
              sys: { id: assetIds[0] },
              fields: {
                title: { 'en-US': 'Image 1' },
                description: { 'en-US': 'Description 1' },
                file: {
                  'en-US': {
                    url: '//images.ctfassets.net/image1.jpg',
                    fileName: 'image1.jpg',
                    contentType: 'image/jpeg',
                  },
                },
              },
            })
            .mockResolvedValueOnce({
              sys: { id: assetIds[1] },
              fields: {
                title: { 'en-US': 'Image 2' },
                description: { 'en-US': 'Description 2' },
                file: {
                  'en-US': {
                    url: '//images.ctfassets.net/image2.jpg',
                    fileName: 'image2.jpg',
                    contentType: 'image/jpeg',
                  },
                },
              },
            }),
        },
        entry: {
          fields: {
            gallery: {
              getValue: vi
                .fn()
                .mockReturnValue([{ sys: { id: assetIds[0] } }, { sys: { id: assetIds[1] } }]),
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
        id: 'gallery',
        name: 'Gallery',
        type: 'Array',
        value: [{ sys: { id: assetIds[0] } }, { sys: { id: assetIds[1] } }],
        isAsset: true,
        assetDetails: [
          {
            id: assetIds[0],
            title: 'Image 1',
            description: 'Description 1',
            url: '//images.ctfassets.net/image1.jpg',
            fileName: 'image1.jpg',
            contentType: 'image/jpeg',
          },
          {
            id: assetIds[1],
            title: 'Image 2',
            description: 'Description 2',
            url: '//images.ctfassets.net/image2.jpg',
            fileName: 'image2.jpg',
            contentType: 'image/jpeg',
          },
        ],
      });
    });

    it('should handle errors during field processing', async () => {
      // Arrange
      const fieldId = 'nonExistentField';
      const isAsset = false;
      const mockSdk = {
        space: {
          getContentType: vi.fn().mockResolvedValue({
            fields: [
              {
                id: 'title',
                name: 'Title',
                type: 'Symbol',
              },
            ],
          }),
        },
        entry: {
          fields: {
            title: {
              getValue: vi.fn().mockReturnValue('Test Title'),
            },
          },
        },
        ids: {
          contentType: 'blogPost',
        },
      };

      // Act
      const result = await getFieldDetails(fieldId, isAsset, mockSdk as any);

      // Assert
      expect(result).toEqual({
        id: fieldId,
        name: fieldId,
        type: 'Unknown',
        value: null,
        isAsset: false,
      });
    });

    it('should handle errors during asset retrieval', async () => {
      // Arrange
      const fieldId = 'image';
      const isAsset = true;
      const assetId = 'asset123';
      const mockSdk = {
        space: {
          getContentType: vi.fn().mockResolvedValue({
            fields: [
              {
                id: 'image',
                name: 'Image',
                type: 'Link',
              },
            ],
          }),
          getAsset: vi.fn().mockRejectedValue(new Error('Asset not found')),
        },
        entry: {
          fields: {
            image: {
              getValue: vi.fn().mockReturnValue({
                sys: {
                  id: assetId,
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
        id: fieldId,
        name: 'Image',
        type: 'Link',
        value: {
          sys: {
            id: assetId,
          },
        },
        isAsset: true,
      });
      // Should not have assetDetails since the asset retrieval failed
      expect(result.assetDetails).toBeUndefined();
    });
  });
});
