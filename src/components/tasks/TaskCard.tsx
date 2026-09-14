'use client'

import { useState, useEffect } from 'react'
import {
  Clock, Check, Trash2, Edit3, CheckSquare, ListOrdered, Repeat,
  Calendar, AlertCircle, ChevronDown, ChevronUp, CheckCircle2
} from 'lucide-react'
import { format } from 'date-fns'
import { useUIStore } from '@/lib/store'
import type { Task, Subtask } from '@/types'
import { formatRecurrenceLabel } from '@/lib/recurrence'

import { markTaskAsDeleted, recordTaskUpdate } from '@/lib/clientData'

interface TaskCardProps {
  task: Task
  onComplete?: (id: string) => void
  onDelete?: (id: string) => void
  compact?: boolean
}

const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'badge badge-urgent',
  high:   'badge badge-high',
  medium: 'badge badge-medium',
  low:    'badge badge-low',
}

export function TaskCard({ task, onComplete, onDelete, compact = false }: TaskCardProps) {
  const [completing, setCompleting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showSubtasks, setShowSubtasks] = useState(false)
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || [])
  const { openTaskModal } = useUIStore()
  const isDone = task.status === 'done'

  useEffect(() => {
    setSubtasks(task.subtasks || [])
  }, [task.subtasks])

  async function handleToggleComplete(e: React.MouseEvent) {
    e.stopPropagation()
    if (completing) return
    setCompleting(true)
    const newStatus = isDone ? 'not_started' : 'done'
    recordTaskUpdate(task.id, { status: newStatus, completedAt: newStatus === 'done' ? new Date() : null })
    onComplete?.(task.id)
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      useUIStore.getState().refreshTasks()
      useUIStore.getState().refreshProjects()
    } finally {
      setCompleting(false)
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (deleting) return
    setDeleting(true)
    markTaskAsDeleted(task.id)
    onDelete?.(task.id)
    try {
      await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
      useUIStore.getState().refreshTasks()
      useUIStore.getState().refreshProjects()
    } catch {
      // kept deleted locally
    } finally {
      setDeleting(false)
    }
  }

  async function handleToggleSubtask(idx: number, e: React.MouseEvent) {
    e.stopPropagation()
    const updated = subtasks.map((s, i) => i === idx ? { ...s, isCompleted: !s.isCompleted } : s)
    setSubtasks(updated)
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtasks: updated.map(s => ({ title: s.title, isCompleted: s.isCompleted })),
        }),
      })
      useUIStore.getState().refreshTasks()
      useUIStore.getState().refreshProjects()
    } catch (err) {
      console.error(err)
    }
  }

  function formatTime(t?: string | null) {
    if (!t) return null
    const [h, m] = t.split(':').map(Number)
    if (isNaN(h)) return t
    const ampm = h >= 12 ? 'PM' : 'AM'
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
  }

  const completedSubtasks = subtasks.filter(s => s.isCompleted).length
  const subtaskPct = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0

  // Due date countdown logic
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  let dueDateInfo: { text: string; color: string; bg: string; isAlert?: boolean } | null = null

  if (task.dueDate) {
    const isDueToday = task.dueDate === todayStr
    const isFuture = task.dueDate > todayStr
    const isPast = task.dueDate < todayStr

    const diffDays = Math.round(
      (new Date(task.dueDate + 'T00:00:00').getTime() - new Date(todayStr + 'T00:00:00').getTime()) /
      (1000 * 60 * 60 * 24)
    )

    if (isDueToday) {
      dueDateInfo = {
        text: 'Due Today',
        color: 'var(--color-accent-text)',
        bg: 'var(--color-accent-muted)',
      }
    } else if (isFuture) {
      const dayLabel = diffDays === 1 ? 'Due Tomorrow' : `Due in ${diffDays}d (${format(new Date(task.dueDate + 'T12:00:00'), 'MMM d')})`
      dueDateInfo = {
        text: dayLabel,
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.12)',
      }
    } else if (isPast && !isDone) {
      const overdueLabel = Math.abs(diffDays) === 1 ? '1d overdue' : `${Math.abs(diffDays)}d overdue`
      dueDateInfo = {
        text: overdueLabel,
        color: '#ef4444',
        bg: 'var(--color-danger-muted)',
        isAlert: true,
      }
    }
  }

  const priorityBorderColor: Record<string, string> = {
    urgent: '#ef4444',
    high: '#f97316',
    medium: '#3b82f6',
    low: 'transparent',
  }

  return (
    <div
      className={`task-row${isDone ? ' done' : ''}`}
      onClick={() => openTaskModal(task.id)}
      style={{
        opacity: deleting ? 0.3 : isDone ? 0.6 : 1,
        transition: 'all 0.15s ease',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        padding: compact ? '8px 12px' : '12px 16px',
        borderLeft: `3.5px solid ${priorityBorderColor[task.priority] || 'transparent'}`,
        gap: showSubtasks && subtasks.length > 0 ? 10 : 0,
      }}
    >
      {/* Main Task Line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%' }}>
        {/* Checkbox */}
        <button
          type="button"
          className={`check-circle${isDone || completing ? ' checked' : ''}`}
          onClick={handleToggleComplete}
          title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
          style={{
            width: 22,
            height: 22,
            flexShrink: 0,
          }}
        >
          {(isDone || completing) && (
            <Check size={13} strokeWidth={3} color="white" />
          )}
        </button>

        {/* Task Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: compact ? 13 : 15,
            fontWeight: 600,
            lineHeight: 1.4,
            color: isDone ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
            textDecoration: isDone ? 'line-through' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: compact ? 'nowrap' : 'normal',
          }}>
            {task.title}
          </div>

          {!compact && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              {task.priority && task.priority !== 'low' && task.priority !== 'medium' && (
                <span className={PRIORITY_BADGE[task.priority] || 'badge badge-medium'}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              )}

              {/* Project Badge */}
              {task.project && (
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 100,
                  background: task.project.color + '18',
                  color: task.project.color,
                  border: `1px solid ${task.project.color}35`,
                }}>
                  {task.project.name}
                </span>
              )}

              {/* Due Date Badge with Countdown */}
              {dueDateInfo && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  color: dueDateInfo.color,
                  background: dueDateInfo.bg,
                  padding: '2px 8px',
                  borderRadius: 100,
                }}>
                  {dueDateInfo.isAlert ? <AlertCircle size={12} /> : <Calendar size={12} />}
                  {dueDateInfo.text}
                </span>
              )}

              {task.dueTime && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-accent-text)',
                  background: 'var(--color-accent-muted)',
                  padding: '2px 8px',
                  borderRadius: 100,
                }}>
                  <Clock size={12} />
                  {formatTime(task.dueTime)}
                </span>
              )}

              {task.estimatedDuration && (
                <span style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--color-text-tertiary)',
                  background: 'var(--color-bg-muted)',
                  padding: '2px 8px',
                  borderRadius: 100,
                }}>
                  {task.estimatedDuration < 60 ? `${task.estimatedDuration}m` : `${Math.floor(task.estimatedDuration / 60)}h`}
                </span>
              )}

              {task.isRecurring && task.recurrenceRule && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-accent-text)',
                  background: 'var(--color-accent-muted)',
                  padding: '2px 8px',
                  borderRadius: 100,
                  border: '1px solid rgba(99,102,241,0.2)',
                }}>
                  <Repeat size={11} />
                  {formatRecurrenceLabel(task.recurrenceRule)}
                </span>
              )}

              {/* Subtasks pill with interactive toggle */}
              {subtasks.length > 0 && (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    setShowSubtasks(s => !s)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: completedSubtasks === subtasks.length ? 'var(--color-success)' : 'var(--color-text-secondary)',
                    background: completedSubtasks === subtasks.length ? 'var(--color-success-muted)' : 'var(--color-bg-muted)',
                    border: '1px solid var(--color-border)',
                    padding: '2px 8px',
                    borderRadius: 100,
                    cursor: 'pointer',
                  }}
                  title="Click to view/toggle subtasks"
                >
                  <ListOrdered size={12} />
                  {completedSubtasks}/{subtasks.length} subtasks
                  {showSubtasks ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>
              )}

              {task.tags?.slice(0, 3).map(tt => (
                <span key={tt.tag.id} style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--color-text-secondary)',
                  background: 'var(--color-bg-muted)',
                  padding: '2px 8px',
                  borderRadius: 100,
                }}>
                  #{tt.tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Direct Actions: Edit & Delete Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => openTaskModal(task.id)}
            className="icon-btn"
            title="Edit task"
            style={{ width: 32, height: 32 }}
          >
            <Edit3 size={15} />
          </button>

          {/* Direct Delete Button */}
          <button
            type="button"
            onClick={handleDelete}
            className="icon-btn"
            title="Delete task"
            style={{
              width: 32,
              height: 32,
              color: 'var(--color-text-tertiary)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'
              ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-danger-muted)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)'
              ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Expanded Subtasks Checklist */}
      {showSubtasks && subtasks.length > 0 && !compact && (
        <div
          style={{
            width: '100%',
            paddingLeft: 36,
            paddingTop: 8,
            paddingBottom: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            borderTop: '1px solid var(--color-border-subtle, rgba(255,255,255,0.06))',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Mini progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ flex: 1, height: 4, background: 'var(--color-bg-muted)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${subtaskPct}%`,
                background: completedSubtasks === subtasks.length ? 'var(--color-success)' : 'var(--color-accent)',
                borderRadius: 100,
                transition: 'width 0.2s ease',
              }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)' }}>
              {subtaskPct}%
            </span>
          </div>

          {/* Subtask list */}
          {subtasks.map((st, idx) => (
            <div
              key={idx}
              onClick={e => handleToggleSubtask(idx, e)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-bg-subtle)',
                cursor: 'pointer',
                transition: 'background 0.12s ease',
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  border: `1.5px solid ${st.isCompleted ? 'var(--color-success)' : 'var(--color-border-strong)'}`,
                  background: st.isCompleted ? 'var(--color-success)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.12s ease',
                }}
              >
                {st.isCompleted && <Check size={11} strokeWidth={3} color="white" />}
              </div>
              <span style={{
                fontSize: 13,
                color: st.isCompleted ? 'var(--color-text-disabled)' : 'var(--color-text-secondary)',
                textDecoration: st.isCompleted ? 'line-through' : 'none',
                lineHeight: 1.3,
              }}>
                {st.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
