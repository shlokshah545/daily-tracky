'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { X, Plus, Trash2, Calendar, Clock, Loader2, Check, Repeat } from 'lucide-react'
import type { Task, Project, Tag as TagType, Subtask } from '@/types'
import { format } from 'date-fns'
import { DAY_OPTIONS, formatRecurrenceLabel, RecurrenceRule } from '@/lib/recurrence'
import { useUIStore } from '@/lib/store'

interface TaskModalProps {
  taskId?: string | null
  initialDate?: string
  onClose: () => void
  onSave?: (task: Task) => void
}

const PRIORITIES = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high',   label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low',    label: 'Low' },
] as const

const STATUSES = [
  { value: 'not_started', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done',        label: 'Done' },
  { value: 'skipped',     label: 'Skipped' },
] as const

const RECURRENCE_PRESETS = [
  { id: 'none',     label: 'Does not repeat' },
  { id: 'daily',    label: 'Every day' },
  { id: 'weekdays', label: 'Weekdays (Mon–Fri)' },
  { id: 'weekends', label: 'Weekends (Sat–Sun)' },
  { id: 'custom',   label: 'Specific days...' },
] as const

export function TaskModal({ taskId, initialDate, onClose, onSave }: TaskModalProps) {
  const isEditing = !!taskId
  const [loading, setLoading]   = useState(isEditing)
  const [saving, setSaving]     = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'subtasks' | 'notes'>('details')

  // Form fields
  const [title, setTitle]             = useState('')
  const [status, setStatus]           = useState('not_started')
  const [priority, setPriority]       = useState('medium')
  const [dueDate, setDueDate]         = useState(initialDate || format(new Date(), 'yyyy-MM-dd'))
  const [dueTime, setDueTime]         = useState('')
  const [duration, setDuration]       = useState('')
  const [isTimeBlocked, setIsTimeBlocked] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState<'none' | 'daily' | 'weekdays' | 'weekends' | 'custom'>('none')
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [projectId, setProjectId]     = useState('')
  const [notes, setNotes]             = useState('')
  const [subtasks, setSubtasks]       = useState<{ title: string; isCompleted: boolean }[]>([])
  const [newSubtask, setNewSubtask]   = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const [projects, setProjects] = useState<Project[]>([])
  const [tags, setTags]         = useState<TagType[]>([])

  // Load reference data
  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/tags').then(r => r.json()),
    ]).then(([p, t]) => {
      setProjects(p?.projects || [])
      setTags(t?.tags || [])
    }).catch(console.error)
  }, [])

  // Load task if editing
  useEffect(() => {
    if (!taskId) { setLoading(false); return }
    fetch(`/api/tasks/${taskId}`)
      .then(r => r.json())
      .then(({ task }) => {
        if (!task) return
        setTitle(task.title || '')
        setStatus(task.status || 'not_started')
        setPriority(task.priority || 'medium')
        setDueDate(task.dueDate || format(new Date(), 'yyyy-MM-dd'))
        setDueTime(task.dueTime || '')
        setDuration(task.estimatedDuration?.toString() || '')
        setIsTimeBlocked(task.isTimeBlocked || false)
        
        // Parse recurrence
        if (task.isRecurring && task.recurrenceRule) {
          try {
            const rule: RecurrenceRule = typeof task.recurrenceRule === 'string'
              ? JSON.parse(task.recurrenceRule)
              : task.recurrenceRule
            setRecurrenceType(rule.type as any || 'daily')
            if (rule.days && Array.isArray(rule.days)) {
              setSelectedDays(rule.days)
            }
          } catch {
            setRecurrenceType('daily')
          }
        } else {
          setRecurrenceType('none')
        }

        setProjectId(task.projectId || '')
        setNotes(task.notes || '')
        setSubtasks(task.subtasks?.map((s: Subtask) => ({ title: s.title, isCompleted: s.isCompleted })) || [])
        setSelectedTags(task.tags?.map((t: { tag: TagType }) => t.tag.id) || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [taskId])

  const handleSave = useCallback(async () => {
    if (!title.trim() || saving) return
    setSaving(true)

    let isRecurring = recurrenceType !== 'none'
    let recurrenceRule: string | null = null

    if (recurrenceType === 'daily') {
      recurrenceRule = JSON.stringify({ type: 'daily' })
    } else if (recurrenceType === 'weekdays') {
      recurrenceRule = JSON.stringify({ type: 'weekdays', days: [1, 2, 3, 4, 5] })
    } else if (recurrenceType === 'weekends') {
      recurrenceRule = JSON.stringify({ type: 'weekends', days: [0, 6] })
    } else if (recurrenceType === 'custom') {
      recurrenceRule = JSON.stringify({ type: 'custom', days: selectedDays })
    }

    const payload = {
      title: title.trim(),
      status, priority,
      dueDate: dueDate || null,
      dueTime: dueTime || null,
      estimatedDuration: duration ? parseInt(duration) : null,
      isTimeBlocked,
      isRecurring,
      recurrenceRule,
      projectId: projectId || null,
      notes: notes || null,
      tags: selectedTags,
      subtasks: subtasks.map((s, i) => ({ ...s, order: i })),
    }

    try {
      const url = isEditing ? `/api/tasks/${taskId}` : '/api/tasks'
      const method = isEditing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        alert('Could not save task: ' + (errData.error || res.statusText))
        setSaving(false)
        return
      }
      const data = await res.json()
      useUIStore.getState().refreshTasks()
      useUIStore.getState().refreshProjects()
      onSave?.(data.task)
      onClose()
    } catch (err: unknown) {
      console.error(err)
      alert('Error connecting to server. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [title, status, priority, dueDate, dueTime, duration, isTimeBlocked, recurrenceType, selectedDays, projectId, notes, selectedTags, subtasks, isEditing, taskId, onSave, onClose, saving])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSave()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [handleSave, onClose])

  function toggleTag(id: string) {
    setSelectedTags(t => t.includes(id) ? t.filter(x => x !== id) : [...t, id])
  }

  function toggleDay(dayIndex: number) {
    setSelectedDays(prev => {
      if (prev.includes(dayIndex)) {
        if (prev.length === 1) return prev // Keep at least one day
        return prev.filter(d => d !== dayIndex)
      } else {
        return [...prev, dayIndex]
      }
    })
  }

  // Recurrence summary text
  const recurrenceSummary = useMemo(() => {
    if (recurrenceType === 'none') return null
    if (recurrenceType === 'daily') return 'Repeats every single day'
    if (recurrenceType === 'weekdays') return 'Repeats every Monday through Friday'
    if (recurrenceType === 'weekends') return 'Repeats every Saturday and Sunday'
    if (recurrenceType === 'custom') {
      const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const sorted = [...selectedDays].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
      return `Repeats weekly on ${sorted.map(d => names[d]).join(', ')}`
    }
    return null
  }, [recurrenceType, selectedDays])

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-box">
        {/* Header */}
        <div className="modal-header">
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {isEditing ? 'Edit Task' : 'New Task'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>⌘↵ to save</span>
            <button className="icon-btn" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '56px 0' }}>
            <Loader2 size={24} style={{ color: 'var(--color-accent)', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {/* Title Input */}
            <div style={{ padding: '16px 20px 0' }}>
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="input"
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  padding: '11px 14px',
                  background: 'var(--color-bg-subtle)',
                }}
              />
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, padding: '10px 20px 0', borderBottom: '1px solid var(--color-border)' }}>
              {(['details', 'subtasks', 'notes'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab ? '2.5px solid var(--color-accent)' : '2.5px solid transparent',
                    color: activeTab === tab ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                    cursor: 'pointer',
                    marginBottom: -1,
                    textTransform: 'capitalize',
                  }}
                >
                  {tab}
                  {tab === 'subtasks' && subtasks.length > 0 && (
                    <span style={{
                      marginLeft: 6, padding: '1px 6px',
                      background: 'var(--color-accent-muted)',
                      color: 'var(--color-accent-text)',
                      borderRadius: 100, fontSize: 11, fontWeight: 700,
                    }}>
                      {subtasks.filter(s => s.isCompleted).length}/{subtasks.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {activeTab === 'details' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Priority */}
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 8 }}>
                      Priority
                    </label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {PRIORITIES.map(p => {
                        const isSelected = priority === p.value
                        return (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => setPriority(p.value)}
                            className={`priority-pill priority-pill-${p.value}`}
                            style={{
                              opacity: isSelected ? 1 : 0.45,
                              fontWeight: isSelected ? 700 : 500,
                              boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                              transform: isSelected ? 'scale(1.02)' : 'none',
                            }}
                          >
                            {p.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Status & Project */}
                  <div className="form-grid-2">
                    <div>
                      <label className="form-label">Status</label>
                      <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
                        {STATUSES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Project</label>
                      <select className="input" value={projectId} onChange={e => setProjectId(e.target.value)}>
                        <option value="">No project</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Due Date & Time */}
                  <div className="form-grid-2">
                    <div>
                      <label className="form-label"><Calendar size={13} /> {recurrenceType === 'none' ? 'Due Date' : 'Starting Date'}</label>
                      <input type="date" className="input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label"><Clock size={13} /> Time</label>
                      <input type="time" className="input" value={dueTime} onChange={e => setDueTime(e.target.value)} />
                    </div>
                  </div>

                  {/* ═══════════════════════════════════════════════════
                      REPEAT & DAY ASSIGNMENT SECTION
                  ═══════════════════════════════════════════════════ */}
                  <div style={{
                    background: 'var(--color-bg-subtle)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                  }}>
                    <label style={{
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--color-text-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 10,
                    }}>
                      <Repeat size={14} style={{ color: 'var(--color-accent)' }} />
                      Repeat / Schedule Days
                    </label>

                    {/* Recurrence Presets */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {RECURRENCE_PRESETS.map(preset => {
                        const isSelected = recurrenceType === preset.id
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setRecurrenceType(preset.id)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: 13,
                              fontWeight: isSelected ? 700 : 500,
                              border: `1.5px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
                              background: isSelected ? 'var(--color-accent-muted)' : 'var(--color-bg-elevated)',
                              color: isSelected ? 'var(--color-accent-text)' : 'var(--color-text-secondary)',
                              cursor: 'pointer',
                              transition: 'all 0.12s ease',
                            }}
                          >
                            {preset.label}
                          </button>
                        )
                      })}
                    </div>

                    {/* Interactive Days of Week Selector (when custom or specific days chosen) */}
                    {recurrenceType === 'custom' && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                          Select active days:
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {DAY_OPTIONS.map(day => {
                            const isSelected = selectedDays.includes(day.dayIndex)
                            return (
                              <button
                                key={day.fullLabel}
                                type="button"
                                onClick={() => toggleDay(day.dayIndex)}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 44,
                                  height: 48,
                                  borderRadius: 'var(--radius-sm)',
                                  border: `1.5px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
                                  background: isSelected ? 'var(--color-accent)' : 'var(--color-bg-elevated)',
                                  color: isSelected ? '#ffffff' : 'var(--color-text-secondary)',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <span style={{ fontSize: 14 }}>{day.label}</span>
                                <span style={{ fontSize: 9, textTransform: 'uppercase', opacity: isSelected ? 0.9 : 0.6 }}>{day.fullLabel}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Recurrence Summary Message */}
                    {recurrenceSummary && (
                      <div style={{
                        marginTop: 10,
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--color-accent-text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}>
                        <span>✨ {recurrenceSummary}</span>
                      </div>
                    )}
                  </div>

                  {/* Duration & Time Block */}
                  <div className="form-grid-2" style={{ alignItems: 'center' }}>
                    <div>
                      <label className="form-label">Duration (minutes)</label>
                      <input
                        type="number"
                        className="input"
                        value={duration}
                        onChange={e => setDuration(e.target.value)}
                        placeholder="e.g. 45"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="form-label">Calendar Options</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 500, height: 40 }}>
                        <button
                          type="button"
                          onClick={() => setIsTimeBlocked(!isTimeBlocked)}
                          style={{
                            width: 18, height: 18,
                            borderRadius: 'var(--radius-xs)',
                            border: `1.5px solid ${isTimeBlocked ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
                            background: isTimeBlocked ? 'var(--color-accent)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', flexShrink: 0,
                          }}
                        >
                          {isTimeBlocked && <Check size={12} color="white" strokeWidth={3} />}
                        </button>
                        Time blocked slot
                      </label>
                    </div>
                  </div>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 8 }}>
                        Tags
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {tags.map(tag => {
                          const selected = selectedTags.includes(tag.id)
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => toggleTag(tag.id)}
                              style={{
                                padding: '4px 12px',
                                borderRadius: 100,
                                fontSize: 13,
                                fontWeight: selected ? 700 : 500,
                                border: `1.5px solid ${selected ? tag.color : 'var(--color-border-strong)'}`,
                                background: selected ? tag.color + '20' : 'transparent',
                                color: selected ? tag.color : 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.12s',
                              }}
                            >
                              #{tag.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'subtasks' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {subtasks.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                      <button
                        type="button"
                        onClick={() => setSubtasks(prev => prev.map((st, idx) => idx === i ? { ...st, isCompleted: !st.isCompleted } : st))}
                        className={`check-circle${s.isCompleted ? ' checked' : ''}`}
                      >
                        {s.isCompleted && <Check size={11} strokeWidth={3} color="white" />}
                      </button>
                      <span style={{
                        flex: 1, fontSize: 14,
                        fontWeight: 500,
                        color: s.isCompleted ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                        textDecoration: s.isCompleted ? 'line-through' : 'none',
                      }}>
                        {s.title}
                      </span>
                      <button className="icon-btn" onClick={() => setSubtasks(prev => prev.filter((_, idx) => idx !== i))}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input
                      className="input"
                      value={newSubtask}
                      onChange={e => setNewSubtask(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (newSubtask.trim()) {
                            setSubtasks(s => [...s, { title: newSubtask.trim(), isCompleted: false }])
                            setNewSubtask('')
                          }
                        }
                      }}
                      placeholder="Add a subtask..."
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        if (newSubtask.trim()) {
                          setSubtasks(s => [...s, { title: newSubtask.trim(), isCompleted: false }])
                          setNewSubtask('')
                        }
                      }}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <textarea
                  className="input"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add notes, specifications, URLs, checklists..."
                  rows={12}
                  style={{ fontFamily: 'inherit', fontSize: 14, lineHeight: 1.6 }}
                />
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {isEditing && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={async () => {
                      if (confirm('Delete this task?')) {
                        try {
                          const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
                          if (!res.ok) {
                            const errData = await res.json().catch(() => ({}))
                            alert('Could not delete task: ' + (errData.error || res.statusText))
                            return
                          }
                          useUIStore.getState().refreshTasks()
                          useUIStore.getState().refreshProjects()
                          onClose()
                        } catch {
                          alert('Error deleting task. Please try again.')
                        }
                      }
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }} className="hide-mobile">⌘↵ to save</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSave}
                  disabled={!title.trim() || saving}
                >
                  {saving
                    ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                    : <Check size={14} />}
                  {isEditing ? 'Save' : 'Create'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
