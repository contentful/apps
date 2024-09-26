import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    outDir: 'build',
    lib: {
      entry: 'src/index.tsx',
      name: 'google-analytics',
    },
  },
});
