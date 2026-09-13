import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 3030,
    strictPort: true,
    proxy: {
      // Dev: hit the Laravel API (and uploaded media) through a same-origin proxy.
      '/api': { target: 'http://127.0.0.1:8035', changeOrigin: true },
      '/uploads': { target: 'http://127.0.0.1:8035', changeOrigin: true },
      '/sitemap.xml': { target: 'http://127.0.0.1:8035', changeOrigin: true },
    },
  },
})
