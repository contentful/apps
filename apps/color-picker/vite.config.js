import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import babel from 'vite-plugin-babel';

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    }),
    babel({
      babelConfig: {
        babelrc: false,
        configFile: false,
        plugins: ['@babel/plugin-transform-runtime'],
      },
    }),
  ],
  build: {
    outDir: 'build',
    lib: {
      entry: 'src/index.tsx',
      name: 'color-picker',
    },
  },
});
