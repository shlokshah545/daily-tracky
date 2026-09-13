'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  format, startOfWeek, addDays, isSameDay, isToday
} from 'date-fns'
import {
  Clock, Zap, RefreshCw, CheckCircle2, Flame, Calendar, Sparkles,
  Sun, Moon, Sunrise, Sunset, Trash2, Edit3, Plus, Filter,
  ArrowUpRight, Target, CheckCircle, ChevronDown, ChevronUp, AlertCircle,
  FolderKanban
} from 'lucide-react'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskQuickAdd } from '@/components/tasks/TaskQuickAdd'
import { useUIStore } from '@/lib/store'
import type { Task } from '@/types'

type TaskFilter = 'all' | 'today' | 'ongoing' | 'priority' | 'time' | 'recurring' | 'done'

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all')
  const [showDone, setShowDone] = useState(true)
  const { openTaskModal, tasksVersion, projectsVersion } = useUIStore()

  const today = useMemo(() => new Date(), [])
  const todayStr = useMemo(() => format(today, 'yyyy-MM-dd'), [today])

  // Weekdays strip for momentum bar
  const weekDays = useMemo(() => {
    const start = startOfWeek(today, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [today])

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks?date=${todayStr}`)
      const data = await res.json()
      setTasks(data.tasks || [])
    } finally {
      setLoading(false)
    }
  }, [todayStr])

  const fetchStreak = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics?days=7')
      const data = await res.json()
      setStreak(data.currentStreak || 0)
    } catch {}
  }, [])

  useEffect(() => {
    fetchTasks()
    fetchStreak()
  }, [fetchTasks, fetchStreak, tasksVersion, projectsVersion])

  const done      = tasks.filter(t => t.status === 'done')
  const active    = tasks.filter(t => t.status !== 'done')

  // Specific date classifications
  const isDueToday     = (t: Task) => t.dueDate === todayStr || (!t.dueDate && !t.isRecurring)
  const isFutureDue    = (t: Task) => !!(t.dueDate && t.dueDate > todayStr && !t.isRecurring)
  const isPastDue      = (t: Task) => !!(t.dueDate && t.dueDate < todayStr && !t.isRecurring)

  const timeBlock      = tasks.filter(t => t.dueTime && isDueToday(t) && t.status !== 'done')
  const todayTasks     = tasks.filter(t => !t.dueTime && isDueToday(t) && !t.isRecurring && t.status !== 'done')
  const ongoingProjects = tasks.filter(t => isFutureDue(t) && t.status !== 'done')
  const overdueTasks   = tasks.filter(t => isPastDue(t) && t.status !== 'done')
  const recurring      = tasks.filter(t => t.isRecurring && t.status !== 'done')
  const priorityTasks  = tasks.filter(t => (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'done')
  
  const total = tasks.length
  const pct = total > 0 ? Math.round((done.length / total) * 100) : 0
  const allDone = total > 0 && pct === 100

  // Time-based greeting and icon
  const hour = today.getHours()
  const { greeting, TimeIcon, timePeriod } = useMemo(() => {
    if (hour >= 5 && hour < 12) {
      return { greeting: 'Good morning', TimeIcon: Sunrise, timePeriod: 'Morning Focus' }
    } else if (hour >= 12 && hour < 17) {
      return { greeting: 'Good afternoon', TimeIcon: Sun, timePeriod: 'Afternoon Flow' }
    } else if (hour >= 17 && hour < 21) {
      return { greeting: 'Good evening', TimeIcon: Sunset, timePeriod: 'Evening Wrap-Up' }
    } else {
      return { greeting: 'Good night', TimeIcon: Moon, timePeriod: 'Night Reflection' }
    }
  }, [hour])

  // Filtered task lists
  const displayTasks = useMemo(() => {
    if (activeFilter === 'today') return [...timeBlock, ...todayTasks]
    if (activeFilter === 'ongoing') return ongoingProjects
    if (activeFilter === 'priority') return priorityTasks
    if (activeFilter === 'time') return timeBlock
    if (activeFilter === 'recurring') return recurring
    if (activeFilter === 'done') return done
    return active
  }, [activeFilter, timeBlock, todayTasks, ongoingProjects, priorityTasks, recurring, done, active])

  if (loading) {
    return (
      <div className="page" style={{ maxWidth: 880 }}>
        <div style={{ height: 160, marginBottom: 28 }} className="skeleton" />
        <div style={{ height: 52, marginBottom: 24 }} className="skeleton" />
        {[1, 2, 3, 4].map(i => <div key={i} style={{ height: 72, marginBottom: 12 }} className="skeleton" />)}
      </div>
    )
  }

  // Circular gauge calculations
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (pct / 100) * circumference

  return (
    <div className="page" style={{ maxWidth: 880 }}>
      {/* ══════════════════════════════════════════════════════
          1. HERO FOCUS HUB & PRODUCTIVITY CARD
      ══════════════════════════════════════════════════════ */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-bg-elevated) 0%, var(--color-bg-subtle) 100%)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          boxShadow: 'var(--shadow-md)',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle accent glow in the top-right corner */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 160,
            height: 160,
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          {/* Left Column: Greeting, Date & Motivation */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 10px',
                  borderRadius: 100,
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'var(--color-accent-muted)',
                  color: 'var(--color-accent-text)',
                }}
              >
                <TimeIcon size={13} />
                {timePeriod}
              </span>

              <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
                {format(today, 'EEEE, MMM d, yyyy')}
              </span>
            </div>

            <h1 style={{
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--color-text-primary)',
              margin: '0 0 6px',
              letterSpacing: '-0.03em',
            }}>
              {greeting}
            </h1>

            <p style={{
              fontSize: 14,
              color: 'var(--color-text-secondary)',
              margin: 0,
              lineHeight: 1.4,
            }}>
              {total === 0
                ? 'Your day is clear. Ready to create your first task?'
                : allDone
                ? '🎉 Amazing! You completed all tasks scheduled for today.'
                : `You have ${active.length} task${active.length === 1 ? '' : 's'} remaining. Let’s make it happen.`}
            </p>
          </div>

          {/* Right Column: Hero Circular Progress Gauge & Streak */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexShrink: 0 }}>
            {/* Streak Box */}
            {streak > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 16px',
                  background: 'rgba(245,158,11,0.08)',
                  border: '1.5px solid rgba(245,158,11,0.25)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#d97706', fontWeight: 800, fontSize: 18 }}>
                  <Flame size={20} style={{ color: '#f59e0b' }} />
                  {streak}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>
                  Streak
                </div>
              </div>
            )}

            {/* Circular SVG Gauge */}
            <div style={{ position: 'relative', width: 90, height: 90 }}>
              <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Ring */}
                <circle
                  cx="45"
                  cy="45"
                  r={radius}
                  stroke="var(--color-border)"
                  strokeWidth="7"
                  fill="transparent"
                />
                {/* Active Progress Ring */}
                <circle
                  cx="45"
                  cy="45"
                  r={radius}
                  stroke={allDone ? 'var(--color-success)' : 'var(--color-accent)'}
                  strokeWidth="7"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
                />
              </svg>

              {/* Gauge Center Text */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: allDone ? 'var(--color-success)' : 'var(--color-text-primary)',
                  lineHeight: 1,
                }}>
                  {pct}%
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                  {done.length}/{total}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            WEEKLY MOMENTUM STRIP (Mon - Sun)
        ══════════════════════════════════════════════════════ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 8,
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid var(--color-border)',
        }}>
          {weekDays.map(day => {
            const isDayToday = isToday(day)
            return (
              <div
                key={day.toISOString()}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '6px 4px',
                  borderRadius: 'var(--radius-sm)',
                  background: isDayToday ? 'var(--color-accent-muted)' : 'transparent',
                  border: `1px solid ${isDayToday ? 'var(--color-accent)' : 'transparent'}`,
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: isDayToday ? 'var(--color-accent-text)' : 'var(--color-text-tertiary)',
                  textTransform: 'uppercase',
                }}>
                  {format(day, 'EEE')}
                </span>
                <span style={{
                  fontSize: 14,
                  fontWeight: 700,
                  marginTop: 2,
                  color: isDayToday ? 'var(--color-accent-text)' : 'var(--color-text-primary)',
                }}>
                  {format(day, 'd')}
                </span>
                {isDayToday && (
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-accent)', marginTop: 3 }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          2. QUICK ADD COMMAND BAR
      ══════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 24 }}>
        <TaskQuickAdd defaultDate={todayStr} onAdd={() => { fetchTasks(); fetchStreak() }} />
      </div>

      {/* ══════════════════════════════════════════════════════
          3. INTERACTIVE FILTER PILLS BAR
      ══════════════════════════════════════════════════════ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          marginBottom: 24,
        }}
      >
        {[
          { id: 'all',       label: 'All Active',        count: active.length,                     icon: Sparkles },
          { id: 'today',     label: 'Today Only',        count: timeBlock.length + todayTasks.length, icon: Zap },
          { id: 'ongoing',   label: 'Project & Ongoing', count: ongoingProjects.length,            icon: FolderKanban },
          { id: 'priority',  label: 'Priority',          count: priorityTasks.length,              icon: Flame },
          { id: 'recurring', label: 'Habits',            count: recurring.length,                  icon: RefreshCw },
          { id: 'done',      label: 'Done',              count: done.length,                       icon: CheckCircle2 },
        ].map(tab => {
          const isSelected = activeFilter === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as TaskFilter)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 100,
                fontSize: 13,
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                border: `1.5px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                background: isSelected ? 'var(--color-accent-muted)' : 'var(--color-bg-elevated)',
                color: isSelected ? 'var(--color-accent-text)' : 'var(--color-text-secondary)',
                boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.12s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={13} style={{ color: isSelected ? 'var(--color-accent)' : 'var(--color-text-tertiary)' }} />
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 100,
                  background: isSelected ? 'rgba(99,102,241,0.2)' : 'var(--color-bg-muted)',
                  color: isSelected ? 'var(--color-accent-text)' : 'var(--color-text-tertiary)',
                }}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ══════════════════════════════════════════════════════
          4. TASK SECTIONS & LISTS
      ══════════════════════════════════════════════════════ */}
      {activeFilter !== 'all' ? (
        /* Filtered View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayTasks.map(t => (
            <TaskCard
              key={t.id}
              task={t}
              onComplete={id => {
                setTasks(p => p.map(x => x.id === id ? { ...x, status: x.status === 'done' ? 'not_started' : 'done' } : x))
                fetchStreak()
              }}
              onDelete={id => {
                setTasks(p => p.filter(x => x.id !== id))
                fetchStreak()
              }}
            />
          ))}
          {displayTasks.length === 0 && (
            <div className="empty" style={{ padding: '48px 24px' }}>
              <CheckCircle size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <span style={{ fontWeight: 700, fontSize: 15 }}>No tasks in this view</span>
              <span style={{ fontSize: 13 }}>Switch tabs or use the quick-add bar above</span>
            </div>
          )}
        </div>
      ) : (
        /* Standard Categorized View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Overdue Tasks */}
          {overdueTasks.length > 0 && (
            <section>
              <div className="section-label" style={{ color: '#ef4444' }}>
                <AlertCircle size={14} style={{ color: '#ef4444' }} />
                <span>Overdue Attention</span>
                <span className="count-badge" style={{ background: 'var(--color-danger-muted)', color: '#ef4444' }}>
                  {overdueTasks.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {overdueTasks.map(t => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onComplete={id => {
                      setTasks(p => p.map(x => x.id === id ? { ...x, status: 'done' } : x))
                      fetchStreak()
                    }}
                    onDelete={id => {
                      setTasks(p => p.filter(x => x.id !== id))
                      fetchStreak()
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Time Blocked Tasks */}
          {timeBlock.length > 0 && (
            <section>
              <div className="section-label">
                <Clock size={14} style={{ color: 'var(--color-accent)' }} />
                <span>Time Blocked</span>
                <span className="count-badge">{timeBlock.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {timeBlock
                  .sort((a, b) => (a.dueTime || '').localeCompare(b.dueTime || ''))
                  .map(t => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onComplete={id => {
                        setTasks(p => p.map(x => x.id === id ? { ...x, status: 'done' } : x))
                        fetchStreak()
                      }}
                      onDelete={id => {
                        setTasks(p => p.filter(x => x.id !== id))
                        fetchStreak()
                      }}
                    />
                  ))}
              </div>
            </section>
          )}

          {/* Today's Tasks */}
          <section>
            <div className="section-label">
              <Zap size={14} style={{ color: '#f59e0b' }} />
              <span>Today’s Focus</span>
              {todayTasks.length > 0 && <span className="count-badge">{todayTasks.length}</span>}
            </div>

            {todayTasks.length === 0 && timeBlock.length === 0 && ongoingProjects.length === 0 && recurring.length === 0 && overdueTasks.length === 0 ? (
              <div className="empty">
                <Sparkles size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                <span style={{ fontWeight: 700, fontSize: 16 }}>All tasks finished or no tasks scheduled</span>
                <span style={{ fontSize: 13 }}>Type in the quick-add bar above to plan your day</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {todayTasks
                  .sort((a, b) => ({ urgent: 0, high: 1, medium: 2, low: 3 }[a.priority as 'urgent'|'high'|'medium'|'low'] ?? 4) - ({ urgent: 0, high: 1, medium: 2, low: 3 }[b.priority as 'urgent'|'high'|'medium'|'low'] ?? 4))
                  .map(t => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onComplete={id => {
                        setTasks(p => p.map(x => x.id === id ? { ...x, status: 'done' } : x))
                        fetchStreak()
                      }}
                      onDelete={id => {
                        setTasks(p => p.filter(x => x.id !== id))
                        fetchStreak()
                      }}
                    />
                  ))}
              </div>
            )}
          </section>

          {/* Project & Ongoing Tasks (Active Till Due Date) */}
          {ongoingProjects.length > 0 && (
            <section>
              <div className="section-label">
                <FolderKanban size={14} style={{ color: '#3b82f6' }} />
                <span>Project & Ongoing Milestones (Active Till Due Date)</span>
                <span className="count-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                  {ongoingProjects.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ongoingProjects
                  .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
                  .map(t => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onComplete={id => {
                        setTasks(p => p.map(x => x.id === id ? { ...x, status: 'done' } : x))
                        fetchStreak()
                      }}
                      onDelete={id => {
                        setTasks(p => p.filter(x => x.id !== id))
                        fetchStreak()
                      }}
                    />
                  ))}
              </div>
            </section>
          )}

          {/* Recurring / Habit Tracker */}
          {recurring.length > 0 && (
            <section>
              <div className="section-label">
                <RefreshCw size={14} style={{ color: 'var(--color-accent)' }} />
                <span>Daily Habits</span>
                <span className="count-badge">{recurring.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recurring.map(t => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onComplete={id => {
                      setTasks(p => p.map(x => x.id === id ? { ...x, status: 'done' } : x))
                      fetchStreak()
                    }}
                    onDelete={id => {
                      setTasks(p => p.filter(x => x.id !== id))
                      fetchStreak()
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Completed Section (Collapsible Accordion) */}
          {done.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => setShowDone(s => !s)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 0',
                  color: 'var(--color-text-tertiary)',
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                <CheckCircle2 size={15} style={{ color: 'var(--color-success)' }} />
                <span>Completed</span>
                <span className="count-badge">{done.length}</span>
                <span style={{ marginLeft: 'auto' }}>
                  {showDone ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>

              {showDone && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  {done.map(t => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onComplete={id => {
                        setTasks(p => p.map(x => x.id === id ? { ...x, status: 'not_started' } : x))
                        fetchStreak()
                      }}
                      onDelete={id => {
                        setTasks(p => p.filter(x => x.id !== id))
                        fetchStreak()
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
