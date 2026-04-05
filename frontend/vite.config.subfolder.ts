import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Configuración para subfolder /sigah
  base: '/sigah/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react', 'framer-motion'],
          charts: ['recharts'],
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Importante: proxy para desarrollo con /sigah-api
      '/sigah-api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sigah-api/, '/api'),
      },
    },
  },
  preview: {
    port: 3000,
    proxy: {
      '/sigah-api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sigah-api/, '/api'),
      },
    },
  },
  // Variables de entorno para producción
  define: {
    __APP_BASE_PATH__: JSON.stringify('/sigah/'),
    __API_BASE_PATH__: JSON.stringify('/sigah-api'),
  },
})
