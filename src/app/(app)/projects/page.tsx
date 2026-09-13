'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, FolderKanban, Calendar, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useUIStore } from '@/lib/store'
import type { Project } from '@/types'

interface ProjectCard extends Omit<Project, 'tasks'> {
  tasks: { id: string; status: string }[]
}

const ICON_MAP: Record<string, string> = {
  briefcase: '💼', globe: '🌐', dumbbell: '🏋️', code: '💻',
  book: '📚', rocket: '🚀', flame: '🔥', star: '⭐', folder: '📁',
}

function ProjectCardItem({ project }: { project: ProjectCard }) {
  const total = project.tasks.length
  const completed = project.tasks.filter(t => t.status === 'done').length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <Link href={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
      <div
        className="card"
        style={{
          padding: 22,
          cursor: 'pointer',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          height: '100%',
          boxSizing: 'border-box',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = project.color
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)'
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)'
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 42, height: 42,
            borderRadius: 'var(--radius-sm)',
            background: project.color + '18',
            border: `1.5px solid ${project.color}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>
            {ICON_MAP[project.icon || ''] || '📁'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
              {project.name}
            </div>
            {project.description ? (
              <div style={{
                fontSize: 13, color: 'var(--color-text-tertiary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {project.description}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--color-text-disabled)' }}>No description</div>
            )}
          </div>
          <div style={{
            fontSize: 14,
            fontWeight: 800,
            color: project.color,
            background: project.color + '15',
            padding: '4px 10px',
            borderRadius: 100,
            flexShrink: 0,
          }}>
            {pct}%
          </div>
        </div>

        {/* Progress & Stats */}
        <div style={{ marginTop: 'auto' }}>
          <div className="progress-track" style={{ marginBottom: 8, height: 5 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: project.color, borderRadius: 100, transition: 'width 0.4s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
              <CheckCircle2 size={13} style={{ color: project.color }} />
              {completed}/{total} tasks
            </span>
            {project.deadline && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={12} />
                Due {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectCard[]>([])
  const [loading, setLoading] = useState(true)
  const { openProjectModal, projectsVersion, tasksVersion } = useUIStore()

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      setProjects(data.projects || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, projectsVersion, tasksVersion])

  const active = projects.filter(p => p.status === 'active')
  const other  = projects.filter(p => p.status !== 'active')

  if (loading) {
    return (
      <div className="page-wide">
        <div style={{ height: 72, marginBottom: 28 }} className="skeleton" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 180 }} className="skeleton" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="page-wide">
      {/* Header */}
      <div className="responsive-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-sub">{active.length} active projects</p>
        </div>
        <button className="btn btn-primary" onClick={() => openProjectModal()} style={{ alignSelf: 'flex-start' }}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty" style={{ padding: '80px 24px' }}>
          <FolderKanban size={44} style={{ marginBottom: 12, opacity: 0.3 }} />
          <span style={{ fontWeight: 700, fontSize: 18 }}>No projects created yet</span>
          <span style={{ fontSize: 14 }}>Organize your daily tasks into milestones and Kanban boards</span>
          <button className="btn btn-primary" onClick={() => openProjectModal()} style={{ marginTop: 14 }}>
            <Plus size={15} /> Create First Project
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {active.length > 0 && (
            <section>
              <div className="section-label" style={{ marginBottom: 16 }}>
                Active Projects <span className="count-badge">{active.length}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
                {active.map(p => <ProjectCardItem key={p.id} project={p} />)}
                {/* Create Project Card */}
                <button
                  onClick={() => openProjectModal()}
                  style={{
                    background: 'var(--color-bg-subtle)',
                    border: '1.5px dashed var(--color-border-strong)',
                    borderRadius: 'var(--radius-md)',
                    padding: 24,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    minHeight: 160,
                    color: 'var(--color-text-secondary)',
                    fontSize: 14,
                    fontWeight: 600,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-accent)'
                    ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-accent)'
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-muted)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border-strong)'
                    ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)'
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-subtle)'
                  }}
                >
                  <Plus size={24} />
                  <span>Create Project</span>
                </button>
              </div>
            </section>
          )}

          {other.length > 0 && (
            <section>
              <div className="section-label" style={{ marginBottom: 16 }}>
                Completed & Archived <span className="count-badge">{other.length}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
                {other.map(p => <ProjectCardItem key={p.id} project={p} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
