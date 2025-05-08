import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  storeAppDefinitionId,
  getAppDefinitionId,
  isSDKAvailable,
  getGlobalSDK,
  ensureAppParameters,
} from './sdk-helpers';

// Mock the logger
vi.mock('./logger', () => ({
  default: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('sdk-helpers', () => {
  // Store original window SDK and localStorage
  const originalWindowSdk = (window as any).sdk;
  const originalLocalStorage = window.localStorage;

  // Mock localStorage for tests
  const localStorageMock = {
    store: {} as Record<string, string>,
    getItem: vi.fn((key: string): string | null => {
      return localStorageMock.store[key] || null;
    }),
    setItem: vi.fn((key: string, value: string): void => {
      localStorageMock.store[key] = value;
    }),
    removeItem: vi.fn((key: string): void => {
      delete localStorageMock.store[key];
    }),
    clear: vi.fn((): void => {
      localStorageMock.store = {};
    }),
  };

  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock.store = {};
    vi.clearAllMocks();

    // Install the mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Reset window.sdk for each test
    delete (window as any).sdk;
  });

  afterEach(() => {
    // Restore original window SDK and localStorage
    (window as any).sdk = originalWindowSdk;

    // Restore original localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
  });

  describe('storeAppDefinitionId', () => {
    it('should store app definition ID in localStorage', () => {
      const appDefinitionId = 'test-app-def-123';
      storeAppDefinitionId(appDefinitionId);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('appDefinitionId', appDefinitionId);
    });

    it('should not store if appDefinitionId is empty', () => {
      storeAppDefinitionId('');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();

      storeAppDefinitionId(null as any);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();

      storeAppDefinitionId(undefined as any);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should handle localStorage errors', () => {
      // Mock localStorage to throw error
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('localStorage error');
      });

      const appDefinitionId = 'test-app-def-123';
      // Should not throw
      expect(() => storeAppDefinitionId(appDefinitionId)).not.toThrow();
    });
  });

  describe('getAppDefinitionId', () => {
    it('should retrieve app definition ID from localStorage', () => {
      const appDefinitionId = 'test-app-def-123';

      // Setup mock to return a value
      localStorageMock.store['appDefinitionId'] = appDefinitionId;

      const result = getAppDefinitionId();
      expect(result).toBe(appDefinitionId);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('appDefinitionId');
    });

    it('should return null if app definition ID is not stored', () => {
      const result = getAppDefinitionId();
      expect(result).toBeNull();
    });
  });

  describe('isSDKAvailable', () => {
    it('should return true when SDK is available and initialized', () => {
      // Mock SDK
      (window as any).sdk = {
        ids: {
          app: 'test-app-id',
          space: 'test-space-id',
          environment: 'test-env',
        },
        app: { onConfigure: vi.fn() },
        location: { is: vi.fn() },
        parameters: { installation: {} },
      };

      const result = isSDKAvailable();
      expect(result).toBe(true);
    });

    it('should return false when SDK is not available', () => {
      const result = isSDKAvailable();
      expect(result).toBe(false);
    });

    it('should return false when SDK is partially initialized', () => {
      // Mock incomplete SDK
      (window as any).sdk = {
        ids: { app: 'test-app-id' },
        // Missing other required properties
      };

      const result = isSDKAvailable();
      expect(result).toBe(false);
    });
  });

  describe('getGlobalSDK', () => {
    it('should return the SDK immediately when available', async () => {
      // Mock SDK
      const mockSdk = {
        ids: {
          app: 'test-app-id',
          space: 'test-space-id',
          environment: 'test-env',
        },
        app: { onConfigure: vi.fn() },
        location: { is: vi.fn() },
        parameters: { installation: {} },
      };
      (window as any).sdk = mockSdk;

      const result = await getGlobalSDK();
      expect(result).toBe(mockSdk);
    });

    it('should retry and eventually return null when SDK not available', async () => {
      // Override the retry constants for testing
      const originalRetryDelay = (getGlobalSDK as any).RETRY_DELAY;
      const originalMaxRetries = (getGlobalSDK as any).MAX_RETRIES;

      // Mock fake timers
      vi.useFakeTimers();

      // Start the getGlobalSDK call
      const sdkPromise = getGlobalSDK(1); // Only 1 retry to speed up test

      // Advance timers
      await vi.runAllTimersAsync();

      // Now resolve the promise
      const result = await sdkPromise;

      // Verify result
      expect(result).toBeNull();

      // Restore timers and original values
      vi.useRealTimers();
    });

    it('should retry and succeed when SDK becomes available', async () => {
      // Mock fake timers
      vi.useFakeTimers();

      // Start the call (don't await yet)
      const sdkPromise = getGlobalSDK(1); // Just 1 retry

      // After "some time" make SDK available
      setTimeout(() => {
        // Mock SDK
        const mockSdk = {
          ids: {
            app: 'test-app-id',
            space: 'test-space-id',
            environment: 'test-env',
          },
          app: { onConfigure: vi.fn() },
          location: { is: vi.fn() },
          parameters: { installation: {} },
        };
        (window as any).sdk = mockSdk;
      }, 200); // Before the retry

      // Advance timers
      await vi.runAllTimersAsync();

      // Get the result
      const result = await sdkPromise;

      // Verify - this should be defined
      expect(result).toBeDefined();
      expect(result).not.toBeNull();

      // Restore timers
      vi.useRealTimers();
    });
  });

  describe('ensureAppParameters', () => {
    it('should do nothing if parameters are already initialized', async () => {
      // Mock SDK with parameters
      const mockSdk = {
        app: {
          getParameters: vi.fn().mockResolvedValue({
            installation: {
              publicKey: 'test-key',
              privateKey: 'test-secret',
            },
          }),
          setParameters: vi.fn(),
        },
      };

      await ensureAppParameters(mockSdk as any);
      // setParameters should not be called
      expect(mockSdk.app.setParameters).not.toHaveBeenCalled();
    });

    it('should initialize parameters if they are missing', async () => {
      // Mock SDK without parameters
      const mockSdk = {
        app: {
          getParameters: vi.fn().mockResolvedValue(null),
          setParameters: vi.fn().mockResolvedValue({}),
        },
        parameters: {
          installation: {},
        },
      };

      await ensureAppParameters(mockSdk as any);

      // Parameters should be initialized
      expect(mockSdk.app.setParameters).toHaveBeenCalledWith({
        installation: {
          fieldMappings: [],
        },
      });
    });

    it('should handle errors during parameter initialization', async () => {
      // Mock SDK that throws error
      const mockSdk = {
        app: {
          getParameters: vi.fn().mockRejectedValue(new Error('API error')),
          setParameters: vi.fn(),
        },
      };

      // Should not throw
      await expect(ensureAppParameters(mockSdk as any)).resolves.not.toThrow();
    });

    it('should handle missing SDK gracefully', async () => {
      // Should not throw with null SDK
      await expect(ensureAppParameters(null as any)).resolves.not.toThrow();
    });
  });
});
