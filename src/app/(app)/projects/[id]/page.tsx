'use client'

import { use, useState, useEffect, useCallback } from 'react'
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, useSensor, useSensors,
  DragStartEvent, DragEndEvent, useDroppable, useDraggable,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus, ArrowLeft, Pencil, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskQuickAdd } from '@/components/tasks/TaskQuickAdd'
import { useUIStore } from '@/lib/store'
import type { Project, Task } from '@/types'

const COLUMNS = [
  { id: 'not_started', title: 'To Do',       color: '#6b7280' },
  { id: 'in_progress', title: 'In Progress', color: '#3b82f6' },
  { id: 'done',        title: 'Done',        color: '#10b981' },
] as const

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active:    { label: 'Active',    color: 'var(--color-success)' },
  on_hold:   { label: 'On Hold',   color: 'var(--color-warning)' },
  completed: { label: 'Completed', color: 'var(--color-accent-text)' },
  archived:  { label: 'Archived',  color: 'var(--color-text-disabled)' },
}

interface KanbanColumnProps {
  column: typeof COLUMNS[number]
  tasks: Task[]
  onTaskComplete: (id: string) => void
  onTaskDelete: (id: string) => void
  onAddTask: () => void
  projectId: string
  isDragOver?: boolean
}

function KanbanCol({ column, tasks, onTaskComplete, onTaskDelete, onAddTask, projectId, isDragOver }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: column.id })
  const { openTaskModal } = useUIStore()

  return (
    <div
      ref={setNodeRef}
      className="kanban-column"
      style={{
        borderColor: isDragOver ? 'var(--color-accent)' : undefined,
        background: isDragOver ? 'var(--color-accent-muted)' : undefined,
      }}
    >
      {/* Column header */}
      <div className="kanban-col-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: column.color }} />
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)' }}>
            {column.title}
          </span>
          <span className="count-badge">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => openTaskModal()}
          className="icon-btn"
          title="Add task to column"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Tasks */}
      <div className="kanban-col-body">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <DraggableTask key={task.id} task={task} onComplete={onTaskComplete} onDelete={onTaskDelete} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="kanban-drop-target">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  )
}

function DraggableTask({ task, onComplete, onDelete }: { task: Task; onComplete: (id: string) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.35 : 1,
        cursor: 'grab',
      }}
      {...listeners}
      {...attributes}
    >
      <TaskCard
        task={task}
        onComplete={onComplete}
        onDelete={onDelete}
      />
    </div>
  )
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ProjectDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const [project, setProject] = useState<Project & { tasks: Task[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [mobileTab, setMobileTab] = useState<string>('all')
  const { openProjectModal, projectsVersion, tasksVersion } = useUIStore()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`)
      const data = await res.json()
      setProject(data.project)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchProject() }, [fetchProject, projectsVersion, tasksVersion])

  function handleDragStart(event: DragStartEvent) {
    const task = project?.tasks.find(t => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)

    if (!over || !project) return
    const taskId = String(active.id)
    const newStatus = String(over.id)

    if (!COLUMNS.find(c => c.id === newStatus)) return

    const task = project.tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    setProject(prev => prev ? {
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t),
    } : null)

    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    useUIStore.getState().refreshTasks()
    useUIStore.getState().refreshProjects()
  }

  function handleTaskComplete(id: string) {
    setProject(prev => prev ? {
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, status: t.status === 'done' ? 'not_started' : 'done' } : t),
    } : null)
  }

  function handleTaskDelete(id: string) {
    setProject(prev => prev ? { ...prev, tasks: prev.tasks.filter(t => t.id !== id) } : null)
  }

  function formatDate(d?: string | null) {
    if (!d) return null
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading || !project) {
    return (
      <div className="page-wide">
        <div style={{ height: 80, marginBottom: 20 }} className="skeleton" />
        <div style={{ display: 'flex', gap: 16 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 360, flex: 1 }} className="skeleton" />)}
        </div>
      </div>
    )
  }

  const total = project.tasks.length
  const completed = project.tasks.filter(t => t.status === 'done').length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const statusCfg = STATUS_CONFIG[project.status]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Top Details Bar */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-elevated)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/projects" className="icon-btn" title="Back to projects">
              <ArrowLeft size={16} />
            </Link>
            <div style={{
              width: 38, height: 38, borderRadius: 'var(--radius-sm)',
              background: project.color + '18',
              border: `1.5px solid ${project.color}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>
              📁
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                {project.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: statusCfg?.color || 'var(--color-text-secondary)' }}>
                  {statusCfg?.label || project.status}
                </span>
                {project.deadline && (
                  <>
                    <span style={{ color: 'var(--color-border-strong)' }}>·</span>
                    <span style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)' }}>
                      Due {formatDate(project.deadline)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => openProjectModal(project.id)}
            className="btn btn-secondary btn-sm"
          >
            <Pencil size={12} />
            Edit
          </button>
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)' }}>
              {completed} of {total} tasks completed
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: project.color }}>
              {pct}%
            </span>
          </div>
          <div className="progress-track" style={{ height: 5 }}>
            <div
              className="progress-fill"
              style={{
                width: `${pct}%`,
                background: project.color,
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Add Bar & Mobile Column Switcher */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}>
        <div style={{ maxWidth: 640, marginBottom: 8 }}>
          <TaskQuickAdd onAdd={fetchProject} placeholder={`Add task to ${project.name}...`} />
        </div>

        {/* Mobile Column Tabs */}
        <div className="mobile-column-tabs" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingTop: 4 }}>
          <button
            onClick={() => setMobileTab('all')}
            style={{
              padding: '4px 10px',
              borderRadius: 100,
              fontSize: 11.5,
              fontWeight: 600,
              background: mobileTab === 'all' ? 'var(--color-accent)' : 'var(--color-bg-elevated)',
              color: mobileTab === 'all' ? '#ffffff' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            All Columns ({total})
          </button>
          {COLUMNS.map(col => {
            const count = project.tasks.filter(t => t.status === col.id).length
            const isSelected = mobileTab === col.id
            return (
              <button
                key={col.id}
                onClick={() => setMobileTab(col.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 100,
                  fontSize: 11.5,
                  fontWeight: 600,
                  background: isSelected ? 'var(--color-accent-muted)' : 'var(--color-bg-elevated)',
                  color: isSelected ? 'var(--color-accent-text)' : 'var(--color-text-secondary)',
                  border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.title} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Kanban Board Container */}
      <div style={{ flex: 1, overflowX: 'auto', padding: '16px 16px 100px 16px' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="kanban-board-container">
            {COLUMNS
              .filter(column => mobileTab === 'all' || mobileTab === column.id)
              .map(column => {
                const colTasks = project.tasks.filter(t => t.status === column.id)
                return (
                  <KanbanCol
                    key={column.id}
                    column={column}
                    tasks={colTasks}
                    onTaskComplete={handleTaskComplete}
                    onTaskDelete={handleTaskDelete}
                    onAddTask={() => {}}
                    projectId={id}
                  />
                )
              })}
          </div>

          <DragOverlay>
            {activeTask && (
              <div style={{ transform: 'rotate(2deg)', opacity: 0.9 }}>
                <TaskCard task={activeTask} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <style>{`
        @media (min-width: 641px) {
          .mobile-column-tabs { display: none !important; }
        }
      `}</style>
    </div>
  )
}
