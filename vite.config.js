import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: process.env.NODE_ENV === 'production' ? 'src' : '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
      },
    },
  },
  server: {
    open: true,
    port: 3000,
  },
});
