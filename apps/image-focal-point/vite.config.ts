import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
  },
  base: './',
  plugins: [react({ jsxRuntime: 'automatic' })],
  optimizeDeps: {
    include: ['reactjsx-runtime', 'react-dom'],
  },
  esbuild: {
    target: 'esnext',
    platform: 'node',
  },
  build: {
    outDir: 'build',
  },
});
