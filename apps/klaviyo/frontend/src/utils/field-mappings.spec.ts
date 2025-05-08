import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getFieldMappings } from './field-mappings';
import { SidebarExtensionSDK } from '@contentful/app-sdk';

// Mock the logger
vi.mock('./logger', () => ({
  default: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('field-mappings', () => {
  let mockSdk: any;

  beforeEach(() => {
    // Create a mock SDK
    mockSdk = {
      ids: {
        contentType: 'mockContentType',
      },
      parameters: {
        installation: {},
      },
    } as Partial<SidebarExtensionSDK>;

    vi.clearAllMocks();
  });

  describe('getFieldMappings', () => {
    it('should return an empty array if no content type ID is found', async () => {
      mockSdk.ids.contentType = undefined;

      const result = await getFieldMappings(mockSdk as SidebarExtensionSDK);

      expect(result).toEqual([]);
    });

    it('should return an empty array if no app parameters are found', async () => {
      mockSdk.parameters = undefined;

      const result = await getFieldMappings(mockSdk as SidebarExtensionSDK);

      expect(result).toEqual([]);
    });

    it('should return content type specific mappings if available', async () => {
      const mockMappings = [
        { contentfulFieldId: 'field1', klaviyoBlockName: 'block1', fieldType: 'text' },
        { contentfulFieldId: 'field2', klaviyoBlockName: 'block2', fieldType: 'image' },
      ];

      mockSdk.parameters.installation = {
        installation: {
          contentTypeMappings: {
            mockContentType: mockMappings,
          },
        },
      };

      const result = await getFieldMappings(mockSdk as SidebarExtensionSDK);

      expect(result).toEqual(mockMappings);
    });

    it('should return general field mappings if no content type specific mappings are found', async () => {
      const mockMappings = [
        { contentfulFieldId: 'field1', klaviyoBlockName: 'block1', fieldType: 'text' },
      ];

      mockSdk.parameters.installation = {
        installation: {
          fieldMappings: mockMappings,
        },
      };

      const result = await getFieldMappings(mockSdk as SidebarExtensionSDK);

      expect(result).toEqual(mockMappings);
    });

    it('should filter general mappings to the current content type if contentTypeId is specified', async () => {
      const mockMappings = [
        {
          contentfulFieldId: 'field1',
          klaviyoBlockName: 'block1',
          fieldType: 'text',
          contentTypeId: 'mockContentType',
        },
        {
          contentfulFieldId: 'field2',
          klaviyoBlockName: 'block2',
          fieldType: 'image',
          contentTypeId: 'otherContentType',
        },
      ];

      mockSdk.parameters.installation = {
        installation: {
          fieldMappings: mockMappings,
        },
      };

      const result = await getFieldMappings(mockSdk as SidebarExtensionSDK);

      expect(result).toEqual([mockMappings[0]]);
    });

    it('should fall back to installation parameters if app parameters cannot be accessed', async () => {
      const mockMappings = [
        { contentfulFieldId: 'field1', klaviyoBlockName: 'block1', fieldType: 'text' },
      ];

      // Setup to trigger the first catch block
      mockSdk.parameters = {
        installation: {
          fieldMappings: mockMappings,
        },
      };

      Object.defineProperty(mockSdk, 'parameters', {
        get: () => {
          // First access will throw for app parameters
          if (!mockSdk._accessed) {
            mockSdk._accessed = true;
            return {
              installation: {
                get: () => {
                  throw new Error('Test error');
                },
              },
            };
          }
          // Second access for installation parameters will work
          return { installation: { fieldMappings: mockMappings } };
        },
      });

      const result = await getFieldMappings(mockSdk as SidebarExtensionSDK);

      expect(result).toEqual(mockMappings);
    });

    it('should handle errors when accessing parameters and return an empty array', async () => {
      // Setup to trigger both catch blocks
      Object.defineProperty(mockSdk, 'parameters', {
        get: () => {
          throw new Error('Test error');
        },
      });

      const result = await getFieldMappings(mockSdk as SidebarExtensionSDK);

      expect(result).toEqual([]);
    });
  });
});
