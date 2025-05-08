// Jest setup file

// This will run before all tests
beforeAll(() => {
  // Mock console methods to avoid polluting the test output
  global.console = {
    ...console,
    // Keep the original implementation of methods we want to use for debugging
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  };
});

// Clean up after all tests
afterAll(() => {
  jest.restoreAllMocks();
});
