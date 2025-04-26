import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getSyncData, updateSyncData } from './persistence-service';
import { locations } from '@contentful/app-sdk';

describe('persistence-service', () => {
  const mockEntryLocation = locations.LOCATION_ENTRY_SIDEBAR;
  const mockConfigLocation = locations.LOCATION_APP_CONFIG;
  const mockMappings = [
    { contentfulFieldId: 'title', klaviyoBlockName: 'Title', fieldType: 'text' },
  ];

  // Mock sessionStorage
  const mockSessionStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  };

  // Setup global sessionStorage mock
  beforeEach(() => {
    vi.resetAllMocks();

    // Mock global sessionStorage
    global.sessionStorage = mockSessionStorage as any;

    // Reset mock counters
    mockSessionStorage.getItem.mockClear();
    mockSessionStorage.setItem.mockClear();
  });

  describe('getSyncData', () => {
    it('should get data from session storage in sidebar location', async () => {
      // Arrange
      const mockEntryId = 'entry123';
      const storageKey = `klaviyo-mappings-${mockEntryId}`;
      const mockSdk = {
        location: {
          is: vi.fn((loc) => loc === mockEntryLocation),
        },
        ids: {
          entry: mockEntryId,
        },
      };

      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(mockMappings));

      // Act
      const result = await getSyncData(mockSdk as any);

      // Assert
      expect(mockSdk.location.is).toHaveBeenCalledWith(mockEntryLocation);
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith(storageKey);
      expect(result).toEqual(mockMappings);
    });

    it('should get data from installation parameters in config location', async () => {
      // Arrange
      const mockSdk = {
        location: {
          is: vi.fn((loc) => loc === mockConfigLocation),
        },
        parameters: {
          installation: {
            mappings: mockMappings,
          },
        },
      };

      // Act
      const result = await getSyncData(mockSdk as any);

      // Assert
      expect(mockSdk.location.is).toHaveBeenCalledWith(mockConfigLocation);
      expect(result).toEqual(mockMappings);
    });

    it('should return empty array if no mappings found in session storage', async () => {
      // Arrange
      const mockEntryId = 'entry123';
      const mockSdk = {
        location: {
          is: vi.fn((loc) => loc === mockEntryLocation),
        },
        ids: {
          entry: mockEntryId,
        },
      };

      mockSessionStorage.getItem.mockReturnValue(null);

      // Act
      const result = await getSyncData(mockSdk as any);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array if no mappings found in config', async () => {
      // Arrange
      const mockSdk = {
        location: {
          is: vi.fn((loc) => loc === mockConfigLocation),
        },
        parameters: {
          installation: {},
        },
      };

      // Act
      const result = await getSyncData(mockSdk as any);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle errors and return empty array', async () => {
      // Arrange
      const mockSdk = {
        location: {
          is: vi.fn((loc) => loc === mockEntryLocation),
        },
        ids: {
          entry: 'entry123',
        },
      };

      // Mock sessionStorage.getItem to throw an error
      const mockError = new Error('Test error');
      mockSessionStorage.getItem.mockImplementation(() => {
        throw mockError;
      });

      // Console error spy
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      const result = await getSyncData(mockSdk as any);

      // Assert
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();

      // Restore console
      consoleSpy.mockRestore();
    });
  });

  describe('updateSyncData', () => {
    it('should update session storage in sidebar location', async () => {
      // Arrange
      const mockEntryId = 'entry123';
      const storageKey = `klaviyo-mappings-${mockEntryId}`;
      const mockSdk = {
        location: {
          is: vi.fn((loc) => loc === mockEntryLocation),
        },
        ids: {
          entry: mockEntryId,
        },
      };

      // Act
      await updateSyncData(mockSdk as any, mockMappings);

      // Assert
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        storageKey,
        JSON.stringify(mockMappings)
      );
    });

    it('should log message in config location', async () => {
      // Arrange
      const mockSdk = {
        location: {
          is: vi.fn((loc) => loc === mockConfigLocation),
        },
      };

      // Console log spy
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      await updateSyncData(mockSdk as any, mockMappings);

      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Config data will be saved'),
        expect.anything()
      );

      // Restore console
      consoleSpy.mockRestore();
    });

    it('should handle errors during storage update', async () => {
      // Arrange
      const mockSdk = {
        location: {
          is: vi.fn((loc) => loc === mockEntryLocation),
        },
        ids: {
          entry: 'entry123',
        },
      };

      // Mock sessionStorage.setItem to throw an error
      const mockError = new Error('Test error');
      mockSessionStorage.setItem.mockImplementation(() => {
        throw mockError;
      });

      // Console spy
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      await updateSyncData(mockSdk as any, mockMappings);

      // Assert
      expect(warnSpy).toHaveBeenCalled();

      // Restore console
      warnSpy.mockRestore();
    });
  });
});
