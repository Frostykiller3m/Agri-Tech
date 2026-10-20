import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icon.svg'],
      manifest: {
        name: 'Agri-Tech Smart Farming',
        short_name: 'Agri-Tech',
        description: 'Smart farming management for healthier harvests.',
        theme_color: '#1f6f43',
        background_color: '#f5f8f2',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: '/pwa-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [{
          urlPattern: ({ url }) => url.pathname.startsWith('/weather/') && url.searchParams.has('cacheScope'),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'agritech-last-weather-response',
            networkTimeoutSeconds: 5,
            cacheableResponse: { statuses: [0, 200] },
            expiration: { maxEntries: 30, maxAgeSeconds: 7 * 24 * 60 * 60 },
          },
        }],
      },
    }),
  ],
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
  },
});
