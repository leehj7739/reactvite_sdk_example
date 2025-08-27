import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import twToCssPlugin from './scripts/vite-tw-to-css.js'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    twToCssPlugin()
  ],
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'ScratchaSDK',
      fileName: 'index',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
