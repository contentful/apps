import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    outDir: 'build',
    lib: {
      entry: 'src/index.jsx',
      name: 'Image-Focal-Point',
      fileName: (format) => `image-focal-point.${format}.js`,
    },
  },
});
