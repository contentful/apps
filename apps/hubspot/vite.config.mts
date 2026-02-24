import { fileURLToPath, URL } from 'node:url';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const sharedPkgPath = '../../packages/contentful-app-components/';
const sharedPkgAlias = fileURLToPath(new URL(`${sharedPkgPath}index.ts`, import.meta.url));
const localImporter = fileURLToPath(new URL('./src/index.tsx', import.meta.url));

function resolveSharedDeps(): Plugin {
  return {
    name: 'resolve-shared-deps',
    async resolveId(source, importer, options) {
      if (
        importer?.includes('packages/contentful-app-components/') &&
        !source.startsWith('.') &&
        !source.startsWith('/')
      ) {
        return this.resolve(source, localImporter, { ...options, skipSelf: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), resolveSharedDeps()],
  base: '',
  build: {
    outDir: 'build',
  },
  server: {
    host: 'localhost',
    port: 3000,
  },
  resolve: {
    alias: {
      'contentful-app-components': sharedPkgAlias,
    },
  },
});
