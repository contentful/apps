import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => ({
  test: {
    globals: true,
    environment: 'node',
    // Load .env from parent directory (google-docs root)
    env: loadEnv(mode, path.resolve(__dirname, '..'), ''),
    // Don't use the React setup file for functions tests
    setupFiles: undefined,
    // Only include tests in the functions directory
    include: ['**/*.test.ts', '**/*.spec.ts'],
  },
}));

