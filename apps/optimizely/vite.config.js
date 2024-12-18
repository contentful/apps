import react from '@vitejs/plugin-react';

import { defineConfig } from 'vite';

export default defineConfig(() => ({
  base: '', // relative paths
  server: {
    port: 3000,
  },
  build: {
    minify: false,
    outDir: 'build',
  },
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
  },
}));
