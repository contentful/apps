import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, splitVendorChunkPlugin } from 'vite';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

export default defineConfig(() => ({
  base: '', // relative paths
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
  plugins: [react({ jsxImportSource: '@emotion/react' }), viteCommonjs(), splitVendorChunkPlugin()],
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, './src/components'),
      '@configs': path.resolve(__dirname, './src/configs'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@locations': path.resolve(__dirname, './src/locations'),
      '@providers': path.resolve(__dirname, './src/providers'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@test': path.resolve(__dirname, './test'),
    },
  },
  test: {
    environment: 'happy-dom',
  },
}));
