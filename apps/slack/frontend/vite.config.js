import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 1234,
  },
  base: './',
  build: {
    outDir: 'build',
  },
});
