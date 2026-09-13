'use client'

import { useState } from 'react'
import { Moon, Sun, Bell, Download, CheckCircle2, Smartphone } from 'lucide-react'
import { useUIStore } from '@/lib/store'
import { PWAInstallCard } from '@/components/pwa/PWAInstallCard'

function SettingRow({ icon, title, sub, action }: {
  icon: React.ReactNode; title: string; sub?: string; action: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      padding: '16px 0',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ color: 'var(--color-text-secondary)', marginTop: 2, flexShrink: 0 }}>{icon}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{action}</div>
    </div>
  )
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useUIStore()
  const isDark = theme === 'dark'
  const [notifEnabled, setNotifEnabled] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function requestNotifications() {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission()
      setNotifEnabled(perm === 'granted')
      showToast(perm === 'granted' ? 'Notifications enabled' : 'Permission denied')
    } else {
      showToast('Notifications not supported by this browser')
    }
  }

  async function exportData() {
    setExportLoading(true)
    try {
      const [tasks, projects, tags] = await Promise.all([
        fetch('/api/tasks').then(r => r.json()),
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/tags').then(r => r.json()),
      ])
      const data = { tasks: tasks.tasks, projects: projects.projects, tags: tags.tags, exportedAt: new Date().toISOString() }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `daily-tracker-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('Exported successfully')
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <div className="page">
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 99,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px',
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)',
        }}>
          <CheckCircle2 size={15} style={{ color: 'var(--color-success)' }} />
          {toast}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">Preferences, mobile app installation & data management</p>
      </div>

      {/* PWA Mobile Installation Card */}
      <div style={{ marginBottom: 24 }}>
        <PWAInstallCard />
      </div>

      {/* Appearance Section */}
      <div className="card" style={{ padding: '0 20px', marginBottom: 16 }}>
        <div style={{ padding: '14px 0 0' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)' }}>
            Appearance
          </div>
        </div>
        <SettingRow
          icon={isDark ? <Moon size={16} /> : <Sun size={16} />}
          title={isDark ? 'Dark Mode' : 'Light Mode'}
          sub="Switch between clean light theme and high-contrast dark theme"
          action={
            <button
              onClick={toggleTheme}
              className={`toggle-track${isDark ? ' on' : ''}`}
              aria-label="Toggle theme"
            >
              <div className="toggle-thumb" />
            </button>
          }
        />
      </div>

      {/* Notifications Section */}
      <div className="card" style={{ padding: '0 20px', marginBottom: 16 }}>
        <div style={{ padding: '14px 0 0' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)' }}>
            Notifications
          </div>
        </div>
        <SettingRow
          icon={<Bell size={16} />}
          title="Browser Notifications"
          sub="Receive alerts for scheduled and time-blocked tasks"
          action={
            notifEnabled
              ? <span style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 500 }}>Enabled ✓</span>
              : <button className="btn btn-secondary btn-sm" onClick={requestNotifications}>Enable</button>
          }
        />
      </div>

      {/* Data Section */}
      <div className="card" style={{ padding: '0 20px', marginBottom: 16 }}>
        <div style={{ padding: '14px 0 0' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)' }}>
            Data Export
          </div>
        </div>
        <SettingRow
          icon={<Download size={16} />}
          title="Export All Data"
          sub="Download complete JSON snapshot of tasks, subtasks, projects, and tags"
          action={
            <button className="btn btn-secondary btn-sm" onClick={exportData} disabled={exportLoading}>
              {exportLoading ? 'Exporting...' : 'Export JSON'}
            </button>
          }
        />
      </div>

      {/* About Section */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', marginBottom: 8 }}>
          About
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--color-text-primary)' }}>Daily Tracky</strong> — High Performance Productivity Suite<br />
          Keyboard shortcuts: <code style={{ fontSize: 11, padding: '2px 6px', background: 'var(--color-bg-muted)', borderRadius: 4 }}>Ctrl+K</code> or <code style={{ fontSize: 11, padding: '2px 6px', background: 'var(--color-bg-muted)', borderRadius: 4 }}>⌘K</code> to quick-search anytime.
        </div>
      </div>
    </div>
  )
}
