'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, CheckCircle2
} from 'lucide-react'
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth,
  isToday, addWeeks, subWeeks, addDays, subDays, parseISO
} from 'date-fns'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskQuickAdd } from '@/components/tasks/TaskQuickAdd'
import { useUIStore } from '@/lib/store'
import { mergeWithLocalTasks } from '@/lib/clientData'
import type { Task } from '@/types'
import { isTaskScheduledForDate, isTaskCompletedOnDate } from '@/lib/recurrence'

type CalendarView = 'today' | 'week' | 'month'

function CalendarTaskChip({ task, dateStr, onClick }: { task: Task; dateStr?: string; onClick: () => void }) {
  const isDone = dateStr ? isTaskCompletedOnDate(task, dateStr) : task.status === 'done'
  const isOverdue = task.status === 'overdue'

  const bg = isDone
    ? 'var(--color-success-muted)'
    : isOverdue
    ? 'var(--color-danger-muted)'
    : (task.project?.color ? task.project.color + '18' : 'var(--color-accent-muted)')

  const color = isDone
    ? 'var(--color-success-text)'
    : isOverdue
    ? 'var(--color-danger-text)'
    : (task.project?.color || 'var(--color-accent-text)')

  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      className="cal-chip"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        width: '100%',
        minWidth: 0,
        textAlign: 'left',
        background: bg,
        color: color,
        border: `1px solid ${isDone ? 'rgba(16,185,129,0.25)' : isOverdue ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.2)'}`,
        cursor: 'pointer',
        fontSize: 11,
        lineHeight: 1.3,
        padding: '3px 6px',
        borderRadius: 6,
        fontWeight: 600,
        textDecoration: isDone ? 'line-through' : 'none',
        opacity: isDone ? 0.65 : 1,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {task.dueTime && (
        <span style={{ fontSize: 10, opacity: 0.85, flexShrink: 0, fontWeight: 700 }}>
          {task.dueTime.slice(0, 5)}
        </span>
      )}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
        {task.title}
      </span>
    </button>
  )
}

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const { openTaskModal, tasksVersion, projectsVersion } = useUIStore()

  const [allTasksList, setAllTasksList] = useState<Task[]>([])

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks').catch(() => null)
      const data = res ? await res.json().catch(() => ({})) : {}
      const rawTasks = data?.tasks || []
      const merged = mergeWithLocalTasks(rawTasks)
      setAllTasksList(merged)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks, refreshKey, tasksVersion, projectsVersion])

  const navigate = (dir: 1 | -1) => {
    if (view === 'month') {
      setCurrentDate(d => (dir === 1 ? addMonths(d, 1) : subMonths(d, 1)))
    } else if (view === 'week') {
      setCurrentDate(d => (dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1)))
    } else {
      setCurrentDate(d => (dir === 1 ? addDays(d, 1) : subDays(d, 1)))
      setSelectedDate(format(dir === 1 ? addDays(currentDate, 1) : subDays(currentDate, 1), 'yyyy-MM-dd'))
    }
  }

  const goToday = () => {
    const now = new Date()
    setCurrentDate(now)
    setSelectedDate(format(now, 'yyyy-MM-dd'))
  }

  // Days range calculation
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

  function handleTaskComplete(id: string) {
    setAllTasksList(prev =>
      prev.map(t => (t.id === id ? { ...t, status: t.status === 'done' ? 'not_started' : 'done' } : t))
    )
  }

  function handleTaskDelete(id: string) {
    setAllTasksList(prev => prev.filter(t => t.id !== id))
  }

  // Format title header based on active view
  const headerTitle = useMemo(() => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy')
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 })
      const end = endOfWeek(currentDate, { weekStartsOn: 0 })
      return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
    }
    return format(currentDate, 'EEEE, MMMM d, yyyy')
  }, [view, currentDate])

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
          TOP CONTROLS & NAVIGATION BAR
      ══════════════════════════════════════════════════════ */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          borderRadius: 20,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {/* Left: View Mode Pills [ Today | Weekly | Monthly ] */}
        <div
          style={{
            display: 'inline-flex',
            padding: 4,
            background: 'var(--color-bg-subtle)',
            borderRadius: 100,
            border: '1px solid var(--color-border)',
          }}
        >
          {(['today', 'week', 'month'] as CalendarView[]).map(v => {
            const isActive = view === v
            const label = v === 'today' ? 'Today' : v === 'week' ? 'Weekly' : 'Monthly'
            return (
              <button
                key={v}
                onClick={() => {
                  setView(v)
                  if (v === 'today') {
                    goToday()
                  }
                }}
                style={{
                  padding: '6px 18px',
                  borderRadius: 100,
                  fontSize: 12,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? 'var(--color-bg-elevated)' : 'transparent',
                  color: isActive ? 'var(--color-accent-text)' : 'var(--color-text-tertiary)',
                  boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Center: Title + Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => navigate(-1)}
            className="icon-btn"
            style={{ width: 34, height: 34, borderRadius: '50%' }}
            aria-label="Previous"
          >
            <ChevronLeft size={18} />
          </button>

          <span
            style={{
              fontFamily: "'Outfit', 'Inter', sans-serif",
              fontSize: 16,
              fontWeight: 800,
              minWidth: 160,
              textAlign: 'center',
              color: 'var(--color-text-primary)',
            }}
          >
            {headerTitle}
          </span>

          <button
            onClick={() => navigate(1)}
            className="icon-btn"
            style={{ width: 34, height: 34, borderRadius: '50%' }}
            aria-label="Next"
          >
            <ChevronRight size={18} />
          </button>

          <button
            onClick={goToday}
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: 4, borderRadius: 100, fontSize: 12, fontWeight: 700 }}
          >
            Current
          </button>
        </div>

        {/* Right: Quick Add Button */}
        <div>
          <button
            onClick={() => openTaskModal()}
            className="btn btn-primary btn-sm"
            style={{ borderRadius: 100, padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={15} /> New Task
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          VIEW 1: TODAY / SINGLE DAY VIEW
      ══════════════════════════════════════════════════════ */}
      {view === 'today' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ marginBottom: 4 }}>
            <TaskQuickAdd
              defaultDate={format(currentDate, 'yyyy-MM-dd')}
              onAdd={() => setRefreshKey(k => k + 1)}
              placeholder={`Add task for today (${format(currentDate, 'MMM d')})...`}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(tasksByDate[format(currentDate, 'yyyy-MM-dd')] || []).length === 0 ? (
              <div className="empty" style={{ padding: '48px 20px', borderRadius: 20 }}>
                <CalendarIcon size={36} style={{ opacity: 0.35, marginBottom: 10 }} />
                <span style={{ fontWeight: 800, fontSize: 16 }}>No tasks scheduled for today</span>
                <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                  Use the quick-add input above to organize your day
                </span>
              </div>
            ) : (
              (tasksByDate[format(currentDate, 'yyyy-MM-dd')] || []).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  currentDate={format(currentDate, 'yyyy-MM-dd')}
                  onComplete={handleTaskComplete}
                  onDelete={handleTaskDelete}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          VIEW 2: WEEKLY VIEW (Top to Bottom Scrolling for Mobile)
      ══════════════════════════════════════════════════════ */}
      {view === 'week' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayTasks = tasksByDate[dateStr] || []
            const isDayToday = isToday(day)
            const doneCount = dayTasks.filter(t => isTaskCompletedOnDate(t, dateStr)).length

            return (
              <div
                key={dateStr}
                className="card"
                style={{
                  borderRadius: 20,
                  padding: '16px 18px',
                  background: 'var(--color-bg-card)',
                  border: isDayToday ? '1.5px solid var(--color-accent)' : '1px solid var(--color-border)',
                  boxShadow: isDayToday ? '0 4px 20px rgba(16, 185, 129, 0.15)' : 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {/* Day Header Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: 10,
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        background: isDayToday ? 'var(--color-accent)' : 'var(--color-bg-elevated)',
                        color: isDayToday ? '#ffffff' : 'var(--color-text-primary)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: 15,
                        fontFamily: "'Outfit', sans-serif",
                        border: isDayToday ? 'none' : '1px solid var(--color-border)',
                      }}
                    >
                      <span>{format(day, 'd')}</span>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: isDayToday ? 'var(--color-accent-text)' : 'var(--color-text-primary)',
                          fontFamily: "'Outfit', sans-serif",
                        }}
                      >
                        {format(day, 'EEEE')}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                        {format(day, 'MMMM yyyy')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isDayToday && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          background: 'var(--color-accent-muted)',
                          color: 'var(--color-accent-text)',
                          padding: '3px 10px',
                          borderRadius: 100,
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Today
                      </span>
                    )}

                    {dayTasks.length > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)' }}>
                        {doneCount}/{dayTasks.length} done
                      </span>
                    )}
                  </div>
                </div>

                {/* Day Tasks List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dayTasks.length === 0 ? (
                    <div
                      style={{
                        padding: '12px 0',
                        fontSize: 12,
                        color: 'var(--color-text-disabled)',
                        textAlign: 'center',
                        fontWeight: 500,
                      }}
                    >
                      No tasks scheduled
                    </div>
                  ) : (
                    dayTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        currentDate={dateStr}
                        compact
                        onComplete={handleTaskComplete}
                        onDelete={handleTaskDelete}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          VIEW 3: MONTHLY VIEW (Grid + Selected Date Details)
      ══════════════════════════════════════════════════════ */}
      {view === 'month' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            className="card"
            style={{
              padding: 16,
              borderRadius: 22,
              overflow: 'hidden',
            }}
          >
            {/* Weekday Headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 4,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              {weekDayHeaders.map(d => (
                <span
                  key={d}
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: 'var(--color-text-tertiary)',
                    letterSpacing: '0.06em',
                  }}
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Calendar Days 7-Col Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 6,
              }}
            >
              {days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const isCurrentMonth = isSameMonth(day, currentDate)
                const isDayToday = isToday(day)
                const isSelected = selectedDate === dateStr
                const dayTasks = tasksByDate[dateStr] || []
                const hasOverdue = dayTasks.some(t => t.status === 'overdue')
                const allDone = dayTasks.length > 0 && dayTasks.every(t => isTaskCompletedOnDate(t, dateStr))

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    style={{
                      minHeight: 70,
                      padding: '8px 6px',
                      borderRadius: 14,
                      background: isSelected
                        ? 'var(--color-bg-elevated)'
                        : isDayToday
                        ? 'rgba(16, 185, 129, 0.08)'
                        : 'var(--color-bg-subtle)',
                      border: isSelected
                        ? '1.5px solid var(--color-accent)'
                        : isDayToday
                        ? '1px solid var(--color-accent-muted)'
                        : '1px solid var(--color-border)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      transition: 'all 0.15s ease',
                      opacity: isCurrentMonth ? 1 : 0.4,
                    }}
                  >
                    {/* Day Number and Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 800,
                          background: isDayToday ? 'var(--color-accent)' : 'transparent',
                          color: isDayToday
                            ? '#ffffff'
                            : isCurrentMonth
                            ? 'var(--color-text-primary)'
                            : 'var(--color-text-disabled)',
                        }}
                      >
                        {format(day, 'd')}
                      </div>

                      {/* Status Dots */}
                      <div style={{ display: 'flex', gap: 3 }}>
                        {hasOverdue && (
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-danger)' }} />
                        )}
                        {allDone && (
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-success)' }} />
                        )}
                        {dayTasks.length > 0 && !allDone && !hasOverdue && (
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-accent)' }} />
                        )}
                      </div>
                    </div>

                    {/* Desktop Chips (hidden on mobile) */}
                    <div className="cal-chips-desktop" style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      {dayTasks.slice(0, 2).map(task => (
                        <CalendarTaskChip
                          key={task.id}
                          task={task}
                          dateStr={dateStr}
                          onClick={() => openTaskModal(task.id)}
                        />
                      ))}
                      {dayTasks.length > 2 && (
                        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 700, paddingLeft: 2 }}>
                          +{dayTasks.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Selected Date Agenda Details */}
          <div
            className="card"
            style={{
              padding: '20px 22px',
              borderRadius: 22,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)', fontFamily: "'Outfit', sans-serif" }}>
                  Schedule for {format(parseISO(selectedDate), 'EEEE, MMMM d')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2, fontWeight: 600 }}>
                  {selectedDateTasks.length} task{selectedDateTasks.length === 1 ? '' : 's'} scheduled
                </div>
              </div>

              <button
                onClick={() => openTaskModal()}
                className="btn btn-primary btn-sm"
                style={{ borderRadius: 100 }}
              >
                <Plus size={14} /> Add Task
              </button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <TaskQuickAdd
                defaultDate={selectedDate}
                onAdd={() => setRefreshKey(k => k + 1)}
                placeholder={`Add task for ${format(parseISO(selectedDate), 'MMM d')}...`}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedDateTasks.length === 0 ? (
                <div className="empty" style={{ padding: '28px 16px', borderRadius: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>No tasks scheduled for this day</span>
                </div>
              ) : (
                selectedDateTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    currentDate={selectedDate}
                    onComplete={handleTaskComplete}
                    onDelete={handleTaskDelete}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .cal-chips-desktop { display: none !important; }
        }
      `}</style>
    </div>
  )
}
