import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'robots.txt',
        'icons/icon-192x192.png',
        'icons/icon-512x512.png'
      ],
      manifest: {
        name: 'Your App Name',
        short_name: 'App',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#6200ee',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true, // removes old cache
        clientsClaim: true,          // SW takes control immediately
        skipWaiting: true            // skip waiting phase
      }
    })
  ]
})
