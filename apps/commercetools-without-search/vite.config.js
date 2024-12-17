import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
  },
  define: {
    global: {},
  },
  build: {
    outDir: 'build',
    lib: {
      entry: 'src/index.tsx',
      name: 'commerce-tools-without-search',
    },
  },
});
