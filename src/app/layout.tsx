import type { Metadata, Viewport } from 'next'
import { PWARegister } from '@/components/pwa/PWARegister'
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'Daily Tracky',
  description: 'Daily Tracky — High-performance daily task tracker, projects, calendar, and analytics.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Daily Tracky',
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/icons/icon-192x192.png',
  },
}

// Apply theme before first paint — prevents flash of wrong theme
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('dt-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
    if (t === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.add('light');
  } catch(e) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Inter + Outfit fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&display=swap"
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
