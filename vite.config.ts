import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/foundational-models/',
  plugins: [react()],
  server: {
    port: 3003,
    host: true,
    proxy: {
      '/gee': {
        target: 'http://127.0.0.1:3013',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gee/, ''),
      }
    }
  },
  build: {
    outDir: 'dist'
  }
})