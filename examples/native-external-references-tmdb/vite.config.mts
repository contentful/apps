import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 3000
  },
  build: {
    outDir: 'build'
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './setupTests.ts' // Equivalent to Jest's setup file
  },
  base: ''
});
