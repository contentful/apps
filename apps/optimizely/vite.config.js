import react from '@vitejs/plugin-react';
// import commonjs from 'vite-plugin-commonjs';
import { esbuildCommonjs } from '@originjs/vite-plugin-commonjs';
import commonjs from '@rollup/plugin-commonjs';

import { defineConfig } from 'vite';

export default defineConfig(() => ({
  base: '', // relative paths
  server: {
    port: 3000,
  },

  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    minify: false,
    outDir: 'build',
    commonjsOptions: {
      // exclude: ['*/index.js', 'node_modules/@testing-library/dom/dist/@testing-library/dom.esm.js', 'node_modules/@sheerun/mutationobserver-shim/dist/mutationobserver.min.js',],
      include: ['node_modules/**'],
      exclude: ['node_modules/@testing-library/**'],

      // include: ['node_modules/**', '**/index.js', '**/warning.js', '**/truncate.js', '**/dayjs.min.js', '**/utc.js', '**/relativeTime.js', '**/calendar.js', '**/react/jsx-runtime.js', '**/react-modal/lib/index.js', '**/lodash.get/index.js', '**/lodash.intersection/index.js', '**/use-methods/dist/index.js', '**/@testing-library/dom/dist/@testing-library/dom.esm.js', '**/pretty-format/build-es5/index.js'],
    },
    rollupOptions: {
      treeshake: false,
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      include: [],
      //  exclude: ['node_modules/@testing-library/**']
      // loader: {
      //   '.js': 'jsx',
      // },
    },
  },
  // build: {
  //   commonjsOptions: {
  //     exclude: [],
  //     include: ['node_modules/pretty-format/build-es5/index.js','node_modules/@testing-library/dom/dist/@testing-library/dom.esm.js','node_modules/use-methods/dist/index.js','node_modules/lodash.intersection/index.js',"node_modules/lodash.get/index.js",'node_modules/react-modal/lib/index.js','node_modules/react/jsx-runtime.js','node_modules/dayjs/plugin/calendar.js','node_modules/dayjs/plugin/relativeTime.js','node_modules/dayjs/plugin/utc.js','node_modules/dayjs/dayjs.min.js','node_modules/truncate/truncate.js', 'node_modules/warning/warning.js','node_modules/react-fast-compare/index.js', 'node_modules/react/index.js', 'node_modules/@contentful/f36-tokens/dist/index.js', 'node_modules/react-dom/index.js', 'node_modules/prop-types/index.js', 'node_modules/react-is/index.js'],
  //   },
  // },
  // esbuild: {
  //   loader: 'jsx',
  //   include: /.*\.jsx?$/,
  //   exclude: [],
  // },
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
  },
}));
