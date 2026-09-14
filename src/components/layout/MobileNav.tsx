'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Timer, CalendarDays, FolderKanban, BarChart3, Settings, Sparkles } from 'lucide-react'
import { useUIStore } from '@/lib/store'

const NAV_ITEMS = [
  { href: '/today',     icon: LayoutDashboard, label: 'Home' },
  { href: '/focus',     icon: Timer,           label: 'Focus' },
  { href: '/calendar',  icon: CalendarDays,    label: 'Planner' },
  { href: '/projects',  icon: FolderKanban,    label: 'Projects' },
  { href: '/dashboard', icon: BarChart3,       label: 'Stats' },
  { href: '/settings',  icon: Settings,        label: 'More' },
]

export function MobileNav() {
  const pathname = usePathname()
  const { openTaskModal } = useUIStore()

  return (
    <>
      {/* ─── Floating Sparkle Quick Action FAB ─── */}
      <button
        onClick={() => openTaskModal()}
        aria-label="Quick Action / Create Task"
        className="floating-sparkle-fab"
        style={{
          position: 'fixed',
          bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))',
          right: 18,
          zIndex: 45,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          color: 'white',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.5), 0 2px 6px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.92)' }}
        onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
      >
        <Sparkles size={24} strokeWidth={2.2} />
      </button>

      {/* ─── 6-Item Bottom Navigation Bar ─── */}
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
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--color-border)',
          height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
          paddingLeft: 4,
          paddingRight: 4,
        }}
      >
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href + '/')) || (href === '/today' && pathname === '/')
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2.5,
                padding: '5px 8px',
                textDecoration: 'none',
                color: isActive ? 'var(--color-accent-text)' : 'var(--color-text-tertiary)',
                fontSize: 10,
                fontWeight: isActive ? 800 : 500,
                fontFamily: "'Outfit', 'Inter', sans-serif",
                transition: 'all 0.15s ease',
                flex: 1,
                minWidth: 44,
                letterSpacing: isActive ? '0.02em' : '0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: isActive ? 'var(--color-accent-muted)' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  style={{
                    color: isActive ? 'var(--color-accent)' : 'inherit',
                  }}
                />
              </div>
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
