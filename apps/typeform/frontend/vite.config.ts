import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  base: '', // relative paths
  server: {
    port: 3000,
  },
  plugins: [react()],
  build: {
    outDir: process.env.BUILD_PATH || './build',
  },
  test: {
    environment: 'happy-dom',
    globals: true,
  },
}));
