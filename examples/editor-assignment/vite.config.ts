/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import commonjs from 'vite-plugin-commonjs';

export default defineConfig({
  plugins: [react(), commonjs()],
  server: {
    host: 'localhost',
    port: 3000,
  },
  test: {
    globals: true, // Enables Jest-like global test functions (test, expect)
    environment: 'jsdom', // Simulates a browser for component tests
    setupFiles: './src/setupTests.ts', // Equivalent to Jest's setup file
  },
  build: {
    outDir: 'build',
  },
  base: '', // relative paths
});
