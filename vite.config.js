import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // your existing login backend
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      // FastAPI backend
      '/spotify': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  }
})
