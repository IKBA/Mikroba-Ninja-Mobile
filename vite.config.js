import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Using relative paths so it runs correctly on GitHub Pages (any subfolder)
  build: {
    outDir: 'dist',
  }
});
