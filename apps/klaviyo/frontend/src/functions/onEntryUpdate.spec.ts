import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SidebarExtensionSDK } from '@contentful/app-sdk';

// Mock the FieldMapping import from '../config/klaviyo'
vi.mock('../config/klaviyo', () => {
  // Return an object with the same interface used in services/klaviyo.ts
  return {
    FieldMapping: {
      // This is just a type, not used as a value
    },
    KLAVIYO_API_BASE_URL: 'https://a.klaviyo.com/api',
    API_PROXY_URL: '/api/klaviyo/proxy',
    APP_NAME: 'Contentful Klaviyo App',
    APP_ID: 'contentful-klaviyo-app',
    DEBUG_MODE: false,
  };
});

// Import the function to test directly
import { onEntryUpdate } from './onEntryUpdate';

// Mock KlaviyoService
const syncContentMock = vi.fn().mockResolvedValue([{ id: 'block123', success: true }]);
vi.mock('../services/klaviyo', () => {
  return {
    KlaviyoService: vi.fn().mockImplementation(() => ({
      syncContent: syncContentMock,
    })),
  };
});

// Import KlaviyoService after mocking
import { KlaviyoService } from '../services/klaviyo';
import logger from '../utils/logger';

describe('onEntryUpdate', () => {
  // Setup mock SDK and console spies
  const mockNotifier = {
    success: vi.fn(),
    error: vi.fn(),
  };

  // Create properly typed CMA mocks
  const assetGetMock = vi.fn().mockImplementation(({ assetId }) => {
    if (assetId === 'asset123') {
      return Promise.resolve({
        sys: { id: 'asset123', type: 'Asset' },
        fields: {
          file: {
            'en-US': {
              url: '//images.ctfassets.net/test-image.jpg',
              fileName: 'test-image.jpg',
            },
          },
          title: { 'en-US': 'Test Image' },
        },
      });
    }
    return Promise.reject(new Error(`Asset not found: ${assetId}`));
  });

  const entryGetMock = vi.fn().mockImplementation(({ entryId }) => {
    if (entryId === 'entry123') {
      return Promise.resolve({
        sys: { id: 'entry123', type: 'Entry' },
        fields: {
          title: { 'en-US': 'Referenced Entry Title' },
        },
      });
    }
    return Promise.reject(new Error(`Entry not found: ${entryId}`));
  });

  // Create a mock SDK
  const mockSdk = {
    parameters: {
      installation: {
        publicKey: 'test-public-key',
        privateKey: 'test-private-key',
        klaviyoClientId: 'test-client-id',
        klaviyoClientSecret: 'test-client-secret',
        klaviyoRedirectUri: 'https://test-redirect-uri.com',
      },
    },
    cma: {
      asset: {
        get: assetGetMock,
      },
      entry: {
        get: entryGetMock,
      },
    },
    notifier: mockNotifier,
    locales: {
      default: 'en-US',
    },
    ids: {
      entry: 'test-entry',
      contentType: 'test-type',
    },
    space: {
      getContentType: vi.fn().mockResolvedValue({
        fields: [],
      }),
      getAsset: vi.fn(),
    },
    entry: {
      fields: {},
    },
    user: {},
    dialogs: {},
    navigator: {
      openEntry: vi.fn(),
    },
  } as unknown as SidebarExtensionSDK;

  beforeEach(() => {
    vi.clearAllMocks();
    // Spy on console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock local storage for access token
    vi.spyOn(localStorage, 'getItem').mockImplementation((key) => {
      if (key === 'klaviyo_access_token') {
        return 'mock-access-token';
      }
      return null;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should process text fields correctly', async () => {
    // Create mock entry with text fields
    const entry = {
      sys: { id: 'test-entry', type: 'Entry' },
      fields: {
        title: {
          getValue: vi.fn().mockReturnValue('Test Title'),
        },
        description: {
          getValue: vi.fn().mockReturnValue('Test Description'),
        },
      },
    };

    // Create properly typed mappings for the test
    const mappings = [
      {
        contentfulFieldId: 'title',
        klaviyoBlockName: 'Title',
        fieldType: 'text',
        name: 'Title',
        type: 'text',
        severity: 'info',
        value: 'Test Title',
        // Add these to match the FieldMapping from config/klaviyo.ts
        contentfulField: 'title',
        klaviyoField: 'Title',
        id: 'title',
      },
      {
        contentfulFieldId: 'description',
        klaviyoBlockName: 'Description',
        fieldType: 'text',
        name: 'Description',
        type: 'text',
        severity: 'info',
        value: 'Test Description',
        // Add these to match the FieldMapping from config/klaviyo.ts
        contentfulField: 'description',
        klaviyoField: 'Description',
        id: 'description',
      },
    ];

    // Call the function
    await onEntryUpdate({ entry, sdk: mockSdk, mappings });

    // Assert KlaviyoService constructor was called with correct config
    expect(KlaviyoService).toHaveBeenCalledWith({
      publicKey: 'test-public-key',
      privateKey: 'test-private-key',
    });

    // Assert syncContent was called
    expect(syncContentMock).toHaveBeenCalled();

    // Verify notifier was called
    expect(mockNotifier.success).toHaveBeenCalledWith('Content successfully synced to Klaviyo');
  });

  it('should handle empty mappings', async () => {
    const entry = {
      sys: { id: 'test-entry', type: 'Entry' },
      fields: {
        title: {
          getValue: vi.fn().mockReturnValue('Test Title'),
        },
      },
    };

    // Call with empty mappings
    await onEntryUpdate({ entry, sdk: mockSdk, mappings: [] });

    // Klaviyo service should not be initialized
    expect(KlaviyoService).not.toHaveBeenCalled();
  });

  it('should handle errors during sync process', async () => {
    // Mock a sync error
    syncContentMock.mockRejectedValueOnce(new Error('Sync error'));

    // Create test entry and mappings
    const entry = {
      sys: { id: 'test-entry', type: 'Entry' },
      fields: {
        title: {
          getValue: vi.fn().mockReturnValue('Test Title'),
        },
      },
    };

    const mappings = [
      {
        contentfulFieldId: 'title',
        klaviyoBlockName: 'Title',
        fieldType: 'text',
        name: 'Title',
        type: 'text',
        severity: 'info',
        value: 'Test Title',
        // Add these to match the FieldMapping from config/klaviyo.ts
        contentfulField: 'title',
        klaviyoField: 'Title',
        id: 'title',
      },
    ];

    // Call the function
    await onEntryUpdate({ entry, sdk: mockSdk, mappings });

    // Verify error handling
    expect(mockNotifier.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to sync content to Klaviyo')
    );
    expect(logger.error).toHaveBeenCalled();
  });
});
