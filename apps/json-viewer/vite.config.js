import { env } from 'process';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
  },
  base: './',
  define: {
    process: {
      env: {
        NODE_ENV: env.NODE_ENV,
      },
    },
  },
  build: {
    outDir: 'build',
  },
});
