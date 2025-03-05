import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
  server: {
    host: 'localhost',
    port: 3000,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
  },
});
