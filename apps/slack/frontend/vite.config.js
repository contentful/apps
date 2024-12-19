import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 1234,
  },
  base: './',
  envPrefix: 'REACT_APP',
  build: {
    outDir: 'build',
  },
});
