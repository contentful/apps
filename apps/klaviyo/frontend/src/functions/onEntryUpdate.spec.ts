import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FieldMapping } from '../config/klaviyo';
import { SidebarExtensionSDK } from '@contentful/app-sdk';

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
        klaviyoApiKey: 'test-api-key',
        klaviyoCompanyId: 'test-company-id',
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

    // Create properly typed mappings
    const mappings: FieldMapping[] = [
      {
        contentfulFieldId: 'title',
        klaviyoBlockName: 'Title',
        fieldType: 'text',
        contentTypeId: 'test-type',
        fields: [],
        name: 'Title',
        type: 'text',
        value: 'Test Title',
        severity: 'info',
      },
      {
        contentfulFieldId: 'description',
        klaviyoBlockName: 'Description',
        fieldType: 'text',
        contentTypeId: 'test-type',
        fields: [],
        name: 'Description',
        type: 'text',
        value: 'Test Description',
        severity: 'info',
      },
    ];

    // Call the function
    await onEntryUpdate({ entry, sdk: mockSdk, mappings });

    // Assert KlaviyoService constructor was called with correct config
    expect(KlaviyoService).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      companyId: 'test-company-id',
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

    const mappings: FieldMapping[] = [
      {
        contentfulFieldId: 'title',
        klaviyoBlockName: 'Title',
        fieldType: 'text',
        contentTypeId: 'test-type',
        fields: [],
        name: 'Title',
        type: 'text',
        value: 'Test Title',
        severity: 'info',
      },
    ];

    // Call the function
    await onEntryUpdate({ entry, sdk: mockSdk, mappings });

    // Verify error handling
    expect(mockNotifier.error).toHaveBeenCalledWith(
      'Failed to sync content to Klaviyo. See console for details.'
    );
    expect(logger.error).toHaveBeenCalled();
  });
});
