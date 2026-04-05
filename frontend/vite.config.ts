import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // Base path para dominio.com/sigah
  base: '/sigah/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/sigah-api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sigah-api/, '/api'),
      },
      '/socket.io': {
        target: process.env.VITE_API_TARGET || 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    proxy: {
      '/sigah-api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sigah-api/, '/api'),
      },
    },
  },
});
