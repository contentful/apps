import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';
import eslint from 'vite-plugin-eslint';

export default defineConfig(() => ({
  base: '', // relative paths
  server: {
    port: 3000,
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
      '@locations': path.resolve(__dirname, './src/locations'),
      '@test': path.resolve(__dirname, './test'),
    },
  },
  test: {
    environment: 'happy-dom',
  },
}));
