import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Use backend service name in Docker, localhost otherwise
const apiTarget = process.env.DOCKER_ENV === 'true'
  ? 'http://backend:8000'
  : 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
