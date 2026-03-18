import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, Plugin } from 'vite';

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

export default defineConfig(() => ({
  base: '', // relative paths
  server: {
    port: 3000,
  },
  plugins: [react(), resolveSharedDeps()],
  resolve: {
    alias: {
      'contentful-app-components': sharedPkgAlias,
    },
  },
  test: {
    environment: 'happy-dom',
  },
}));
