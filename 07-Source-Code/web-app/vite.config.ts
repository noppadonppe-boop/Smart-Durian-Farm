import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => ({
  define:
    mode === 'test'
      ? {
          'import.meta.env.VITE_QR_BASE_URL': JSON.stringify('http://localhost:5173'),
          'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify('demo-smart-durian'),
          'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(
            'demo-api-key-not-a-secret',
          ),
          'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify('localhost'),
          'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(
            'demo-smart-durian.appspot.com',
          ),
        }
      : undefined,
  build: {
    manifest: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Smart Durian Farm',
        short_name: 'Smart Durian',
        description: 'Multi-Farm durian orchard management foundation',
        theme_color: '#17562f',
        background_color: '#f4f7f3',
        display: 'standalone',
        lang: 'th',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,webmanifest}'],
      },
    }),
  ],
  server: {
    host: mode === 'firebase-live' ? 'localhost' : '127.0.0.1',
    port: 5173,
  },
  preview: {
    host: mode === 'firebase-live' ? 'localhost' : '127.0.0.1',
    port: 4173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
}))
