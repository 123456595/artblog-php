import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  base: '/assets/',
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: 'public/assets',
    emptyOutDir: true,
    manifest: 'manifest.json',
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        site: resolve(__dirname, 'src/site/main.tsx'),
        admin: resolve(__dirname, 'src/admin/main.tsx'),
      },
      output: {
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (info) => {
          if ((info.name ?? '').endsWith('.css')) return 'css/[name]-[hash][extname]';
          return 'media/[name]-[hash][extname]';
        },
      },
    },
  },
});
