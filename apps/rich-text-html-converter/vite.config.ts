import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  base: '', // relative paths
  server: {
    port: 3000,
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'tiptap-vendor': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-link',
            '@tiptap/extension-underline',
            '@tiptap/extension-subscript',
            '@tiptap/extension-superscript',
            '@tiptap/extension-table',
            '@tiptap/extension-table-cell',
            '@tiptap/extension-table-header',
            '@tiptap/extension-table-row',
          ],
          'contentful-f36': ['@contentful/f36-components', '@contentful/f36-tokens'],
          'contentful-vendor': [
            '@contentful/app-sdk',
            '@contentful/react-apps-toolkit',
            '@contentful/rich-text-html-renderer',
            '@contentful/rich-text-types',
          ],
          'contentful-management': ['contentful-management'],
        },
      },
    },
  },
  test: {
    environment: 'happy-dom',
  },
}));
