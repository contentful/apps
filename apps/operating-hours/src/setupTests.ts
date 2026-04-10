// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

configure({
  testIdAttribute: 'data-test-id',
});

// Minimal ResizeObserver shim for jsdom environment used in tests
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserver;

const localStorageStore = new Map<string, string>();

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: (key: string) => localStorageStore.get(key) ?? null,
    setItem: (key: string, value: string) => {
      localStorageStore.set(key, value);
    },
    removeItem: (key: string) => {
      localStorageStore.delete(key);
    },
    clear: () => {
      localStorageStore.clear();
    },
  },
  configurable: true,
});
