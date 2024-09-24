import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import react from '@vitejs/plugin-react-swc';
import { splitVendorChunkPlugin } from 'vite';
import eslint from 'vite-plugin-eslint';
import { defineConfig } from 'vitest/config';

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
  plugins: [
    react(),
    viteCommonjs(),
    splitVendorChunkPlugin(),
    { ...eslint({ failOnWarning: true }), apply: 'build' },
    {
      ...eslint({ failOnWarning: false, failOnError: false, emitWarning: true, emitError: true }),
      apply: 'serve',
      enforce: 'post',
    },
  ],
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
