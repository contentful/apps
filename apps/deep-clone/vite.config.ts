import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig(() => ({
  base: '', // relative paths
  server: {
    port: 3000,
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test/setup.ts',
  },
}));
