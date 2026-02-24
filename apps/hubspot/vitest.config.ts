import { fileURLToPath, URL } from 'node:url';
import { loadEnv, Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

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
  plugins: [resolveSharedDeps()],
  resolve: {
    alias: {
      'contentful-app-components': sharedPkgAlias,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    env: loadEnv('test', process.cwd(), ''),
  },
});
