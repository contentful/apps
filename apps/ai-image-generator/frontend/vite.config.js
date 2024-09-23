import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  base: '',
  server: {
    port: 3000,
  },
  build: {
    // the parent project that combines both the frontend and the hosted app action backend needs to be able to override
    // the default location to its own build path
    outDir: process.env.BUILD_PATH || './build',
  },
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['setupTests.js'],
    css: true,
    reporters: ['verbose'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*'],
      exclude: [],
    },
  },
});
