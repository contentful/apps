import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr'
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  base: '', // relative paths
  server: {
    port: 3000,
  },
  plugins: [
    react({
      jsxImportSource: "@emotion/react"
    }),
    svgr(),
  ],
  esbuild: {
    logOverride: {'this-is-undefined-in-esm': 'silent'}
  },
  test: {
    environment: 'happy-dom',
  },
}));
