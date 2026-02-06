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

global.ResizeObserver = ResizeObserver;
