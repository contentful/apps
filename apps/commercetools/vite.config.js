import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
  },
  base: './',
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
    commonjsOptions: { transformMixedEsModules: true },
  },
});
