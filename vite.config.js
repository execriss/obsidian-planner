import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-icon.svg'],
      manifest: {
        name: 'Obsidian Planner',
        short_name: 'Obsidian',
        description: 'Tu planificador personal',
        theme_color: '#1A1814',
        background_color: '#1A1814',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192.png',  sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png',  sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png',  sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Supabase API: siempre red, nunca caché
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
});
