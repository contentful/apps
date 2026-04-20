// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Only configure if we're in a DOM environment (not Node.js)
// This file is for frontend tests only - function tests use functions/vitest.config.mts
if (typeof window !== 'undefined') {
  try {
    if (expect && typeof expect.extend === 'function') {
      expect.extend(matchers);
    }
    configure({
      testIdAttribute: 'data-test-id',
    });
  } catch {
    // Silently fail if configuration fails (e.g., in Node.js environment)
    // This is expected for function tests that run in Node.js
  }
}
