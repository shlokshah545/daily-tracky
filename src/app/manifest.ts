import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Daily Tracky - High Performance Productivity',
    short_name: 'Daily Tracky',
    description: 'Track daily habits, tasks, projects, schedules, and analytics with precision.',
    start_url: '/today',
    display: 'standalone',
    background_color: '#041611',
    theme_color: '#059669',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Today Tasks',
        short_name: 'Today',
        description: 'View today focus tasks',
        url: '/today',
        icons: [{ src: '/icons/icon.svg', sizes: '96x96' }],
      },
      {
        name: 'Calendar',
        short_name: 'Calendar',
        description: 'View schedule and timeline',
        url: '/calendar',
        icons: [{ src: '/icons/icon.svg', sizes: '96x96' }],
      },
      {
        name: 'Projects',
        short_name: 'Projects',
        description: 'Manage active project boards',
        url: '/projects',
        icons: [{ src: '/icons/icon.svg', sizes: '96x96' }],
      },
      {
        name: 'Stats',
        short_name: 'Stats',
        description: 'View productivity statistics',
        url: '/dashboard',
        icons: [{ src: '/icons/icon.svg', sizes: '96x96' }],
      },
    ],
  }
}
