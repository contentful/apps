import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sendToKlaviyo, SyncContent, KlaviyoConfig } from './klaviyo-sync-service';

// Mock fetch
global.fetch = vi.fn();

describe('klaviyo-api-service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('sendToKlaviyo', () => {
    it('should throw error if API key is missing', async () => {
      // Arrange
      const config: KlaviyoConfig = {
        publicKey: '',
        endpoint: 'profiles',
      };
      const mappings = { email: 'email' };
      const entryData = {
        email: {
          id: 'email',
          name: 'Email',
          type: 'Symbol',
          value: 'test@example.com',
          isAsset: false,
        },
      };

      // Act & Assert
      await expect(sendToKlaviyo(config, mappings, entryData)).rejects.toThrow(
        'Klaviyo API key is required'
      );
    });

    it('should throw error if email or phone number is missing', async () => {
      // Arrange
      const config: KlaviyoConfig = {
        publicKey: 'test-api-key',
        endpoint: 'profiles',
      };
      const mappings = { name: 'full_name' };
      const entryData = {
        name: { id: 'name', name: 'Name', type: 'Symbol', value: 'John Doe', isAsset: false },
      };

      // Act & Assert
      await expect(sendToKlaviyo(config, mappings, entryData)).rejects.toThrow(
        'Either email or phone number is required for Klaviyo profiles'
      );
    });

    it('should send data to Klaviyo API successfully', async () => {
      // Arrange
      const config: KlaviyoConfig = {
        publicKey: 'test-api-key',
        endpoint: 'profiles',
      };
      const mappings = {
        email: 'email',
        name: 'full_name',
      };
      const entryData = {
        email: {
          id: 'email',
          name: 'Email',
          type: 'Symbol',
          value: 'test@example.com',
          isAsset: false,
        },
        name: { id: 'name', name: 'Name', type: 'Symbol', value: 'John Doe', isAsset: false },
      };

      // Mock fetch response
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ id: '123', success: true }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await sendToKlaviyo(config, mappings, entryData);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'https://a.klaviyo.com/api/v2/profiles',
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Klaviyo-API-Key test-api-key`,
        },
        body: JSON.stringify({
          data: {
            email: 'test@example.com',
            full_name: 'John Doe',
          },
        }),
      });
      expect(result).toEqual({ id: '123', success: true });
    });

    it('should throw error if API request fails', async () => {
      // Arrange
      const config: KlaviyoConfig = {
        publicKey: 'test-api-key',
        endpoint: 'profiles',
      };
      const mappings = { email: 'email' };
      const entryData = {
        email: {
          id: 'email',
          name: 'Email',
          type: 'Symbol',
          value: 'test@example.com',
          isAsset: false,
        },
      };

      // Mock fetch response
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({ error: 'Invalid API key' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(sendToKlaviyo(config, mappings, entryData)).rejects.toThrow(/Klaviyo API error/);
    });
  });

  describe('SyncContent', () => {
    it('should throw error if API key is missing', async () => {
      // Arrange
      const syncContent = new SyncContent({}, {});
      const mockSdk = {
        parameters: {
          installation: {},
        },
        entry: {
          getSys: vi.fn().mockReturnValue({ id: 'entry123' }),
          fields: {},
        },
      };
      const mappings = [
        { contentfulFieldId: 'title', klaviyoBlockName: 'Title', fieldType: 'text' },
      ];

      // Act & Assert
      await expect(syncContent.syncContent(mockSdk, mappings)).rejects.toThrow(
        'Klaviyo API key is missing'
      );
    });

    it('should process fields and call API', async () => {
      // Arrange
      const syncContent = new SyncContent({}, {});
      const mockSdk = {
        parameters: {
          installation: {
            publicKey: 'test-api-key',
            privateKey: 'test-private-key',
          },
        },
        entry: {
          getSys: vi.fn().mockReturnValue({ id: 'entry123' }),
          fields: {
            title: {
              getValue: vi.fn().mockReturnValue('Test Title'),
            },
            image: {
              getValue: vi.fn().mockReturnValue({
                sys: { id: 'asset123' },
              }),
            },
          },
        },
        space: {
          getAsset: vi.fn().mockResolvedValue({
            fields: {
              file: {
                'en-US': {
                  url: '//images.ctfassets.net/test.jpg',
                  fileName: 'test.jpg',
                },
              },
              title: {
                'en-US': 'Test Image',
              },
            },
          }),
        },
        locales: {
          default: 'en-US',
        },
        notifier: {
          success: vi.fn(),
          error: vi.fn(),
        },
      };

      const mappings = [
        { contentfulFieldId: 'title', klaviyoBlockName: 'Title', fieldType: 'text' },
        { contentfulFieldId: 'image', klaviyoBlockName: 'Image', fieldType: 'image' },
      ];

      // Mock fetch response
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await syncContent.syncContent(mockSdk, mappings);

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/klaviyo',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(requestBody).toHaveProperty('publicKey', 'test-api-key');
      expect(requestBody).toHaveProperty('mappings', mappings);
      expect(requestBody).toHaveProperty('entryId', 'entry123');
      expect(requestBody.fields).toHaveProperty('title');
      expect(requestBody.fields).toHaveProperty('image');

      expect(mockSdk.notifier.success).toHaveBeenCalledWith(
        'Content synced to Klaviyo successfully'
      );
      expect(result).toEqual({ success: true });
    });

    it('should handle errors during sync', async () => {
      // Arrange
      const syncContent = new SyncContent({}, {});
      const mockSdk = {
        parameters: {
          installation: {
            publicKey: 'test-api-key',
          },
        },
        entry: {
          getSys: vi.fn().mockReturnValue({ id: 'entry123' }),
          fields: {
            title: {
              getValue: vi.fn().mockReturnValue('Test Title'),
            },
          },
        },
        notifier: {
          success: vi.fn(),
          error: vi.fn(),
        },
      };

      const mappings = [
        { contentfulFieldId: 'title', klaviyoBlockName: 'Title', fieldType: 'text' },
      ];

      // Mock fetch response
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({ error: 'API Error' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(syncContent.syncContent(mockSdk, mappings)).rejects.toThrow(
        /Klaviyo sync error/
      );
      expect(mockSdk.notifier.error).toHaveBeenCalled();
    });
  });
});
