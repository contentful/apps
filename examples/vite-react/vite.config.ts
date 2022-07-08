import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  base: '', // relative paths
  plugins: [react()],
  test: {
    environment: 'happy-dom',
  },
}));
