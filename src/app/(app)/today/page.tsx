'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  format, startOfWeek, addDays, isSameDay, isToday
} from 'date-fns'
import {
  Clock, Zap, RefreshCw, CheckCircle2, Flame, Calendar, Sparkles,
  Sun, Moon, Sunrise, Sunset, Trash2, Edit3, Plus, Filter,
  ArrowUpRight, Target, CheckCircle, ChevronDown, ChevronUp, AlertCircle,
  FolderKanban, Award, Settings
} from 'lucide-react'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskQuickAdd } from '@/components/tasks/TaskQuickAdd'
import { useUIStore } from '@/lib/store'
import type { Task, Project } from '@/types'

type StandingPeriod = 'today' | 'week' | 'month'
type StandingMetric = 'tasks' | 'time'

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [totalStudyMinutes, setTotalStudyMinutes] = useState(0)
  const [standingPeriod, setStandingPeriod] = useState<StandingPeriod>('week')
  const [standingMetric, setStandingMetric] = useState<StandingMetric>('tasks')
  const [showDone, setShowDone] = useState(true)
  const { openTaskModal, openProjectModal, tasksVersion, projectsVersion } = useUIStore()

  const today = useMemo(() => new Date(), [])
  const todayStr = useMemo(() => format(today, 'yyyy-MM-dd'), [today])

  // Weekdays strip for momentum bar
  const weekDays = useMemo(() => {
    const start = startOfWeek(today, { weekStartsOn: 0 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [today])

  const fetchData = useCallback(async () => {
    try {
      const [taskRes, projRes, analyticsRes] = await Promise.all([
        fetch(`/api/tasks?date=${todayStr}`),
        fetch('/api/projects'),
        fetch('/api/analytics?days=7'),
      ])
      const taskData = await taskRes.json()
      const projData = await projRes.json()
      const analyticsData = await analyticsRes.json()

      setTasks(taskData.tasks || [])
      setProjects(projData.projects || [])
      setStreak(analyticsData.currentStreak || 0)
      setTotalStudyMinutes(analyticsData.totalStudyMinutes || 0)
    } finally {
      setLoading(false)
    }
  }, [todayStr])

  useEffect(() => {
    fetchData()
  }, [fetchData, tasksVersion, projectsVersion])

  const done = tasks.filter(t => t.status === 'done')
  const active = tasks.filter(t => t.status !== 'done')

  const isDueToday = (t: Task) => t.dueDate === todayStr || (!t.dueDate && !t.isRecurring)
  const isFutureDue = (t: Task) => !!(t.dueDate && t.dueDate > todayStr && !t.isRecurring)
  const isPastDue = (t: Task) => !!(t.dueDate && t.dueDate < todayStr && !t.isRecurring)

  const timeBlock = tasks.filter(t => t.dueTime && isDueToday(t) && t.status !== 'done')
  const todayTasks = tasks.filter(t => !t.dueTime && isDueToday(t) && !t.isRecurring && t.status !== 'done')
  const ongoingProjects = tasks.filter(t => isFutureDue(t) && t.status !== 'done')
  const overdueTasks = tasks.filter(t => isPastDue(t) && t.status !== 'done')
  const recurring = tasks.filter(t => t.isRecurring && t.status !== 'done')

  const total = tasks.length
  const pct = total > 0 ? Math.round((done.length / total) * 100) : 0

  // Time-based greeting and icon
  const hour = today.getHours()
  const { greeting, TimeIcon, timePeriod } = useMemo(() => {
    if (hour >= 5 && hour < 12) {
      return { greeting: 'Good Morning, Explorer', TimeIcon: Sunrise, timePeriod: 'Morning Focus' }
    } else if (hour >= 12 && hour < 17) {
      return { greeting: 'Good Afternoon, Achiever', TimeIcon: Sun, timePeriod: 'Afternoon Flow' }
    } else if (hour >= 17 && hour < 21) {
      return { greeting: 'Good Evening, Champion', TimeIcon: Sunset, timePeriod: 'Evening Wrap-Up' }
    } else {
      return { greeting: 'Good Night, Rest Well', TimeIcon: Moon, timePeriod: 'Night Reflection' }
    }
  }, [hour])

  // Active target / milestone project
  const targetProject = projects.find(p => p.deadline || p.targetExamDate) || projects[0]
  const targetDeadline = targetProject?.deadline || targetProject?.targetExamDate

  if (loading) {
    return (
      <div className="page" style={{ maxWidth: 760, margin: '0 auto', padding: '16px 16px 100px' }}>
        <div style={{ height: 110, marginBottom: 18, borderRadius: 20 }} className="skeleton" />
        <div style={{ height: 160, marginBottom: 18, borderRadius: 20 }} className="skeleton" />
        <div style={{ height: 120, marginBottom: 18, borderRadius: 20 }} className="skeleton" />
      </div>
    )
  }

  return (
    <div
      className="page"
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '16px 16px 120px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* ══════════════════════════════════════════════════════
          1. GREETING CARD WITH CAROUSEL DOTS (Screenshot 3)
      ══════════════════════════════════════════════════════ */}
      <div
        className="card"
        style={{
          padding: '20px 22px',
          borderRadius: 22,
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--color-text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 4,
            }}
          >
            {format(today, 'EEEE, MMM d')}
          </div>
          <h1
            style={{
              fontFamily: "'Outfit', 'Inter', sans-serif",
              fontSize: 24,
              fontWeight: 800,
              margin: 0,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.03em',
            }}
          >
            {greeting}
          </h1>
        </div>

        {/* Momentum Indicator Dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {weekDays.map((d, i) => {
            const isDayToday = isToday(d)
            return (
              <div
                key={i}
                title={format(d, 'EEE')}
                style={{
                  width: isDayToday ? 18 : 8,
                  height: 8,
                  borderRadius: 100,
                  background: isDayToday
                    ? 'var(--color-accent)'
                    : 'var(--color-border-strong)',
                  transition: 'all 0.2s ease',
                }}
              />
            )
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          2. NEW TARGET / EXAM DATE CARD (Screenshot 3)
      ══════════════════════════════════════════════════════ */}
      <div
        className="card"
        style={{
          padding: '24px 22px',
          borderRadius: 24,
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        }}
      >
        {/* Soft Organic Curved Background Shape */}
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0.02) 60%, transparent 75%)',
            pointerEvents: 'none',
          }}
        />

        {/* Card Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'var(--color-accent-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-accent)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <Clock size={20} />
            </div>

            <div>
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 15,
                  fontWeight: 800,
                  color: 'var(--color-text-primary)',
                  letterSpacing: '0.04em',
                }}
              >
                {targetProject?.name ? targetProject.name.toUpperCase() : 'TARGET GOAL'}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--color-text-tertiary)',
                  letterSpacing: '0.06em',
                }}
              >
                {targetDeadline
                  ? `DUE: ${format(new Date(targetDeadline), 'MMM d, yyyy')}`
                  : 'NO TARGET SET'}
              </div>
            </div>
          </div>

          <button
            onClick={() => openProjectModal(targetProject?.id)}
            className="icon-btn"
            style={{ width: 34, height: 34, borderRadius: 10 }}
            title="Configure Target"
          >
            <Settings size={16} />
          </button>
        </div>

        {/* Center Target Action Area */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 0 10px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-tertiary)',
              marginBottom: 12,
            }}
          >
            <Calendar size={22} />
          </div>

          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: 'var(--color-text-secondary)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 14,
            }}
          >
            {targetDeadline
              ? `COUNTDOWN TO ${targetProject?.name || 'TARGET'}`
              : 'CONFIGURE YOUR TARGET EXAM OR MILESTONE'}
          </span>

          <button
            onClick={() => openProjectModal(targetProject?.id)}
            style={{
              padding: '9px 24px',
              borderRadius: 100,
              border: 'none',
              background: 'transparent',
              color: 'var(--color-accent-text)',
              fontSize: 13,
              fontWeight: 800,
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '0.06em',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-muted)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            {targetDeadline ? 'UPDATE TARGET' : 'SET TARGET'}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          3. WEEKLY STANDING & METRIC SELECTOR (Screenshot 3)
      ══════════════════════════════════════════════════════ */}
      <div>
        <h2
          style={{
            fontFamily: "'Outfit', 'Inter', sans-serif",
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-text-primary)',
            marginBottom: 12,
          }}
        >
          Weekly Standing
        </h2>

        {/* Segmented Period Tabs: [ TODAY | WEEK | MONTH ] */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          <div
            style={{
              display: 'inline-flex',
              padding: 4,
              background: 'var(--color-bg-subtle)',
              borderRadius: 100,
              border: '1px solid var(--color-border)',
              alignSelf: 'flex-start',
            }}
          >
            {(['today', 'week', 'month'] as StandingPeriod[]).map(p => {
              const isActive = standingPeriod === p
              return (
                <button
                  key={p}
                  onClick={() => setStandingPeriod(p)}
                  style={{
                    padding: '6px 18px',
                    borderRadius: 100,
                    fontSize: 12,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive ? 'var(--color-bg-elevated)' : 'transparent',
                    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                    boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {p}
                </button>
              )
            })}
          </div>

          {/* Metric Selector: [ TASKS | TIME STUDIED ] */}
          <div
            style={{
              display: 'inline-flex',
              padding: 4,
              background: 'var(--color-bg-subtle)',
              borderRadius: 100,
              border: '1px solid var(--color-border)',
              alignSelf: 'flex-start',
            }}
          >
            {(['tasks', 'time'] as StandingMetric[]).map(m => {
              const isActive = standingMetric === m
              const label = m === 'tasks' ? 'TASKS DONE' : 'TIME FOCUSED'
              return (
                <button
                  key={m}
                  onClick={() => setStandingMetric(m)}
                  style={{
                    padding: '6px 18px',
                    borderRadius: 100,
                    fontSize: 12,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive ? 'var(--color-bg-elevated)' : 'transparent',
                    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                    boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                    letterSpacing: '0.04em',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Standing Metric Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {standingMetric === 'tasks' ? (
            <>
              <div className="card" style={{ padding: '16px 18px', borderRadius: 18 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                  Completed Today
                </span>
                <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: 'var(--color-accent-text)', marginTop: 4 }}>
                  {done.length} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-tertiary)' }}>/ {total}</span>
                </div>
              </div>

              <div className="card" style={{ padding: '16px 18px', borderRadius: 18 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                  Active Streak
                </span>
                <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: '#d97706', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Flame size={24} style={{ color: '#f59e0b' }} />
                  {streak} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-tertiary)' }}>days</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="card" style={{ padding: '16px 18px', borderRadius: 18 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                  Focus Duration
                </span>
                <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: 'var(--color-accent-text)', marginTop: 4 }}>
                  {totalStudyMinutes} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-tertiary)' }}>mins</span>
                </div>
              </div>

              <div className="card" style={{ padding: '16px 18px', borderRadius: 18 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                  Completion Rate
                </span>
                <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: 'var(--color-success-text)', marginTop: 4 }}>
                  {pct}%
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          4. TODAY'S TASKS & QUICK ADD
      ══════════════════════════════════════════════════════ */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2
            style={{
              fontFamily: "'Outfit', 'Inter', sans-serif",
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: '-0.01em',
              margin: 0,
              color: 'var(--color-text-primary)',
            }}
          >
            Today's Schedule
          </h2>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)' }}>
            {active.length} remaining
          </span>
        </div>

        {/* Quick Add Command Bar */}
        <div style={{ marginBottom: 16 }}>
          <TaskQuickAdd defaultDate={todayStr} onAdd={fetchData} />
        </div>

        {/* Task Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tasks.length === 0 ? (
            <div className="empty" style={{ padding: '36px 20px', borderRadius: 18 }}>
              <Sparkles size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <span style={{ fontWeight: 700, fontSize: 15 }}>No tasks for today yet</span>
              <span style={{ fontSize: 13 }}>Use the quick-add bar above to start planning</span>
            </div>
          ) : (
            active.map(t => (
              <TaskCard
                key={t.id}
                task={t}
                onComplete={id => {
                  setTasks(p => p.map(x => (x.id === id ? { ...x, status: 'done' } : x)))
                }}
                onDelete={id => {
                  setTasks(p => p.filter(x => x.id !== id))
                }}
              />
            ))
          )}

          {/* Completed Accordion */}
          {done.length > 0 && (
            <div style={{ marginTop: 14 }}>
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
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                <CheckCircle2 size={14} style={{ color: 'var(--color-success)' }} />
                <span>Completed ({done.length})</span>
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
                        setTasks(p => p.map(x => (x.id === id ? { ...x, status: 'not_started' } : x)))
                      }}
                      onDelete={id => {
                        setTasks(p => p.filter(x => x.id !== id))
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
