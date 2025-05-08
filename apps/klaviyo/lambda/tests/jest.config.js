module.exports = {
  // Automatically clear mock calls, instances and results before every test
  clearMocks: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // The test environment that will be used for testing
  testEnvironment: 'node',

  // A list of paths to directories that Jest should use to search for files in
  roots: ['<rootDir>'],

  // The glob patterns Jest uses to detect test files
  testMatch: ['**/?(*.)+(spec|test).js'],

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // Set a shorter timeout for tests
  testTimeout: 10000,

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/setup.js'],

  // Don't try to transform node_modules
  transformIgnorePatterns: ['/node_modules/'],
};
