import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  base: '', // relative paths
  server: {
    port: 3000,
  },
  build: {
    outDir: './build',
  },
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['/src/setupTests.ts'],
  },
}));
