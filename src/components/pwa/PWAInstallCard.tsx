'use client'

import { useState, useEffect } from 'react'
import { Download, Smartphone, Check, Sparkles } from 'lucide-react'

export function PWAInstallCard() {
  const [canInstall, setCanInstall] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
    if (isStandalone) {
      setInstalled(true)
      return
    }

    if ((window as any).__pwaInstallPrompt) {
      setCanInstall(true)
    }

    const handleInstallable = () => setCanInstall(true)
    const handleAppInstalled = () => {
      setInstalled(true)
      setCanInstall(false)
    }

    window.addEventListener('dt:pwa-installable', handleInstallable)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('dt:pwa-installable', handleInstallable)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  async function handleInstall() {
    const promptEvent = (window as any).__pwaInstallPrompt
    if (!promptEvent) {
      alert('To install on Android: Tap the 3-dots menu in Chrome and select "Add to Home screen" or "Install App".\n\nOn iOS: Tap the Share button in Safari and select "Add to Home Screen".')
      return
    }

    setInstalling(true)
    try {
      promptEvent.prompt()
      const { outcome } = await promptEvent.userChoice
      if (outcome === 'accepted') {
        setInstalled(true)
        setCanInstall(false)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setInstalling(false)
    }
  }

  if (installed) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 18px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-success-muted)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'var(--color-success)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', flexShrink: 0,
        }}>
          <Check size={18} strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            App Installed & Running
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            Daily Tracker is installed on this device.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      padding: '18px 20px',
      borderRadius: 'var(--radius-md)',
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.08) 100%)',
      border: '1px solid rgba(99, 102, 241, 0.25)',
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 240 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--radius-sm)',
          background: 'var(--color-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', flexShrink: 0,
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
        }}>
          <Smartphone size={22} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            Install as Mobile / Desktop App
            <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--color-accent-muted)', color: 'var(--color-accent-text)', padding: '1px 6px', borderRadius: 100 }}>
              PWA
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Install on your Android phone, iPhone, or PC for full-screen offline-ready productivity.
          </div>
        </div>
      </div>

      <button
        onClick={handleInstall}
        className="btn btn-primary"
        disabled={installing}
        style={{
          padding: '10px 18px',
          fontWeight: 700,
          fontSize: 13,
          flexShrink: 0,
        }}
      >
        <Download size={15} />
        {canInstall ? 'Install Daily Tracker' : 'How to Install'}
      </button>
    </div>
  )
}
