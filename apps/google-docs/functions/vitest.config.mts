import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => ({
  test: {
    globals: true,
    environment: 'node',
    // Load .env from parent directory (google-docs root)
    env: loadEnv(mode, path.resolve(__dirname, '..'), ''),
  },
}));

