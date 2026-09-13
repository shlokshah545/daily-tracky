'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Loader2, Check, Trash2 } from 'lucide-react'
import { useUIStore } from '@/lib/store'
import type { Project } from '@/types'

interface ProjectModalProps {
  projectId?: string | null
  onClose: () => void
  onSave?: (project: Project) => void
}

const COLORS = [
  '#6d28d9', '#2563eb', '#059669', '#d97706',
  '#dc2626', '#db2777', '#7c3aed', '#0891b2',
  '#65a30d', '#ea580c',
]

const ICONS = [
  { value: 'folder', emoji: '📁' },
  { value: 'briefcase', emoji: '💼' },
  { value: 'globe', emoji: '🌐' },
  { value: 'code', emoji: '💻' },
  { value: 'dumbbell', emoji: '🏋️' },
  { value: 'book', emoji: '📚' },
  { value: 'rocket', emoji: '🚀' },
  { value: 'star', emoji: '⭐' },
]

export function ProjectModal({ projectId, onClose, onSave }: ProjectModalProps) {
  const isEditing = !!projectId
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#6d28d9')
  const [icon, setIcon] = useState('folder')
  const [deadline, setDeadline] = useState('')
  const [status, setStatus] = useState('active')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!projectId) { setLoading(false); return }
    fetch(`/api/projects/${projectId}`)
      .then(r => r.json())
      .then(({ project }) => {
        if (!project) return
        setName(project.name)
        setDescription(project.description || '')
        setColor(project.color)
        setIcon(project.icon)
        setDeadline(project.deadline || '')
        setStatus(project.status)
        setNotes(project.notes || '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [projectId])

  const handleSave = useCallback(async () => {
    if (!name.trim() || saving) return
    setSaving(true)

    try {
      const url = isEditing ? `/api/projects/${projectId}` : '/api/projects'
      const method = isEditing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(), description, color, icon,
          deadline: deadline || null, status, notes,
        }),
      })
      const data = await res.json()
      useUIStore.getState().refreshProjects()
      useUIStore.getState().refreshTasks()
      onSave?.(data.project)
      onClose()
    } finally {
      setSaving(false)
    }
  }, [name, description, color, icon, deadline, status, notes, isEditing, projectId, onSave, onClose, saving])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSave()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave, onClose])

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-box" style={{ maxWidth: 460 }}>
        {/* Header */}
        <div className="modal-header">
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {isEditing ? 'Edit Project' : 'New Project'}
          </span>
          <button className="icon-btn" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
            <Loader2 size={20} style={{ color: 'var(--color-accent)', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Preview Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: color + '15',
                border: `1px solid ${color}30`,
              }}
            >
              <div
                style={{
                  width: 36, height: 36,
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                  background: color + '25',
                  flexShrink: 0,
                }}
              >
                {ICONS.find(i => i.value === icon)?.emoji || '📁'}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {name || 'Project Name'}
                </div>
                <div style={{ fontSize: 11, color: color, fontWeight: 500 }}>Live Preview</div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 6 }}>
                Project Name *
              </label>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Website Redesign"
                className="input"
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 6 }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Goals, context, objectives..."
                rows={2}
                className="input"
              />
            </div>

            {/* Color selection */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 8 }}>
                Color
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{
                      width: 26, height: 26,
                      borderRadius: '50%',
                      background: c,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: color === c ? `0 0 0 2px var(--color-bg-elevated), 0 0 0 4px ${c}` : 'none',
                      transform: color === c ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.1s, box-shadow 0.1s',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Icon selection */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 8 }}>
                Icon
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ICONS.map(i => (
                  <button
                    key={i.value}
                    type="button"
                    onClick={() => setIcon(i.value)}
                    style={{
                      width: 34, height: 34,
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 16,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: icon === i.value ? color + '20' : 'var(--color-bg-subtle)',
                      border: `1px solid ${icon === i.value ? color : 'var(--color-border)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    {i.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Deadline & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 6 }}>
                  Deadline
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 6 }}>
                  Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="input"
                >
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {!loading && (
          <div className="modal-footer">
            {isEditing && (
              <button
                onClick={async () => {
                  if (confirm('Delete this project? All tasks will remain but become unlinked.')) {
                    await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
                    useUIStore.getState().refreshProjects()
                    useUIStore.getState().refreshTasks()
                    onClose()
                  }
                }}
                className="btn btn-danger"
                style={{ marginRight: 'auto' }}
              >
                <Trash2 size={13} /> Delete
              </button>
            )}
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!name.trim() || saving}
            >
              {saving ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Check size={13} />}
              {isEditing ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
