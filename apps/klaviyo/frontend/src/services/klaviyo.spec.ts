import { vi, describe, it, expect, beforeEach } from 'vitest';
import { KlaviyoService } from './klaviyo';
import axios from 'axios';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: vi.fn().mockResolvedValue({ data: { success: true } }),
      patch: vi.fn().mockResolvedValue({ data: { success: true } }),
    })),
  },
}));

describe('KlaviyoService', () => {
  const mockConfig = {
    apiKey: 'test-api-key',
    privateKey: 'test-private-key',
    listId: 'test-list-id',
    endpoint: 'profiles',
    companyId: 'test-company-id',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'test-redirect-uri',
  };

  let service: KlaviyoService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new KlaviyoService(mockConfig);
  });

  describe('initialization', () => {
    it('creates API clients with correct configuration', () => {
      expect(axios.create).toHaveBeenCalledTimes(2);
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Klaviyo-API-Key ${mockConfig.apiKey}`,
            revision: '2023-02-22',
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('createUniversalContentBlock', () => {
    it('calls API with correct parameters', async () => {
      // Arrange
      const name = 'Test Block';
      const content = '<p>Test content</p>';
      const mockProxyApi = {
        post: vi.fn().mockResolvedValue({ data: { id: 'block123', success: true } }),
      };
      (service as any).proxyApi = mockProxyApi;

      // Act
      const result = await service.createUniversalContentBlock(name, content);

      // Assert
      expect(mockProxyApi.post).toHaveBeenCalledWith('', {
        endpoint: '/template-universal-content',
        method: 'POST',
        data: {
          data: {
            type: 'template-universal-content',
            attributes: {
              name,
              definition: {
                content_type: 'block',
                type: 'text',
                data: {
                  content,
                  display_options: {},
                  styles: {},
                },
              },
            },
          },
        },
      });
      expect(result).toEqual({ id: 'block123', success: true });
    });

    it('handles JSON content properly', async () => {
      // Arrange
      const name = 'JSON Block';
      const content = { key: 'value' };
      const mockProxyApi = {
        post: vi.fn().mockResolvedValue({ data: { id: 'block456', success: true } }),
      };
      (service as any).proxyApi = mockProxyApi;

      // Act
      const result = await service.createUniversalContentBlock(name, JSON.stringify(content));

      // Assert
      expect(mockProxyApi.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          data: expect.objectContaining({
            data: expect.objectContaining({
              attributes: expect.objectContaining({
                definition: expect.objectContaining({
                  data: expect.objectContaining({
                    content: JSON.stringify(content),
                  }),
                }),
              }),
            }),
          }),
        })
      );
    });

    it('handles errors', async () => {
      // Arrange
      const name = 'Test Block';
      const content = 'Test content';
      const mockError = new Error('API error');
      const mockProxyApi = {
        post: vi.fn().mockRejectedValue(mockError),
      };
      (service as any).proxyApi = mockProxyApi;

      // Console error spy
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act & Assert
      await expect(service.createUniversalContentBlock(name, content)).rejects.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Error creating universal content block:', mockError);

      // Restore console
      consoleSpy.mockRestore();
    });
  });

  describe('uploadImage', () => {
    it('uploads image from URL', async () => {
      // Arrange
      const imageUrl = 'https://example.com/image.jpg';
      const name = 'Test Image';
      const mockResponse = {
        data: {
          id: 'image123',
          attributes: {
            url: 'https://klaviyo.com/image123.jpg',
          },
        },
      };
      const mockProxyApi = {
        post: vi.fn().mockResolvedValue({ data: mockResponse }),
      };
      (service as any).proxyApi = mockProxyApi;

      // Act
      const result = await service.uploadImage(imageUrl, name);

      // Assert
      expect(mockProxyApi.post).toHaveBeenCalledWith('', {
        data: {
          data: {
            type: 'image',
            attributes: {
              import_from_url: imageUrl,
              name,
            },
          },
        },
        endpoint: '/images/',
        method: 'POST',
      });
      expect(result).toEqual({
        id: 'image123',
        imageUrl: 'https://klaviyo.com/image123.jpg',
      });
    });

    it('prepends https: to Contentful URLs', async () => {
      // Arrange
      const imageUrl = '//images.ctfassets.net/space123/image.jpg';
      const name = 'Contentful Image';
      const mockResponse = {
        data: {
          id: 'image456',
          attributes: {
            url: 'https://klaviyo.com/image456.jpg',
          },
        },
      };
      const mockProxyApi = {
        post: vi.fn().mockResolvedValue({ data: mockResponse }),
      };
      (service as any).proxyApi = mockProxyApi;

      // Act
      const result = await service.uploadImage(imageUrl, name);

      // Assert
      expect(mockProxyApi.post).toHaveBeenCalledWith('', {
        data: {
          data: {
            type: 'image',
            attributes: {
              import_from_url: 'https:' + imageUrl,
              name,
            },
          },
        },
        endpoint: '/images/',
        method: 'POST',
      });
    });

    it('handles errors', async () => {
      // Arrange
      const imageUrl = 'https://example.com/image.jpg';
      const name = 'Test Image';
      const mockError = new Error('Upload failed');
      const mockProxyApi = {
        post: vi.fn().mockRejectedValue(mockError),
      };
      (service as any).proxyApi = mockProxyApi;

      // Console error spy
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act & Assert
      await expect(service.uploadImage(imageUrl, name)).rejects.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      // Restore console
      consoleSpy.mockRestore();
    });
  });

  describe('syncContent', () => {
    it('processes text fields correctly', async () => {
      // Arrange
      const mappings = [
        { contentfulFieldId: 'title', klaviyoBlockName: 'Title', fieldType: 'text' as 'text' },
      ];
      const entry = {
        fields: {
          title: {
            _fieldLocales: {
              'en-US': {
                _value: 'Test Title',
              },
            },
          },
        },
      };

      // Mock createUniversalContentBlock
      service.createUniversalContentBlock = vi.fn().mockResolvedValue({ id: 'block123' });

      // Act
      const result = await service.syncContent(mappings, entry);

      // Assert
      expect(service.createUniversalContentBlock).toHaveBeenCalledWith('Title', 'Test Title');
      expect(result).toEqual([{ id: 'block123' }]);
    });

    it('processes image fields correctly', async () => {
      // Arrange
      const mappings = [
        { contentfulFieldId: 'image', klaviyoBlockName: 'Image', fieldType: 'image' as 'image' },
      ];
      const entry = {
        fields: {
          image: {
            'en-US': {
              fields: {
                file: {
                  'en-US': {
                    url: '//images.ctfassets.net/image.jpg',
                  },
                },
                title: {
                  'en-US': 'Image Title',
                },
              },
            },
          },
        },
      };

      // Mock getAssetUrl and uploadImage
      (service as any).getAssetUrl = vi
        .fn()
        .mockReturnValue('https://images.ctfassets.net/image.jpg');
      service.uploadImage = vi
        .fn()
        .mockResolvedValue({ id: 'image123', imageUrl: 'https://klaviyo.com/image123.jpg' });

      // Act
      const result = await service.syncContent(mappings, entry);

      // Assert
      expect((service as any).getAssetUrl).toHaveBeenCalledWith(entry, 'image');
      expect(service.uploadImage).toHaveBeenCalledWith(
        'https://images.ctfassets.net/image.jpg',
        'Image'
      );
      expect(result).toEqual([{ id: 'image123', imageUrl: 'https://klaviyo.com/image123.jpg' }]);
    });

    it('handles JSON objects appropriately', async () => {
      // Arrange
      const mappings = [
        { contentfulFieldId: 'json', klaviyoBlockName: 'JSON Data', fieldType: 'text' as 'text' },
      ];
      const jsonObject = { name: 'Test', age: 30, active: true };
      const entry = {
        fields: {
          json: {
            _fieldLocales: {
              'en-US': {
                _value: JSON.stringify(jsonObject),
              },
            },
          },
        },
      };

      // Mock formatJsonObject and createUniversalContentBlock
      (service as any).formatJsonObject = vi
        .fn()
        .mockReturnValue('name: Test\nage: 30\nactive: true');
      service.createUniversalContentBlock = vi.fn().mockResolvedValue({ id: 'block123' });

      // Act
      const result = await service.syncContent(mappings, entry);

      // Assert
      expect((service as any).formatJsonObject).toHaveBeenCalled();
      expect(service.createUniversalContentBlock).toHaveBeenCalledWith(
        'JSON Data',
        'name: Test\nage: 30\nactive: true'
      );
      expect(result).toEqual([{ id: 'block123' }]);
    });

    it('handles errors during field processing', async () => {
      // Arrange
      const mappings = [
        { contentfulFieldId: 'title', klaviyoBlockName: 'Title', fieldType: 'text' as 'text' },
        { contentfulFieldId: 'image', klaviyoBlockName: 'Image', fieldType: 'image' as 'image' },
      ];
      const entry = {
        fields: {
          title: {
            _fieldLocales: {
              'en-US': {
                _value: 'Test Title',
              },
            },
          },
          image: {
            'en-US': {}, // Missing file data will cause an error
          },
        },
      };

      // Mock methods
      service.createUniversalContentBlock = vi.fn().mockResolvedValue({ id: 'block123' });
      (service as any).getAssetUrl = vi.fn().mockReturnValue(null);

      // Console error spy
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const result = await service.syncContent(mappings, entry);

      // Assert
      expect(service.createUniversalContentBlock).toHaveBeenCalledTimes(1); // Only for the title
      expect(result).toEqual([{ id: 'block123' }]); // Should still have the result from the successful title sync
      expect(consoleSpy).toHaveBeenCalled(); // Error should be logged

      // Restore console
      consoleSpy.mockRestore();
    });
  });
});
