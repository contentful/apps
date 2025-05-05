import { vi } from 'vitest';

// Mock browser globals
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};

// Mock window object
global.window = {
  localStorage: localStorageMock,
  sessionStorage: sessionStorageMock,
  location: {
    origin: 'https://app.contentful.com',
    href: 'https://app.contentful.com',
    is: vi.fn(),
  },
  sdk: undefined, // Will be set in tests as needed
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as any;

// Mock document object
global.document = {
  getElementById: vi.fn((id) => {
    if (id === 'root') {
      return {
        innerHTML: '',
        appendChild: vi.fn(),
        // Add properties needed by React createRoot
        nodeType: 1, // ELEMENT_NODE
        ownerDocument: document,
        tagName: 'DIV',
      };
    }
    return {
      innerHTML: '',
      appendChild: vi.fn(),
    };
  }),
  createElement: vi.fn(() => ({
    style: {},
    setAttribute: vi.fn(),
    appendChild: vi.fn(),
  })),
  body: {
    appendChild: vi.fn(),
  },
  querySelectorAll: vi.fn().mockReturnValue([]),
  querySelector: vi.fn().mockReturnValue(null),
} as any;

// Mock Storage constructor and prototype
class MockStorage {
  getItem = vi.fn();
  setItem = vi.fn();
  removeItem = vi.fn();
}

// Set up Storage correctly
global.Storage = MockStorage as any;

// Expose localStorage and sessionStorage globally
global.localStorage = localStorageMock;
global.sessionStorage = sessionStorageMock;

// Mock fetch API
global.fetch = vi.fn();

// Clear all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
