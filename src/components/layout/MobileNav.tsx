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
        background: 'rgba(9, 9, 18, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(51, 65, 85, 0.6)',
        height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
      }}
    >
      <style>{`
        html.light nav.mobile-nav {
          background: rgba(255,255,255,0.92) !important;
          border-top-color: rgba(226,232,240,0.8) !important;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.06) !important;
        }
      `}</style>

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
              padding: '6px 16px',
              textDecoration: 'none',
              color: isActive ? 'var(--accent-text)' : 'var(--text-4)',
              fontSize: 10,
              fontWeight: isActive ? 700 : 500,
              transition: 'color 0.15s ease',
              minWidth: 52,
              letterSpacing: isActive ? '0.01em' : '0',
            }}
          >
            <Icon
              size={20}
              strokeWidth={isActive ? 2.5 : 1.8}
              style={{ filter: isActive ? 'drop-shadow(0 0 6px rgba(99,102,241,0.5))' : 'none' }}
            />
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
          width: 46,
          height: 46,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.5), 0 0 0 3px rgba(99,102,241,0.15)',
          cursor: 'pointer',
          flexShrink: 0,
          margin: '-14px 8px 0 8px',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(99, 102, 241, 0.65), 0 0 0 4px rgba(99,102,241,0.2)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.5), 0 0 0 3px rgba(99,102,241,0.15)'
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
              padding: '6px 16px',
              textDecoration: 'none',
              color: isActive ? 'var(--accent-text)' : 'var(--text-4)',
              fontSize: 10,
              fontWeight: isActive ? 700 : 500,
              transition: 'color 0.15s ease',
              minWidth: 52,
              letterSpacing: isActive ? '0.01em' : '0',
            }}
          >
            <Icon
              size={20}
              strokeWidth={isActive ? 2.5 : 1.8}
              style={{ filter: isActive ? 'drop-shadow(0 0 6px rgba(99,102,241,0.5))' : 'none' }}
            />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
