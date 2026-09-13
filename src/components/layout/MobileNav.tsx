'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, CalendarDays, FolderKanban, BarChart3, Plus } from 'lucide-react'
import { useUIStore } from '@/lib/store'

const NAV_ITEMS = [
  { href: '/today',     icon: Zap,          label: 'Today' },
  { href: '/calendar',  icon: CalendarDays, label: 'Calendar' },
  { href: '/projects',  icon: FolderKanban, label: 'Projects' },
  { href: '/dashboard', icon: BarChart3,    label: 'Stats' },
]

export function MobileNav() {
  const pathname = usePathname()
  const { openTaskModal } = useUIStore()

  return (
    <nav
      className="mobile-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        background: 'var(--color-bg-elevated)',
        borderTop: '1px solid var(--color-border)',
        height: 56,
      }}
    >
      {NAV_ITEMS.slice(0, 2).map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '6px 12px',
              textDecoration: 'none',
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
              fontSize: 10,
              fontWeight: 500,
            }}
          >
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        )
      })}

      {/* Center FAB */}
      <button
        onClick={() => openTaskModal()}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'var(--color-accent)',
          color: 'white',
          border: 'none',
          boxShadow: 'var(--shadow-md)',
          cursor: 'pointer',
        }}
      >
        <Plus size={20} />
      </button>

      {NAV_ITEMS.slice(2).map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '6px 12px',
              textDecoration: 'none',
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
              fontSize: 10,
              fontWeight: 500,
            }}
          >
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
