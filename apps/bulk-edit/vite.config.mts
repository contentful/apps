import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '',
  build: {
    outDir: 'build',
  },
  server: {
    host: 'localhost',
    port: 3000,
  },
});
