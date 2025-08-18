import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'
import twToCssPlugin from './scripts/vite-tw-to-css.js'

export default defineConfig({
  plugins: [react(), tailwindcss(), twToCssPlugin()],
  build: {
    lib: {
      entry: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/index.js'),
      name: 'ScratchaSDK',
      fileName: (format) => `index.${format === 'es' ? 'esm' : 'js'}`
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
    outDir: 'dist',
    sourcemap: true
  },
  css: {
    modules: false
  }
})
