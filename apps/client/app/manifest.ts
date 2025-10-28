import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ibimina Client',
    short_name: 'Ibimina',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0b1020',
    theme_color: '#0b1020',
    description: 'Ibimina member client app for Umurenge SACCO operations',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      { src: '/icons/icon-1024.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' }
    ],
    shortcuts: [
      {
        name: 'Groups',
        short_name: 'Groups',
        description: 'View my Ikimina groups',
        url: '/groups',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
      },
      {
        name: 'Pay Sheet',
        short_name: 'Pay',
        description: 'Submit payment',
        url: '/pay-sheet',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
      }
    ]
  }
}
