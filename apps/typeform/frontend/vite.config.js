import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  base: '',
  build: {
    outDir: 'build',
  },
  server: {
    port: 3001,
  },
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./test/vitest.setup.ts'],
  },
}));
