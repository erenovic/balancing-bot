import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  root: 'src/',
  publicDir: '../static/',
  base: './',
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/types': resolve(__dirname, 'src/types'),
    },
  },

  plugins: [
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
    }),
  ],

  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['three'],
        },
      },
    },
  },

  server: {
    host: true,
    port: 3000,
    open: true,
  },

  preview: {
    host: true,
    port: 4173,
  },
});
