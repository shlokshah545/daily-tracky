'use client'

import { useEffect, useState } from 'react'

export function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed / running standalone
    if (typeof window !== 'undefined') {
      const isApp = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
      setIsStandalone(!!isApp)

      // Register service worker
      if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('Daily Tracker Service Worker registered:', reg.scope)
          })
          .catch((err) => {
            console.warn('Daily Tracker Service Worker registration failed:', err)
          })
      } else if ('serviceWorker' in navigator) {
        // Also register in dev if enabled
        navigator.serviceWorker.register('/sw.js').catch(() => {})
      }

      // Listen for install prompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
        ;(window as any).__pwaInstallPrompt = e
        window.dispatchEvent(new CustomEvent('dt:pwa-installable'))
      }

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }
    }
  }, [])

  return null
}
