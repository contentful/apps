import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    env: loadEnv('test', process.cwd(), ''),
    server: {
      deps: {
        inline: ['@phosphor-icons/react', '@contentful/f36-icons'],
      },
    },
  },
});
