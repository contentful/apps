import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  base: '', // relative paths
  server: {
    port: 5544,
  },
  plugins: [react()],
  test: {
    environment: 'happy-dom',
  },
  envPrefix: 'REACT_APP',
  build: {
    outDir: 'build',
    sourcemap: false,
  },
}));
