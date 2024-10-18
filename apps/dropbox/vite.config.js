import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@contentful/dam-app-base': './node_modules/@contentful/dam-app-base/lib/index.js',
      '@contentful/app-sdk': path.resolve(
        __dirname,
        './node_modules/@contentful/app-sdk/dist/cf-extension-api.js'
      ),
    },
  },
  base: './',
  server: {
    port: 3000,
  },
  build: {
    outDir: 'build',
  },
});
