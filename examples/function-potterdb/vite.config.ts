import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: './build',
  },
  test: {
    setupFiles: './src/setupTests.ts', // Equivalent to Jest's setup file
    globals: true,
    environment: 'jsdom',
  },
  server: {
    port: 3000,
  },
  base: '', // relative paths
});
