import { vi } from 'vitest';

/**
 * Creates a properly typed localStorage mock for use in tests
 */
export const createLocalStorageMock = () => {
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

  return localStorageMock;
};

/**
 * Sets up the localStorage mock on the window object
 */
export const setupLocalStorageMock = () => {
  const mock = createLocalStorageMock();

  Object.defineProperty(window, 'localStorage', {
    value: mock,
    writable: true,
  });

  return mock;
};
