'use client'

import { useState, useRef } from 'react'
import { Plus, X, Tag, Calendar, Clock, Loader2, Check, Repeat } from 'lucide-react'
import { parseNaturalTask } from '@/lib/nlp-parser'
import { formatRecurrenceLabel } from '@/lib/recurrence'
import { useUIStore } from '@/lib/store'
import { recordNewTask } from '@/lib/clientData'

interface Props {
  defaultDate?: string
  defaultProjectId?: string
  onAdd?: () => void
  placeholder?: string
}

function formatDateShort(d: string) {
  const dt = new Date(d + 'T00:00')
  const today = new Date(); today.setHours(0,0,0,0)
  const diff = Math.round((dt.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTimePretty(t: string) {
  const [h, m] = t.split(':').map(Number)
  if (isNaN(h)) return t
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export function TaskQuickAdd({ defaultDate, defaultProjectId, onAdd, placeholder }: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [flash, setFlash] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const parsed = input.trim() ? parseNaturalTask(input) : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    setLoading(true)
    const taskPayload = {
      title: parsed?.title || input.trim(),
      priority: parsed?.priority || 'medium',
      dueDate: parsed?.dueDate || defaultDate || null,
      dueTime: parsed?.dueTime || null,
      isRecurring: parsed?.isRecurring || false,
      recurrenceRule: parsed?.recurrenceRule ? JSON.stringify(parsed.recurrenceRule) : null,
      projectId: defaultProjectId || null,
      status: 'not_started',
    }
    const tempId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    recordNewTask({
      id: tempId,
      ...taskPayload,
      subtasks: [],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)

    setInput('')
    setFlash(true)
    setTimeout(() => setFlash(false), 1000)
    useUIStore.getState().refreshTasks()
    useUIStore.getState().refreshProjects()
    onAdd?.()

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskPayload),
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.task) {
          recordNewTask(data.task, tempId)
        }
      }
    } catch (err) {
      console.warn('Background server sync failed, task preserved locally:', err)
    } finally {
      setLoading(false)
      useUIStore.getState().refreshTasks()
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 18px',
            background: 'var(--color-bg-elevated)',
            border: `1.5px solid ${flash ? 'var(--color-success)' : 'var(--color-border)'}`,
            borderRadius: 100,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: flash ? 'var(--color-success-muted)' : 'var(--color-accent-muted)',
            flexShrink: 0,
            color: flash ? 'var(--color-success)' : 'var(--color-accent-text)',
          }}>
            {loading ? (
              <Loader2 size={14} style={{ color: 'var(--color-accent)', animation: 'spin 0.7s linear infinite' }} />
            ) : flash ? (
              <Check size={14} strokeWidth={3} />
            ) : (
              <Plus size={16} />
            )}
          </div>

          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={placeholder || 'Add a task... "Workout daily 7am #health" or "Team Sync every mon, wed 10am"'}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 14,
              color: 'var(--color-text-primary)',
              fontFamily: 'inherit',
            }}
          />

          {input && (
            <button
              type="button"
              onClick={() => setInput('')}
              className="icon-btn"
              style={{ width: 24, height: 24 }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </form>

      {/* NLP Preview Chips */}
      {parsed && input.trim() && (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 8, paddingLeft: 4 }}>
          {parsed.isRecurring && parsed.recurrenceRule && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600,
              background: 'var(--color-accent-muted)', color: 'var(--color-accent-text)',
              border: '1px solid rgba(99,102,241,0.25)',
            }}>
              <Repeat size={11} /> {formatRecurrenceLabel(JSON.stringify(parsed.recurrenceRule))}
            </span>
          )}
          {parsed.dueDate && !parsed.isRecurring && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600,
              background: 'var(--color-accent-muted)', color: 'var(--color-accent-text)',
            }}>
              <Calendar size={11} /> {formatDateShort(parsed.dueDate)}
            </span>
          )}
          {parsed.dueTime && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600,
              background: 'var(--color-accent-muted)', color: 'var(--color-accent-text)',
            }}>
              <Clock size={11} /> {formatTimePretty(parsed.dueTime)}
            </span>
          )}
          {parsed.priority && parsed.priority !== 'medium' && (
            <span className={`badge badge-${parsed.priority}`}>{parsed.priority}</span>
          )}
          {parsed.tags?.map((tag: string) => (
            <span key={tag} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 500,
              background: 'var(--color-bg-muted)', color: 'var(--color-text-secondary)',
            }}>
              <Tag size={11} /> #{tag}
            </span>
          ))}
          <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginLeft: 4 }}>Press ↵ to add</span>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
