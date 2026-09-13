'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, Sparkles, Flame } from 'lucide-react'
import { useUIStore } from '@/lib/store'

export function AppHeader() {
  const pathname = usePathname()
  const { openTaskModal } = useUIStore()

  // Determine section title based on pathname
  let sectionTitle = 'Home'
  if (pathname.startsWith('/calendar')) sectionTitle = 'Planner'
  else if (pathname.startsWith('/focus')) sectionTitle = 'Focus Timer'
  else if (pathname.startsWith('/projects')) sectionTitle = 'Projects'
  else if (pathname.startsWith('/dashboard')) sectionTitle = 'Stats'
  else if (pathname.startsWith('/settings')) sectionTitle = 'Settings'
  else if (pathname.startsWith('/tags')) sectionTitle = 'Tags'

  return (
    <header
      className="app-top-header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 18px',
        background: 'var(--color-bg-elevated)',
        borderBottom: '1px solid var(--color-border)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {/* Brand & Section Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Brand Icon Glyph: Modern geometric T */}
        <Link
          href="/today"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            color: 'white',
            fontWeight: 900,
            fontSize: 20,
            fontFamily: "'Outfit', sans-serif",
            textDecoration: 'none',
            boxShadow: '0 2px 10px rgba(99, 102, 241, 0.35)',
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
          title="Daily Tracky"
        >
          T
        </Link>

        {/* Brand Title & Section Subtitle */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
          <Link
            href="/today"
            style={{
              fontFamily: "'Outfit', 'Inter', sans-serif",
              fontWeight: 800,
              fontSize: 18,
              color: 'var(--color-text-primary)',
              textDecoration: 'none',
              letterSpacing: '-0.02em',
            }}
          >
            Tracky
          </Link>

          <span
            style={{
              fontFamily: "'Outfit', 'Inter', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--color-text-tertiary)',
              letterSpacing: '-0.01em',
            }}
          >
            {sectionTitle}
          </span>
        </div>
      </div>

      {/* Right Controls: Quick Add & Settings */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => openTaskModal()}
          className="btn btn-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 11px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 100,
            background: 'var(--color-accent-muted)',
            color: 'var(--color-accent-text)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            cursor: 'pointer',
          }}
          title="Create Task"
        >
          <Sparkles size={13} />
          <span>New</span>
        </button>

        <Link
          href="/settings"
          className="icon-btn"
          style={{
            width: 36,
            height: 36,
            borderRadius: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
          }}
          title="Settings"
        >
          <Settings size={18} />
        </Link>
      </div>
    </header>
  )
}
