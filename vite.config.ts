import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Generate unique build ID based on timestamp
const buildId = Date.now().toString(36)

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        compact: './compact.html',
      },
      output: {
        entryFileNames: `assets/[name].${buildId}.js`,
        chunkFileNames: `assets/[name].${buildId}.js`,
        assetFileNames: `assets/[name].${buildId}.[ext]`
      }
    },
  },
})