import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: parseInt(process.env.PORT || '1234', 10),
  },
  base: './',
  build: {
    outDir: 'build',
  },
});
