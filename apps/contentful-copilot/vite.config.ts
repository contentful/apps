import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, splitVendorChunkPlugin } from 'vite';
import eslint from 'vite-plugin-eslint';

export default defineConfig(() => ({
  base: '',
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
  plugins: [
    react(),
    splitVendorChunkPlugin(),
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
      '@configs': path.resolve(__dirname, './src/configs'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@locations': path.resolve(__dirname, './src/locations'),
      '@services': path.resolve(__dirname, './src/services'),
    },
  },
  test: {
    environment: 'happy-dom',
  },
}));
