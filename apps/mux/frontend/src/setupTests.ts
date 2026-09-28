// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { waitFor } from '@testing-library/react';
import { afterAll, expect, vi } from 'vitest';

global.ResizeObserver = require('resize-observer-polyfill');

// F36's Modal closes over 200 ms (react-modal's `closeTimeoutMS`), so a modal that is still open
// when a test unmounts leaves its portal node in the body and removes it on a real timer. If the
// file's jsdom is torn down before the last of those timers fires, it throws `document is not
// defined` and Vitest exits 1 with every test passing. Let the portals go first.
afterAll(() => waitFor(() => expect(document.body).toBeEmptyDOMElement()));

// See https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
