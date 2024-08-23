import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

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
    setupFiles: ['/src/setupTests.ts'],
    env: { VITE_SAP_APP_ID: 'TEST_SAP_APP_ID', VITE_SAP_AIR_APP_ID: 'TEST_SAP_AIR_APP_ID' },
  },
}));
