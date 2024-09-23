import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      include: ['lib/**/*.{ts,tsx,js,jsx}'],
    },
    setupFiles: ['src/setupTests.ts'],
  },
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, './src/components'),
      '@constants': path.resolve(__dirname, './src/constants'),
    },
  },
});
