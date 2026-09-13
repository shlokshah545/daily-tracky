'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Timer, CalendarDays, FolderKanban, BarChart3,
  Tag, Settings, Sun, Moon, Plus, PanelLeftClose, PanelLeftOpen, Sparkles
} from 'lucide-react'
import { useUIStore } from '@/lib/store'

const NAV = [
  { href: '/today',     label: 'Home',        icon: LayoutDashboard },
  { href: '/focus',     label: 'Focus Timer', icon: Timer },
  { href: '/calendar',  label: 'Planner',     icon: CalendarDays },
  { href: '/projects',  label: 'Projects',    icon: FolderKanban },
  { href: '/dashboard', label: 'Stats',       icon: BarChart3 },
  { href: '/tags',      label: 'Tags',        icon: Tag },
]

export function Sidebar() {
  const pathname = usePathname()
  const { theme, toggleTheme, sidebarCollapsed, setSidebarCollapsed, openTaskModal } = useUIStore()

  if (sidebarCollapsed) {
    return (
      <div style={{
        width: 60, minWidth: 60,
        background: 'var(--color-bg-elevated)',
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
          const active = pathname === href || pathname.startsWith(href + '/') || (href === '/today' && pathname === '/')
          return (
            <Link key={href} href={href} title={label} style={{ display: 'block' }}>
              <div className="icon-btn" style={{
                color: active ? 'var(--color-accent)' : undefined,
                background: active ? 'var(--color-accent-muted)' : undefined,
                width: 38, height: 38,
                borderRadius: 10,
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
    <div className="sidebar" style={{ background: 'var(--color-bg-elevated)', borderRight: '1px solid var(--color-border)' }}>
      {/* Workspace Brand */}
      <div className="sidebar-brand" style={{ padding: '18px 16px 14px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            color: 'white',
            fontWeight: 900,
            fontSize: 18,
            fontFamily: "'Outfit', sans-serif",
            lineHeight: 1,
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
          }}
        >
          T
        </div>

        <span
          className="sidebar-brand-name"
          style={{
            fontFamily: "'Outfit', 'Inter', sans-serif",
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: '-0.02em',
          }}
        >
          Daily Tracky
        </span>

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
      <div style={{ padding: '4px 14px 12px' }}>
        <button
          onClick={() => openTaskModal()}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '10px 14px',
            fontSize: 13,
            fontWeight: 700,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>New Task</span>
        </button>
      </div>

      <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 14px 10px' }} />

      {/* Main Navigation Links */}
      <div className="sidebar-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, padding: '0 10px' }}>
        <div className="sidebar-section-label" style={{ paddingLeft: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
          MENU
        </div>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/') || (href === '/today' && pathname === '/')
          return (
            <Link key={href} href={href} style={{ display: 'block', textDecoration: 'none' }}>
              <div
                className={`nav-item${active ? ' active' : ''}`}
                style={{
                  borderRadius: 10,
                  padding: '9px 12px',
                  fontWeight: active ? 700 : 500,
                  fontSize: 13.5,
                  gap: 10,
                }}
              >
                <Icon size={18} style={{ flexShrink: 0, color: active ? 'var(--color-accent)' : undefined }} />
                <span>{label}</span>
              </div>
            </Link>
          )
        })}
      </div>

      <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 14px' }} />

      {/* Bottom Theme & Settings */}
      <div className="sidebar-section" style={{ paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 3, padding: '0 10px 16px' }}>
        <button
          className="nav-item"
          onClick={toggleTheme}
          style={{ width: '100%', borderRadius: 10, padding: '8px 12px', fontSize: 13 }}
        >
          {theme === 'dark'
            ? <Sun size={17} style={{ flexShrink: 0, color: '#f59e0b' }} />
            : <Moon size={17} style={{ flexShrink: 0, color: 'var(--color-accent)' }} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <Link href="/settings" style={{ display: 'block', textDecoration: 'none' }}>
          <div
            className={`nav-item${pathname === '/settings' ? ' active' : ''}`}
            style={{ borderRadius: 10, padding: '8px 12px', fontSize: 13 }}
          >
            <Settings size={17} style={{ flexShrink: 0 }} />
            <span>Settings</span>
          </div>
        </Link>
      </div>
    </div>
  )
}
