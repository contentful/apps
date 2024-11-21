import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
  },
  base: '', // relative paths
  plugins: [react()],
  build: {
    outDir: 'build',
    rollupOptions: {
      external: ['react/jsx-runtime'],
    },
  },
  optimizeDeps: {
    include: ['react/jsx-runtime'],
  },
});
