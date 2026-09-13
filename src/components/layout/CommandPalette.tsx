'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUIStore } from '@/lib/store'
import { Search, CheckSquare, FolderKanban, CalendarDays, BarChart3, Tag, X } from 'lucide-react'
import type { Task, Project } from '@/types'

interface SearchResult {
  type: 'task' | 'project' | 'page'
  id: string
  title: string
  subtitle?: string
  href?: string
  icon: React.ReactNode
}

const STATIC_PAGES: SearchResult[] = [
  { type: 'page', id: 'today',     title: 'Today',     subtitle: 'Daily task view', href: '/today',     icon: <CheckSquare size={14} /> },
  { type: 'page', id: 'calendar',  title: 'Calendar',  subtitle: 'Calendar grid & schedule', href: '/calendar',  icon: <CalendarDays size={14} /> },
  { type: 'page', id: 'projects',  title: 'Projects',  subtitle: 'Project management', href: '/projects',  icon: <FolderKanban size={14} /> },
  { type: 'page', id: 'dashboard', title: 'Dashboard', subtitle: 'Analytics & heatmap', href: '/dashboard', icon: <BarChart3 size={14} /> },
  { type: 'page', id: 'tags',      title: 'Tags',      subtitle: 'Tag manager', href: '/tags',      icon: <Tag size={14} /> },
]

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, openTaskModal } = useUIStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>(STATIC_PAGES)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const router = useRouter()

  // Open with Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  // Fetch data when opened
  useEffect(() => {
    if (!commandPaletteOpen) return
    setQuery('')
    setSelectedIndex(0)
    Promise.all([
      fetch('/api/tasks').then(r => r.json()).catch(() => []),
      fetch('/api/projects').then(r => r.json()).catch(() => []),
    ]).then(([t, p]) => {
      setTasks(t?.tasks || [])
      setProjects(p?.projects || [])
    })
  }, [commandPaletteOpen])

  // Filter results based on query
  useEffect(() => {
    const q = query.toLowerCase().trim()
    if (!q) {
      setResults(STATIC_PAGES)
      return
    }

    const taskResults: SearchResult[] = tasks
      .filter(t => t.title.toLowerCase().includes(q))
      .slice(0, 5)
      .map(t => ({
        type: 'task' as const,
        id: t.id,
        title: t.title,
        subtitle: t.project?.name || (t.dueDate ? `Due ${t.dueDate}` : 'No due date'),
        icon: <CheckSquare size={14} />,
      }))

    const projectResults: SearchResult[] = projects
      .filter(p => p.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map(p => ({
        type: 'project' as const,
        id: p.id,
        title: p.name,
        subtitle: p.description || undefined,
        href: `/projects/${p.id}`,
        icon: <FolderKanban size={14} />,
      }))

    const pageResults = STATIC_PAGES.filter(p => p.title.toLowerCase().includes(q))

    setResults([...pageResults, ...taskResults, ...projectResults])
    setSelectedIndex(0)
  }, [query, tasks, projects])

  const handleSelect = useCallback((result: SearchResult) => {
    setCommandPaletteOpen(false)
    if (result.type === 'task') {
      openTaskModal(result.id)
    } else if (result.href) {
      router.push(result.href)
    }
  }, [router, setCommandPaletteOpen, openTaskModal])

  // Keyboard navigation
  useEffect(() => {
    if (!commandPaletteOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        handleSelect(results[selectedIndex])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [commandPaletteOpen, results, selectedIndex, handleSelect])

  if (!commandPaletteOpen) return null

  return (
    <div
      className="modal-overlay"
      style={{ alignItems: 'flex-start', paddingTop: '15vh' }}
      onClick={e => { if (e.target === e.currentTarget) setCommandPaletteOpen(false) }}
    >
      <div
        className="modal-box"
        style={{
          maxWidth: 520,
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <Search size={16} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search tasks, projects, pages..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 14,
              color: 'var(--color-text-primary)',
            }}
          />
          <button className="icon-btn" onClick={() => setCommandPaletteOpen(false)}>
            <X size={14} />
          </button>
        </div>

        {/* Results list */}
        <div style={{ maxHeight: 340, overflowY: 'auto', padding: 6 }}>
          {results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map((result, i) => {
              const isSelected = i === selectedIndex
              return (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'var(--color-accent-muted)' : 'transparent',
                    color: isSelected ? 'var(--color-accent-text)' : 'var(--color-text-primary)',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.08s',
                  }}
                >
                  <span style={{ color: isSelected ? 'var(--color-accent)' : 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center' }}>
                    {result.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {result.title}
                    </div>
                    {result.subtitle && (
                      <div style={{ fontSize: 11, color: isSelected ? 'var(--color-accent-text)' : 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {result.subtitle}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: isSelected ? 'rgba(109,40,217,0.15)' : 'var(--color-bg-muted)',
                      color: isSelected ? 'var(--color-accent-text)' : 'var(--color-text-tertiary)',
                      flexShrink: 0,
                    }}
                  >
                    {result.type}
                  </span>
                </button>
              )
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 16px',
          borderTop: '1px solid var(--color-border)',
          fontSize: 11,
          color: 'var(--color-text-tertiary)',
          background: 'var(--color-bg-subtle)',
        }}>
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
          <span style={{ marginLeft: 'auto' }}>Ctrl+K</span>
        </div>
      </div>
    </div>
  )
}
