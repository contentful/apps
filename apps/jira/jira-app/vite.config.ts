import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    outDir: 'build',
    lib: {
      entry: 'src/index.tsx',
      // set outgoing directory is build

      name: 'Jira-App',
      fileName: (format) => `jira-app.${format}.js`,
    },
  },
});
