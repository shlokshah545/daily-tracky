'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, CalendarDays, FolderKanban, BarChart3, Tag, Settings, Sun, Moon, Plus, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useUIStore } from '@/lib/store'

const NAV = [
  { href: '/today',     label: 'Today',     icon: Zap },
  { href: '/calendar',  label: 'Calendar',  icon: CalendarDays },
  { href: '/projects',  label: 'Projects',  icon: FolderKanban },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/tags',      label: 'Tags',      icon: Tag },
]

export function Sidebar() {
  const pathname = usePathname()
  const { theme, toggleTheme, sidebarCollapsed, setSidebarCollapsed, openTaskModal } = useUIStore()

  if (sidebarCollapsed) {
    return (
      <div style={{
        width: 56, minWidth: 56,
        background: 'var(--color-bg-subtle)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '16px 0', gap: 6,
        height: '100%',
      }}>
        <button className="icon-btn" onClick={() => setSidebarCollapsed(false)} title="Expand Sidebar">
          <PanelLeftOpen size={18} />
        </button>
        <div style={{ height: 8 }} />
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} title={label} style={{ display: 'block' }}>
              <div className="icon-btn" style={{
                color: active ? 'var(--color-accent)' : undefined,
                background: active ? 'var(--color-accent-muted)' : undefined,
                width: 38, height: 38,
              }}>
                <Icon size={18} />
              </div>
            </Link>
          )
        })}
        <div style={{ flex: 1 }} />
        <button className="icon-btn" onClick={toggleTheme} title="Toggle theme" style={{ width: 38, height: 38 }}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    )
  }

  return (
    <div className="sidebar">
      {/* Workspace Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Zap size={16} />
        </div>
        <span className="sidebar-brand-name" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>Daily Tracky</span>

        <button
          className="icon-btn"
          style={{ marginLeft: 'auto' }}
          onClick={() => setSidebarCollapsed(true)}
          title="Collapse Sidebar"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* New Task Button */}
      <div style={{ padding: '14px 12px 8px' }}>
        <button
          onClick={() => openTaskModal()}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '10px 14px',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <Plus size={16} /> New Task
        </button>
      </div>

      <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 12px 6px' }} />

      {/* Main Navigation Links */}
      <div className="sidebar-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div className="sidebar-section-label">Menu</div>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} style={{ display: 'block', textDecoration: 'none' }}>
              <div className={`nav-item${active ? ' active' : ''}`}>
                <Icon size={17} style={{ flexShrink: 0 }} />
                <span>{label}</span>
              </div>
            </Link>
          )
        })}
      </div>

      <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 12px' }} />

      {/* Bottom Profile & Settings */}
      <div className="sidebar-section" style={{ paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <button className="nav-item" onClick={toggleTheme} style={{ width: '100%' }}>
          {theme === 'dark'
            ? <Sun size={17} style={{ flexShrink: 0, color: '#f59e0b' }} />
            : <Moon size={17} style={{ flexShrink: 0, color: 'var(--color-accent)' }} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <Link href="/settings" style={{ display: 'block', textDecoration: 'none' }}>
          <div className={`nav-item${pathname === '/settings' ? ' active' : ''}`}>
            <Settings size={17} style={{ flexShrink: 0 }} />
            <span>Settings</span>
          </div>
        </Link>
      </div>
    </div>
  )
}
