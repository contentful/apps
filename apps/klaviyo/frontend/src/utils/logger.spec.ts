import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { logger, enableDebugLogging, disableDebugLogging } from './logger';

describe('logger', () => {
  // Store original localStorage
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

  // Spy on console methods
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Reset localStorage mock
    localStorageMock.store = {};

    // Install the mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Mock process.env for test environment
    vi.stubGlobal('process', {
      env: {
        NODE_ENV: 'production', // Start with production
        VITEST: undefined,
      },
    });

    // Mock hostname for development environment check
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'example.com', // Not localhost, so not development
      },
      writable: true,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();

    // Restore original localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
  });

  describe('in production mode', () => {
    it('should not call console.log by default', () => {
      logger.log('test message');
      expect(console.log).not.toHaveBeenCalled();
    });

    it('should not call console.warn by default', () => {
      logger.warn('test warning');
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should always call console.error', () => {
      logger.error('test error');
      expect(console.error).toHaveBeenCalledWith('test error');
    });

    it('should call console.log when debug is enabled', () => {
      // Mock debug flag enabled
      localStorageMock.store['klaviyo_debug_enabled'] = 'true';

      logger.log('test message');
      expect(console.log).toHaveBeenCalledWith('test message');
    });

    it('should call console.warn when debug is enabled', () => {
      // Mock debug flag enabled
      localStorageMock.store['klaviyo_debug_enabled'] = 'true';

      logger.warn('test warning');
      expect(console.warn).toHaveBeenCalledWith('test warning');
    });
  });

  describe('in development mode', () => {
    beforeEach(() => {
      // Mock localhost hostname to simulate development environment
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
      });
    });

    it('should call console.log', () => {
      logger.log('test message');
      expect(console.log).toHaveBeenCalledWith('test message');
    });

    it('should call console.warn', () => {
      logger.warn('test warning');
      expect(console.warn).toHaveBeenCalledWith('test warning');
    });

    it('should call console.error', () => {
      logger.error('test error');
      expect(console.error).toHaveBeenCalledWith('test error');
    });
  });

  describe('enableDebugLogging', () => {
    it('should set the debug flag in localStorage', () => {
      enableDebugLogging();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('klaviyo_debug_enabled', 'true');
    });

    it('should handle localStorage errors', () => {
      // Mock localStorage error
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      // This should not throw
      expect(() => enableDebugLogging()).not.toThrow();
    });
  });

  describe('disableDebugLogging', () => {
    it('should remove the debug flag from localStorage', () => {
      disableDebugLogging();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('klaviyo_debug_enabled');
    });

    it('should handle localStorage errors', () => {
      // Mock localStorage error
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      // This should not throw
      expect(() => disableDebugLogging()).not.toThrow();
    });
  });
});
