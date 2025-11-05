import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isPWADisabled = env.VITE_PWA_DISABLED === 'true';

  return {
    plugins: [
      react(),
      !isPWADisabled &&
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: 'auto',
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
            navigateFallback: '/index.html',
            navigateFallbackDenylist: [/^\/api/],
            runtimeCaching: [
              {
                urlPattern: /^https?:\/\/.*\/api\/.*\.(json|txt|xml|csv)$/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'api-get',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24,
                  },
                  networkTimeoutSeconds: 10,
                },
              },
              {
                urlPattern: /^https?:\/\/.*\.(js|css|woff|woff2|ttf|eot)$/i,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'static-assets',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30,
                  },
                },
              },
              {
                urlPattern: /^https?:\/\/.*\.(png|jpg|jpeg|svg|gif|webp|ico)$/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'images',
                  expiration: {
                    maxEntries: 60,
                    maxAgeSeconds: 60 * 60 * 24 * 30,
                  },
                },
              },
            ],
            skipWaiting: true,
            clientsClaim: true,
          },
          includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
          manifest: {
            name: 'Staff Admin PWA',
            short_name: 'Admin',
            description: 'Staff/Admin panel for managing users, orders, and tickets',
            theme_color: '#1976d2',
            background_color: '#ffffff',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/?source=pwa',
            categories: ['business', 'productivity'],
            icons: [
              {
                src: '/assets/icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
              },
              {
                src: '/assets/icons/icon-256.png',
                sizes: '256x256',
                type: 'image/png',
                purpose: 'any',
              },
              {
                src: '/assets/icons/icon-384.png',
                sizes: '384x384',
                type: 'image/png',
                purpose: 'any',
              },
              {
                src: '/assets/icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
              },
              {
                src: '/assets/icons/icon-maskable-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
              },
              {
                src: '/assets/icons/icon-maskable-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
              },
            ],
          },
          devOptions: {
            enabled: false,
          },
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version),
    },
    server: {
      port: 3000,
      host: true,
    },
    preview: {
      port: 4173,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            mui: ['@mui/material', '@mui/icons-material'],
            query: ['@tanstack/react-query'],
            charts: ['chart.js', 'react-chartjs-2'],
          },
        },
      },
    },
  };
});
