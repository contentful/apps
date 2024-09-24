import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    lib: {
      entry: 'src/index.tsx',
      name: 'Jira-App',
      fileName: (format) => `jira-app.${format}.js`,
    },
  },
});
