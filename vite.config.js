import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    // Desativa hot reload se estiver causando conflito
    hmr: {
      overlay: false
    }
  }
})