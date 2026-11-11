import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        workspace: resolve(process.cwd(), 'app.html')
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'lucide-react',
      'jspdf'
    ]
  },
  server: {
    port: 3000,
    host: true,
    open: false,
    proxy: { '/api': 'http://localhost:8000' }
  },
  preview: {
    port: 3000,
    host: true
  }
})
