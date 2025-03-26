/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: './build',
  },
  server: {
    port: 3000,
  },
  test: {
    setupFiles: './src/setupTests.ts', // Equivalent to Jest's setup file
    globals: true,
    environment: 'jsdom',
  },
  base: '', // relative paths
});
