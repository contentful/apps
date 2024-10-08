import react from '@vitejs/plugin-react';
import path from 'path';

import { defineConfig } from 'vite';

export default defineConfig(() => ({
  base: '', // relative paths
  server: {
    port: 3000,
  },

  resolve: {
    alias: [
      {
        find: /node_modules/,
        replacement: path.resolve(__dirname, 'node_modules'),
        // find: /@use-it\/interval/,
        // replacement: path.resolve(__dirname, 'node_modules', '@use-it', 'interval', 'dist', 'index.js'),
      },
    ],
  },
  build: {
    minify: false,
    outDir: 'build',
    commonjsOptions: {
      // exclude: ['*/index.js', 'node_modules/@testing-library/dom/dist/@testing-library/dom.esm.js', 'node_modules/@sheerun/mutationobserver-shim/dist/mutationobserver.min.js',],
      include: ['node_modules/**'],
      exclude: ['node_modules/@testing-library/**'],
    },
    rollupOptions: {
      // treeshake: true,
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      //  exclude: ['node_modules/@testing-library/**']
      // loader: {
      //   '.js': 'jsx',
      // },
    },
  },
  // build: {
  //   commonjsOptions: {
  //     exclude: [],
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
