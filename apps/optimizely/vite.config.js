import react from '@vitejs/plugin-react';
import commonjs from 'vite-plugin-commonjs';

import { defineConfig } from 'vite';

export default defineConfig(() => ({
  base: '', // relative paths
  server: {
    port: 3000,
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  resolve: {
    alias: {
      default: 'node_modules/@sheerun/mutationobserver-shim/dist/mutationobserver.min.js',
    },
  },
  build: {
    outDir: 'build',
    commonjsOptions: {
      // exclude: ['*/index.js', 'node_modules/@testing-library/dom/dist/@testing-library/dom.esm.js', 'node_modules/@sheerun/mutationobserver-shim/dist/mutationobserver.min.js',],
      include: ['node_modules/**'],
      // include: ['node_modules/**', '**/index.js', '**/warning.js', '**/truncate.js', '**/dayjs.min.js', '**/utc.js', '**/relativeTime.js', '**/calendar.js', '**/react/jsx-runtime.js', '**/react-modal/lib/index.js', '**/lodash.get/index.js', '**/lodash.intersection/index.js', '**/use-methods/dist/index.js', '**/@testing-library/dom/dist/@testing-library/dom.esm.js', '**/pretty-format/build-es5/index.js'],
    },
  },

  // build: {
  //   commonjsOptions: {
  //     exclude: [],
  //     include: ['node_modules/pretty-format/build-es5/index.js','node_modules/@testing-library/dom/dist/@testing-library/dom.esm.js','node_modules/use-methods/dist/index.js','node_modules/lodash.intersection/index.js',"node_modules/lodash.get/index.js",'node_modules/react-modal/lib/index.js','node_modules/react/jsx-runtime.js','node_modules/dayjs/plugin/calendar.js','node_modules/dayjs/plugin/relativeTime.js','node_modules/dayjs/plugin/utc.js','node_modules/dayjs/dayjs.min.js','node_modules/truncate/truncate.js', 'node_modules/warning/warning.js','node_modules/react-fast-compare/index.js', 'node_modules/react/index.js', 'node_modules/@contentful/f36-tokens/dist/index.js', 'node_modules/react-dom/index.js', 'node_modules/prop-types/index.js', 'node_modules/react-is/index.js'],
  //   },
  // },
  esbuild: {
    loader: 'jsx',
    include: /.*\.jsx?$/,
    exclude: [],
  },
  plugins: [react(), commonjs()],
  test: {
    environment: 'happy-dom',
    globals: true,
  },
}));
