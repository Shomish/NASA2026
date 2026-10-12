import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración de Vite.
// - host: por defecto solo escucha en localhost (contexto seguro). Activar con HOST=true
//   solo si se necesita acceso desde un dispositivo en red (con el riesgo de contexto no seguro).
// - proxy: en desarrollo, reenvía /api al backend Express.
export default defineConfig({
  plugins: [react()],
  server: {
    host: process.env.HOST === 'true',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
