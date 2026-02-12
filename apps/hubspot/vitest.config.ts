import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    // Dedupe React so @contentful/shared-components uses the same React as this app in tests.
    // Otherwise shared-components resolves its own node_modules/react and hooks break.
    // Also dedupe react-apps-toolkit so mocks work for shared-components.
    dedupe: [
      'react',
      'react-dom',
      '@contentful/react-apps-toolkit',
      '@contentful/f36-components',
      '@contentful/f36-multiselect',
      '@contentful/f36-core',
    ],
    alias: {
      // Force React to resolve to the same instance for all packages
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    env: loadEnv('test', process.cwd(), ''),
  },
});
