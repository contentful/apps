import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  server: {
    port: 3000,
  },
  base: '',
  build: {
    outDir: 'build',
  },
  plugins: [react()],
  resolve: {
    alias: {
      apis: '/src/apis',
      clients: '/src/clients',
      components: '/src/components',
      helpers: '/src/helpers',
      hooks: '/src/hooks',
      locations: '/src/locations',
      providers: '/src/providers',
      utils: '/src/utils',
      config: '/src/config',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['/src/setupTests.ts'],
  },
}));
