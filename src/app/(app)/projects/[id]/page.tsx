'use client'

import { useState, useEffect, useCallback } from 'react'
import { use } from 'react'
import {
  DndContext, DragOverlay, DragEndEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable, useDraggable,
  closestCorners,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, ArrowLeft, Pencil } from 'lucide-react'
import Link from 'next/link'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskQuickAdd } from '@/components/tasks/TaskQuickAdd'
import { useUIStore } from '@/lib/store'
import type { Project, Task } from '@/types'
import { formatDate, PROJECT_STATUS_CONFIG } from '@/lib/utils'

const COLUMNS = [
  { id: 'not_started', title: 'To Do',        color: 'var(--color-text-secondary)' },
  { id: 'in_progress', title: 'In Progress',  color: '#3b82f6' },
  { id: 'done',        title: 'Done',          color: 'var(--color-success)' },
]

interface KanbanColumnProps {
  column: typeof COLUMNS[0]
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
          <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)' }}>
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

    // Optimistic update
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
      tasks: prev.tasks.map(t => t.id === id ? { ...t, status: 'done' } : t),
    } : null)
  }

  function handleTaskDelete(id: string) {
    setProject(prev => prev ? { ...prev, tasks: prev.tasks.filter(t => t.id !== id) } : null)
  }

  if (loading) {
    return (
      <div className="page-wide">
        <div style={{ height: 80, marginBottom: 20 }} className="skeleton" />
        <div style={{ display: 'flex', gap: 16 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ width: 272, height: 400 }} className="skeleton" />)}
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="empty" style={{ margin: '80px auto', maxWidth: 400 }}>
        <p style={{ fontWeight: 600 }}>Project not found</p>
        <Link href="/projects" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}>
          Back to Projects
        </Link>
      </div>
    )
  }

  const total = project.tasks.length
  const completed = project.tasks.filter(t => t.status === 'done').length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const statusCfg = PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/projects" className="icon-btn" title="Back to projects">
              <ArrowLeft size={16} />
            </Link>
            <div
              style={{
                width: 36, height: 36,
                borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
                background: project.color + '18',
                border: `1px solid ${project.color}35`,
              }}
            >
              {project.icon === 'briefcase' ? '💼' :
               project.icon === 'globe' ? '🌐' :
               project.icon === 'dumbbell' ? '🏋️' :
               project.icon === 'code' ? '💻' :
               project.icon === 'book' ? '📚' :
               project.icon === 'rocket' ? '🚀' :
               project.icon === 'star' ? '⭐' : '📁'}
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                {project.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: statusCfg?.color || 'var(--color-text-secondary)' }}>
                  {statusCfg?.label || project.status}
                </span>
                {project.deadline && (
                  <>
                    <span style={{ color: 'var(--color-border-strong)' }}>·</span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              {completed} of {total} tasks completed
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: project.color }}>
              {pct}%
            </span>
          </div>
          <div className="progress-track">
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

      {/* Quick Add Bar */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}>
        <div style={{ maxWidth: 640 }}>
          <TaskQuickAdd onAdd={fetchProject} placeholder={`Add task to ${project.name}...`} />
        </div>
      </div>

      {/* Kanban Board */}
      <div style={{ flex: 1, overflowX: 'auto', padding: 24 }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', minHeight: '100%' }}>
            {COLUMNS.map(column => {
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
    </div>
  )
}
