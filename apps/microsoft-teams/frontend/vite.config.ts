import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';
import eslint from 'vite-plugin-eslint';

export default defineConfig(() => ({
  base: '', // relative paths
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
    { ...eslint({ failOnWarning: true }), apply: 'build' },
    {
      ...eslint({ failOnWarning: false, failOnError: false, emitWarning: true, emitError: true }),
      apply: 'serve',
      enforce: 'post',
    },
  ],
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, './src/components'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@customTypes': path.resolve(__dirname, './src/customTypes'),
      '@helpers': path.resolve(__dirname, './src/helpers'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@locations': path.resolve(__dirname, './src/locations'),
      '@test': path.resolve(__dirname, './test'),
    },
  },
  test: {
    environment: 'happy-dom',
  },
}));
