import type { Metadata, Viewport } from 'next'
import { PWARegister } from '@/components/pwa/PWARegister'
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'Daily Tracky',
  description: 'Daily Tracky — Personal productivity, task management, calendar, projects, and live analytics.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Daily Tracky',
  },
  icons: {
    icon: '/icons/icon.svg',
    shortcut: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
}

// Apply theme before first paint to prevent flash
// CSS: :root = light (default), html.dark = dark overrides
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('dt-theme') || 'dark';
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <PWARegister />
        {children}
      </body>
    </html>
  )
}
