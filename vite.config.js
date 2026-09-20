import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/mydramatracker/', 

  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      scope: '/mydramatracker/',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }, 
      manifest: {
        name: 'My Drama Tracker',
        short_name: 'DramaTracker',
        description: 'Track every heart-fluttering watch, 100% locally.',
        start_url: '/mydramatracker/', 
        display: 'standalone',
        theme_color: '#F9F6F1',
        background_color: '#F9F6F1',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})

/* //version for single html file in dist
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [vue(), viteSingleFile()],
}) */