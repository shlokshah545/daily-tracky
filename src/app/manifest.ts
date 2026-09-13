import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Daily Tracky - High Performance Productivity',
    short_name: 'Daily Tracky',
    description: 'Track daily habits, tasks, projects, schedules, and analytics with precision.',
    start_url: '/today',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#6366f1',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
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
