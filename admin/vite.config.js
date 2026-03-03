import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    // Split vendor chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
    // Enable source maps in production for error tracking
    sourcemap: false,
    // Minify
    minify: 'esbuild',
    // Warn if chunk exceeds 1MB
    chunkSizeWarningLimit: 1000,
  },
  server: {
    // Allow CORS during dev for hot reload
    cors: true,
  },
})
