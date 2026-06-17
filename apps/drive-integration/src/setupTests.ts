/* eslint-disable @typescript-eslint/no-require-imports */
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom

import { beforeEach, afterEach, vi } from 'vitest';

// react-modal schedules a setTimeout to remove its portal on close. Without fake
// timers that timeout can fire after jsdom is torn down → "document is not defined".
// shouldAdvanceTime keeps the wall clock running so waitFor still resolves normally.
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  // Guard needed for tests that call vi.useRealTimers() inline — runAllTimers()
  // throws if timers are no longer mocked when this afterEach fires.
  if (vi.isFakeTimers()) {
    vi.runAllTimers();
    vi.useRealTimers();
  }
});

if (typeof window !== 'undefined' && typeof ResizeObserver === 'undefined') {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Only configure if we're in a DOM environment (not Node.js)
// This file is for frontend tests only - function tests use functions/vitest.config.mts
if (typeof window !== 'undefined') {
  try {
    // Import jest-dom and matchers only in browser/DOM environment
    require('@testing-library/jest-dom');
    const { configure } = require('@testing-library/react');
    const { expect } = require('vitest');

    // Try to import matchers - handle both default and named exports
    let matchers;
    try {
      const matchersModule = require('@testing-library/jest-dom/matchers');
      // Handle both default export and named export
      matchers = matchersModule.default || matchersModule;

      // Validate that matchers is an object with functions
      if (matchers && typeof matchers === 'object' && Object.keys(matchers).length > 0) {
        // Only extend expect if matchers is valid
        if (expect && typeof expect.extend === 'function') {
          expect.extend(matchers);
        }
      }
    } catch (e) {
      // If matchers can't be loaded, skip extending expect
      // This is fine - tests will still work without custom matchers
      console.warn('Could not load jest-dom matchers:', e);
    }

    configure({
      testIdAttribute: 'data-test-id',
    });
  } catch {
    // Silently fail if configuration fails (e.g., in Node.js environment)
    // This is expected for function tests that run in Node.js
  }
}
