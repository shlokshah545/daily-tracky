'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info,
  Plus, CheckCircle2, Target, Sparkles, FolderKanban, Clock,
  ArrowRight, ShieldCheck, Bookmark
} from 'lucide-react'
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth,
  isToday, addWeeks, subWeeks, parseISO, isSameDay
} from 'date-fns'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskQuickAdd } from '@/components/tasks/TaskQuickAdd'
import { useUIStore } from '@/lib/store'
import type { Task, Project } from '@/types'
import { isTaskScheduledForDate } from '@/lib/recurrence'

type PlannerMode = 'daily_planner' | 'goals_tracker'
type CalendarView = 'week' | 'month'

export default function CalendarPage() {
  const [plannerMode, setPlannerMode] = useState<PlannerMode>('daily_planner')
  const [view, setView] = useState<CalendarView>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(true)
  const [allTasksList, setAllTasksList] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [showInfoModal, setShowInfoModal] = useState(false)
  const { openTaskModal, openProjectModal, tasksVersion, projectsVersion } = useUIStore()

  // Fetch tasks and projects
  const fetchData = useCallback(async () => {
    try {
      const [taskRes, projRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/projects'),
      ])
      const taskData = await taskRes.json()
      const projData = await projRes.json()
      setAllTasksList(taskData?.tasks || [])
      setProjects(projData?.projects || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData, tasksVersion, projectsVersion])

  const navigate = (dir: 1 | -1) => {
    if (view === 'month') {
      setCurrentDate(d => (dir === 1 ? addMonths(d, 1) : subMonths(d, 1)))
    } else {
      setCurrentDate(d => (dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1)))
    }
  }

  const goToday = () => {
    const now = new Date()
    setCurrentDate(now)
    setSelectedDate(format(now, 'yyyy-MM-dd'))
  }

  // Days list calculation
  const days = useMemo(() => {
    if (view === 'month') {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 })
      return eachDayOfInterval({ start, end })
    }
    // Week view: Sun - Sat
    const start = startOfWeek(currentDate, { weekStartsOn: 0 })
    const end = endOfWeek(currentDate, { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [view, currentDate])

  const weekDayHeaders = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    for (const day of days) {
      const dateStr = format(day, 'yyyy-MM-dd')
      grouped[dateStr] = allTasksList.filter(task => isTaskScheduledForDate(task, dateStr))
    }
    return grouped
  }, [days, allTasksList])

  const selectedDateTasks = useMemo(() => {
    return selectedDate ? allTasksList.filter(task => isTaskScheduledForDate(task, selectedDate)) : []
  }, [allTasksList, selectedDate])

  const selectedDoneCount = selectedDateTasks.filter(t => t.status === 'done').length

  function handleTaskComplete(id: string) {
    setAllTasksList(prev =>
      prev.map(t => (t.id === id ? { ...t, status: t.status === 'done' ? 'not_started' : 'done' } : t))
    )
  }

  return (
    <div
      className="page"
      style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '16px 16px 120px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ══════════════════════════════════════════════════════
          1. TOP MODE SWITCHER: DAILY PLANNER vs GOALS TRACKER
      ══════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div
          style={{
            display: 'inline-flex',
            padding: 4,
            background: 'var(--color-bg-subtle)',
            borderRadius: 100,
            border: '1px solid var(--color-border)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <button
            onClick={() => setPlannerMode('daily_planner')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              background: plannerMode === 'daily_planner' ? 'var(--color-bg-elevated)' : 'transparent',
              color: plannerMode === 'daily_planner' ? 'var(--color-accent-text)' : 'var(--color-text-tertiary)',
              boxShadow: plannerMode === 'daily_planner' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
              letterSpacing: '0.04em',
            }}
          >
            <CalendarIcon size={14} />
            <span>DAILY PLANNER</span>
          </button>

          <button
            onClick={() => setPlannerMode('goals_tracker')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              background: plannerMode === 'goals_tracker' ? 'var(--color-bg-elevated)' : 'transparent',
              color: plannerMode === 'goals_tracker' ? 'var(--color-accent-text)' : 'var(--color-text-tertiary)',
              boxShadow: plannerMode === 'goals_tracker' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
              letterSpacing: '0.04em',
            }}
          >
            <Target size={14} />
            <span>GOALS TRACKER</span>
          </button>
        </div>
      </div>

      {plannerMode === 'goals_tracker' ? (
        /* ══════════════════════════════════════════════════════
            GOALS TRACKER MODE
        ══════════════════════════════════════════════════════ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            className="card"
            style={{
              padding: '24px 20px',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              background: 'linear-gradient(135deg, var(--color-bg-elevated) 0%, var(--color-bg-subtle) 100%)',
            }}
          >
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                Long-Term Goals & Milestones
              </h2>
              <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', margin: 0 }}>
                Track target exam dates, deadlines, and project milestones in one place.
              </p>
            </div>
            <button
              onClick={() => openProjectModal()}
              className="btn btn-primary btn-sm"
              style={{ borderRadius: 100, padding: '8px 18px', fontWeight: 700 }}
            >
              <Plus size={14} /> New Goal
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {projects.map(proj => {
              const projTasks = allTasksList.filter(t => t.projectId === proj.id)
              const doneCount = projTasks.filter(t => t.status === 'done').length
              const pct = projTasks.length > 0 ? Math.round((doneCount / projTasks.length) * 100) : 0
              return (
                <div
                  key={proj.id}
                  className="card"
                  style={{
                    padding: 18,
                    borderRadius: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: proj.color || '#10b981',
                      }}
                    />
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)' }}>
                      {proj.name}
                    </span>
                  </div>

                  {proj.description && (
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
                      {proj.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--color-text-tertiary)' }}>
                      <span>Progress</span>
                      <span>{pct}% ({doneCount}/{projTasks.length})</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 100, background: 'var(--color-border)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          borderRadius: 100,
                          background: proj.color || '#10b981',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════
            DAILY PLANNER MODE (Matching Screenshot 1 & 2)
        ══════════════════════════════════════════════════════ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* ─── Date Controls & View Switcher Strip ─── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              padding: '4px 2px',
            }}
          >
            {/* Center Today & Chevron Arrows */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={goToday}
                className="btn btn-sm"
                style={{
                  borderRadius: 100,
                  padding: '6px 16px',
                  fontSize: 12,
                  fontWeight: 700,
                  background: 'var(--color-bg-elevated)',
                  border: '1.5px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                Today
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <button
                  onClick={() => navigate(-1)}
                  className="icon-btn"
                  style={{ width: 32, height: 32, borderRadius: 100 }}
                  title="Previous"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => navigate(1)}
                  className="icon-btn"
                  style={{ width: 32, height: 32, borderRadius: 100 }}
                  title="Next"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <button
                onClick={() => setShowInfoModal(s => !s)}
                className="icon-btn"
                style={{ width: 32, height: 32, borderRadius: 100 }}
                title="Planner Tips"
              >
                <Info size={16} />
              </button>
            </div>

            {/* Month Title & Week / Month Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  fontFamily: "'Outfit', 'Inter', sans-serif",
                  fontSize: 18,
                  fontWeight: 800,
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {format(currentDate, 'MMMM yyyy')}
              </span>

              {/* [ Week | Month ] Segmented Toggle */}
              <div
                style={{
                  display: 'inline-flex',
                  padding: 3,
                  background: 'var(--color-bg-subtle)',
                  borderRadius: 100,
                  border: '1px solid var(--color-border)',
                }}
              >
                {(['week', 'month'] as CalendarView[]).map(v => {
                  const isActive = view === v
                  return (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      style={{
                        padding: '4px 14px',
                        borderRadius: 100,
                        fontSize: 12,
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: isActive ? 'var(--color-bg-elevated)' : 'transparent',
                        color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                        boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s ease',
                        textTransform: 'capitalize',
                      }}
                    >
                      {v}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              CALENDAR GRID (WEEK OR MONTH)
          ══════════════════════════════════════════════════════ */}
          <div
            className="card"
            style={{
              padding: 0,
              borderRadius: 20,
              overflow: 'hidden',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-elevated)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}
          >
            {/* Day of Week Headers (SUN, MON, TUE, WED, THU, FRI, SAT) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-bg-subtle)',
              }}
            >
              {weekDayHeaders.map((dh, idx) => (
                <div
                  key={dh}
                  style={{
                    textAlign: 'center',
                    padding: '8px 2px',
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    color: 'var(--color-text-tertiary)',
                  }}
                >
                  {dh}
                </div>
              ))}
            </div>

            {/* ─── WEEK VIEW GRID (Screenshot 2) ─── */}
            {view === 'week' && (
              <div>
                {/* Date numbers header row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  {days.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const isSelected = selectedDate === dateStr
                    const isDayToday = isToday(day)

                    return (
                      <div
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '8px 2px',
                          cursor: 'pointer',
                          background: 'transparent',
                          borderRight: '1px solid var(--color-border)',
                        }}
                      >
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: isSelected || isDayToday ? 800 : 600,
                            fontSize: 13.5,
                            background: isSelected
                              ? 'var(--color-accent)'
                              : isDayToday
                              ? 'var(--color-accent-muted)'
                              : 'transparent',
                            color: isSelected
                              ? '#ffffff'
                              : isDayToday
                              ? 'var(--color-accent-text)'
                              : 'var(--color-text-primary)',
                            boxShadow: isSelected ? '0 3px 10px rgba(99, 102, 241, 0.4)' : 'none',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {format(day, 'd')}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* 7 Columns: Planner Column Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    minHeight: 120,
                  }}
                >
                  {days.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const dayTasks = tasksByDate[dateStr] || []

                    return (
                      <div
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        style={{
                          padding: '8px 4px',
                          borderRight: '1px solid var(--color-border)',
                          cursor: 'pointer',
                          background: 'transparent',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 5,
                          minHeight: 100,
                        }}
                      >
                        {dayTasks.slice(0, 3).map(task => (
                          <div
                            key={task.id}
                            style={{
                              fontSize: 9.5,
                              fontWeight: 700,
                              padding: '3px 6px',
                              borderRadius: 100,
                              background: task.status === 'done' ? 'var(--color-success-muted)' : 'var(--color-accent-muted)',
                              color: task.status === 'done' ? 'var(--color-success)' : 'var(--color-accent-text)',
                              border: `1px solid ${task.status === 'done' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(99, 102, 241, 0.2)'}`,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              textDecoration: task.status === 'done' ? 'line-through' : 'none',
                            }}
                          >
                            {task.title}
                          </div>
                        ))}

                        {dayTasks.length === 0 && (
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              setSelectedDate(dateStr)
                              openTaskModal()
                            }}
                            style={{
                              border: '1px dashed var(--color-border)',
                              borderRadius: 100,
                              padding: '6px 4px',
                              background: 'transparent',
                              color: 'var(--color-text-tertiary)',
                              fontSize: 9,
                              fontWeight: 700,
                              cursor: 'pointer',
                              textAlign: 'center',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              marginTop: 'auto',
                            }}
                          >
                            Plan Day
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ─── MONTH VIEW GRID (Screenshot 1) ─── */}
            {view === 'month' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                }}
              >
                {days.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const dayTasks = tasksByDate[dateStr] || []
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  const isDayToday = isToday(day)
                  const isSelected = selectedDate === dateStr
                  const hasTasks = dayTasks.length > 0

                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      style={{
                        minHeight: 70,
                        padding: '6px 4px',
                        borderRight: '1px solid var(--color-border)',
                        borderBottom: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        background: 'transparent',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: isSelected || isDayToday ? 800 : 500,
                          background: isSelected
                            ? 'var(--color-accent)'
                            : isDayToday
                            ? 'var(--color-accent-muted)'
                            : 'transparent',
                          color: isSelected
                            ? '#ffffff'
                            : isDayToday
                            ? 'var(--color-accent-text)'
                            : isCurrentMonth
                            ? 'var(--color-text-primary)'
                            : 'var(--color-text-disabled)',
                          boxShadow: isSelected ? '0 3px 10px rgba(99, 102, 241, 0.4)' : 'none',
                        }}
                      >
                        {format(day, 'd')}
                      </div>

                      {hasTasks && (
                        <div style={{ display: 'flex', gap: 2 }}>
                          {dayTasks.slice(0, 3).map((t, idx) => (
                            <span
                              key={idx}
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                background: t.status === 'done' ? 'var(--color-success)' : 'var(--color-accent)',
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════
              2. ACTIVE DAY AGENDA CARD (Screenshot 2 Bottom Section)
          ══════════════════════════════════════════════════════ */}
          <div
            className="card"
            style={{
              padding: '20px 20px',
              borderRadius: 22,
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            }}
          >
            {/* Header: Date Badge + Title + Action Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Rounded Square Date Badge */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: 'var(--color-accent-muted)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--color-accent-text)', textTransform: 'uppercase' }}>
                    {format(parseISO(selectedDate), 'MMM')}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 18,
                      fontWeight: 900,
                      color: 'var(--color-accent-text)',
                      lineHeight: 1,
                    }}
                  >
                    {format(parseISO(selectedDate), 'd')}
                  </span>
                </div>

                {/* Day Name & Count */}
                <div>
                  <h3
                    style={{
                      fontFamily: "'Outfit', 'Inter', sans-serif",
                      fontSize: 19,
                      fontWeight: 800,
                      margin: 0,
                      color: 'var(--color-text-primary)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {format(parseISO(selectedDate), 'EEEE')}
                  </h3>
                  <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                    {selectedDoneCount}/{selectedDateTasks.length} tasks completed
                  </span>
                </div>
              </div>

              {/* Action Buttons: Library + Add Task */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => openTaskModal()}
                  className="btn btn-primary btn-sm"
                  style={{
                    borderRadius: 100,
                    padding: '8px 18px',
                    fontWeight: 700,
                    fontSize: 12,
                    boxShadow: '0 2px 10px rgba(99, 102, 241, 0.35)',
                  }}
                >
                  <Plus size={14} /> Add Task
                </button>
              </div>
            </div>

            {/* Quick Add Input Bar */}
            <div style={{ marginBottom: 14 }}>
              <TaskQuickAdd
                defaultDate={selectedDate}
                onAdd={fetchData}
                placeholder={`Plan a task for ${format(parseISO(selectedDate), 'MMM d')}...`}
              />
            </div>

            {/* Tasks List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedDateTasks.length === 0 ? (
                <div className="empty" style={{ padding: '32px 16px', borderRadius: 14 }}>
                  <CalendarIcon size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>No tasks planned for this day</span>
                  <span style={{ fontSize: 12 }}>Type above to schedule a task or habit</span>
                </div>
              ) : (
                selectedDateTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleTaskComplete}
                    onDelete={id => setAllTasksList(p => p.filter(t => t.id !== id))}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
