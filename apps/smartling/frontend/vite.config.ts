import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const hash = Math.floor(Math.random() * 90000) + 10000;

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
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
  },
}));
