import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // Ensure jsdom is still set for browser-like environment
    globals: true, // Enable global usage of describe, test, etc.
    exclude: [...configDefaults.exclude, 'node_modules'],
  },
});
