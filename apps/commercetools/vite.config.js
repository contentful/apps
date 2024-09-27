import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
  },
  define: {
    global: {},
  },
  resolve: {
    alias: {
      'node-fetch': 'isomorphic-fetch',
    },
  },
  build: {
    outDir: 'build',
    lib: {
      entry: 'src/index.tsx',
      name: 'commercetools',
    },
  },
});
