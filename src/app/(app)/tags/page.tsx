'use client'

import { useState, useEffect } from 'react'
import { Tag as TagIcon, Filter } from 'lucide-react'
import { TaskCard } from '@/components/tasks/TaskCard'
import { useUIStore } from '@/lib/store'
import { mergeWithLocalTasks } from '@/lib/clientData'
import type { Task } from '@/types'

interface TagWithTasks {
  id: string
  name: string
  color: string
  tasks: { task: Task }[]
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagWithTasks[]>([])
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { tagsVersion, tasksVersion } = useUIStore()

  useEffect(() => {
    fetch('/api/tags')
      .then(r => r.json())
      .then(data => { setTags(data.tags || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [tagsVersion, tasksVersion])

  const currentTag = tags.find(t => t.id === selectedTag)
  const rawTagTasks = currentTag?.tasks.map(t => t.task) || []
  const tasks = mergeWithLocalTasks(rawTagTasks)
  const totalTasksCount = tags.reduce((acc, t) => acc + t.tasks.length, 0)

  function handleComplete(id: string) {
    setTags(prev => prev.map(t => ({
      ...t,
      tasks: t.tasks.map(tt => tt.task.id === id ? { task: { ...tt.task, status: 'done' as const } } : tt),
    })))
  }

  function handleDelete(id: string) {
    setTags(prev => prev.map(t => ({
      ...t,
      tasks: t.tasks.filter(tt => tt.task.id !== id),
    })))
  }

  if (loading) {
    return (
      <div className="page-wide">
        <div style={{ height: 60, marginBottom: 24 }} className="skeleton" />
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ width: 220, height: 300 }} className="skeleton" />
          <div style={{ flex: 1, height: 300 }} className="skeleton" />
        </div>
      </div>
    )
  }

  return (
    <div className="page-wide">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Tags</h1>
        <p className="page-sub">{tags.length} tags across {totalTasksCount} task attachments</p>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Tag sidebar filter */}
        <div style={{
          width: 200,
          minWidth: 200,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 8,
        }}>
          <button
            onClick={() => setSelectedTag(null)}
            className={`nav-item${!selectedTag ? ' active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            <Filter size={13} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, flex: 1, textAlign: 'left' }}>All Tags</span>
            <span className="count-badge">{totalTasksCount}</span>
          </button>

          <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />

          {tags.map(tag => {
            const isSelected = selectedTag === tag.id
            return (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag.id)}
                className={`nav-item${isSelected ? ' active' : ''}`}
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  color: isSelected ? tag.color : undefined,
                  background: isSelected ? tag.color + '18' : undefined,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: tag.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  #{tag.name}
                </span>
                <span className="count-badge">{tag.tasks.length}</span>
              </button>
            )
          })}
        </div>

        {/* Tag Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!selectedTag ? (
            /* Tag Overview Cloud */
            <div>
              <div className="section-label" style={{ marginBottom: 12 }}>
                All Tags
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedTag(tag.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      borderRadius: 100,
                      background: tag.color + '15',
                      border: `1px solid ${tag.color}35`,
                      color: tag.color,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                      transition: 'transform 0.1s, opacity 0.1s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                  >
                    <TagIcon size={12} />
                    <span>#{tag.name}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 100,
                        background: tag.color + '25',
                      }}
                    >
                      {tag.tasks.length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: currentTag?.color }} />
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  #{currentTag?.name}
                </h2>
                <span className="count-badge">{tasks.length} tasks</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {tasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                  />
                ))}
                {tasks.length === 0 && (
                  <div className="empty">
                    <span>No tasks tagged with #{currentTag?.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
