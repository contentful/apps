import { defineConfig } from 'vite';
import { resolve } from 'path';

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
      '@contentful/ecommerce-app-base':
        './node_modules/@contentful/ecommerce-app-base/lib/index.js',
    },
  },
  build: {
    outDir: 'build',
    commonjsOptions: { transformMixedEsModules: true },
  },
});
