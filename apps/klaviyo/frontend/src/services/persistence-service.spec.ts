import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getSyncData, updateSyncData, STORAGE_KEY } from './persistence-service';
import { locations } from '@contentful/app-sdk';
import logger from '../utils/logger';
import * as sdkHelpers from '../utils/sdk-helpers';

// Mock the SDK helpers
vi.mock('../utils/sdk-helpers', () => ({
  getGlobalSDK: vi.fn(),
  getAppDefinitionId: vi.fn().mockReturnValue('app123'),
}));

// Mock the logger
vi.mock('../utils/logger', () => ({
  default: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('persistence-service', () => {
  const mockEntryLocation = locations.LOCATION_ENTRY_SIDEBAR;
  const mockConfigLocation = locations.LOCATION_APP_CONFIG;
  const mockMappings = [
    { contentfulFieldId: 'title', klaviyoBlockName: 'Title', fieldType: 'text' },
  ];

  // Mock localStorage
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  };

  // Mock global SDK
  const mockGlobalSDK = {
    location: {
      is: vi.fn(),
    },
    ids: {
      entry: 'entry123',
      space: 'space123',
      environment: 'env123',
      app: 'app123',
      contentType: 'contentType123',
    },
    app: {
      getParameters: vi.fn().mockResolvedValue({
        installation: {
          fieldMappings: mockMappings,
        },
      }),
      setParameters: vi.fn().mockResolvedValue({}),
      onConfigure: vi.fn().mockResolvedValue({}),
    },
  };

  // Setup global localStorage mock
  beforeEach(() => {
    vi.resetAllMocks();

    // Mock global localStorage
    global.localStorage = mockLocalStorage as any;

    // Reset mock counters
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();

    // Setup SDK helper mock
    (sdkHelpers.getGlobalSDK as jest.Mock).mockResolvedValue(mockGlobalSDK);

    // Reset logger mocks
    (logger.log as jest.Mock).mockClear();
    (logger.warn as jest.Mock).mockClear();
    (logger.error as jest.Mock).mockClear();
  });

  describe('getSyncData', () => {
    it('should get data from localStorage first', async () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockMappings));

      // Act
      const result = await getSyncData({} as any);

      // Assert
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
      expect(result).toEqual(mockMappings);
      expect(logger.log).toHaveBeenCalledWith(
        '[persistence] Retrieved mappings from localStorage:',
        mockMappings
      );
    });

    it('should get data from installation parameters if localStorage is empty', async () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue(null);
      mockGlobalSDK.app.getParameters.mockResolvedValue({
        installation: {
          fieldMappings: mockMappings,
        },
      });

      // Act
      const result = await getSyncData({} as any);

      // Assert
      expect(sdkHelpers.getGlobalSDK).toHaveBeenCalled();
      expect(mockGlobalSDK.app.getParameters).toHaveBeenCalled();
      expect(result).toEqual(mockMappings);
    });

    it('should return empty array if no mappings found in localStorage', async () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue(null);
      (sdkHelpers.getGlobalSDK as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await getSyncData({} as any);

      // Assert
      expect(result).toEqual([]);
      expect(logger.log).toHaveBeenCalledWith(
        '[persistence] No mappings found in localStorage or SDK'
      );
    });

    it('should return empty array if no mappings found in SDK parameters', async () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue(null);
      mockGlobalSDK.app.getParameters.mockResolvedValue({
        installation: {},
      });

      // Act
      const result = await getSyncData({} as any);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle errors and return empty array', async () => {
      // Arrange
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Test error');
      });

      // Act
      const result = await getSyncData({} as any);

      // Assert
      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        '[persistence] Error retrieving sync data:',
        expect.any(Error)
      );
    });
  });

  describe('updateSyncData', () => {
    it('should update localStorage', async () => {
      // Act
      await updateSyncData(mockMappings as any);

      // Assert
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify(mockMappings)
      );
      expect(logger.log).toHaveBeenCalledWith('[persistence] Saved mappings to localStorage');
    });

    it('should attempt to update SDK parameters', async () => {
      // Act
      await updateSyncData(mockMappings as any);

      // Assert
      expect(sdkHelpers.getGlobalSDK).toHaveBeenCalled();
      expect(mockGlobalSDK.app.getParameters).toHaveBeenCalled();
      expect(mockGlobalSDK.app.onConfigure).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith(
        '[persistence] Updated mappings in app parameters via CMA'
      );
    });

    it('should handle errors during storage update', async () => {
      // Arrange
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Test error');
      });

      // Act
      await updateSyncData(mockMappings as any);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        '[persistence] Error updating sync data:',
        expect.any(Error)
      );
    });
  });
});
