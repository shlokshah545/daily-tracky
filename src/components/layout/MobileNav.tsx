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
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--color-border)',
        height: 'calc(58px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.04)',
      }}
    >
      {NAV_ITEMS.slice(0, 2).map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              padding: '6px 14px',
              textDecoration: 'none',
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
              fontSize: 10.5,
              fontWeight: isActive ? 700 : 500,
              transition: 'color 0.12s ease',
              minWidth: 52,
            }}
          >
            <Icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{label}</span>
          </Link>
        )
      })}

      {/* Center FAB */}
      <button
        onClick={() => openTaskModal()}
        aria-label="Create new task"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 42,
          height: 42,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-accent) 0%, #4f46e5 100%)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
          cursor: 'pointer',
          flexShrink: 0,
          margin: '-12px 6px 0 6px',
        }}
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {NAV_ITEMS.slice(2).map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              padding: '6px 14px',
              textDecoration: 'none',
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
              fontSize: 10.5,
              fontWeight: isActive ? 700 : 500,
              transition: 'color 0.12s ease',
              minWidth: 52,
            }}
          >
            <Icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
