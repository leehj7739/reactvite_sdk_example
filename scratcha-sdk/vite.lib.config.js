import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['transform-remove-console', { exclude: ['error'] }]
        ]
      }
    })
  ],
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'ScratchaSDK',
      fileName: (format) => {
        if (format === 'es') return 'index.js'
        if (format === 'umd') return 'index.umd.js'
        return 'index.js'
      },
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        },
        exports: 'named'
      }
    },
    cssCodeSplit: false,
    cssMinify: false
  },
  css: {
    modules: false,
    postcss: null
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
