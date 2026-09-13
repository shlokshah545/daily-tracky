'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Check
} from 'lucide-react'
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth,
  isToday, addWeeks, subWeeks, parseISO
} from 'date-fns'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskQuickAdd } from '@/components/tasks/TaskQuickAdd'
import { useUIStore } from '@/lib/store'
import type { Task } from '@/types'
import { isTaskScheduledForDate } from '@/lib/recurrence'

type CalendarView = 'month' | 'week' | 'day'

function CalendarTaskChip({ task, onClick }: { task: Task; onClick: () => void }) {
  const isDone = task.status === 'done'
  const isOverdue = task.status === 'overdue'

  const bg = isDone
    ? 'var(--color-success-muted)'
    : isOverdue
    ? 'var(--color-danger-muted)'
    : (task.project?.color ? task.project.color + '18' : 'var(--color-accent-muted)')

  const color = isDone
    ? 'var(--color-success)'
    : isOverdue
    ? 'var(--color-danger)'
    : (task.project?.color || 'var(--color-accent-text)')

  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      className="cal-chip"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        width: '100%',
        minWidth: 0,
        textAlign: 'left',
        background: bg,
        color: color,
        border: `1px solid ${isDone ? 'rgba(16,185,129,0.25)' : isOverdue ? 'rgba(239,68,68,0.25)' : (task.project?.color ? task.project.color + '35' : 'rgba(99,102,241,0.25)')}`,
        cursor: 'pointer',
        fontSize: 12,
        lineHeight: 1.3,
        padding: '3px 6px',
        borderRadius: 5,
        fontWeight: 500,
        textDecoration: isDone ? 'line-through' : 'none',
        opacity: isDone ? 0.6 : 1,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {task.dueTime && (
        <span style={{ fontSize: 11, opacity: 0.8, flexShrink: 0, fontWeight: 600 }}>
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
  const [view, setView] = useState<CalendarView>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const { openTaskModal, tasksVersion, projectsVersion } = useUIStore()

  // Compute visible date range
  const visibleRange = useCallback(() => {
    if (view === 'month') {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
      return { start, end }
    } else if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      const end = endOfWeek(currentDate, { weekStartsOn: 1 })
      return { start, end }
    } else {
      return { start: currentDate, end: currentDate }
    }
  }, [view, currentDate])

  const [allTasksList, setAllTasksList] = useState<Task[]>([])

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks')
      const data = await res.json()
      setAllTasksList(data.tasks || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks, tasksVersion, projectsVersion, refreshKey])

  function navigate(dir: 1 | -1) {
    if (view === 'month') setCurrentDate(dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1))
    else if (view === 'week') setCurrentDate(dir === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1))
    else setCurrentDate(new Date(currentDate.getTime() + dir * 86400000))
  }

  function goToday() { setCurrentDate(new Date()) }

  const { start, end } = visibleRange()
  const days = eachDayOfInterval({ start, end })
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Group tasks dynamically across all visible days (handling recurrence rules seamlessly)
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    for (const day of days) {
      const dateStr = format(day, 'yyyy-MM-dd')
      grouped[dateStr] = allTasksList.filter(task => isTaskScheduledForDate(task, dateStr))
    }
    return grouped
  }, [days, allTasksList])

  const headerLabel =
    view === 'month' ? format(currentDate, 'MMMM yyyy') :
    view === 'week'  ? `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}` :
    format(currentDate, 'EEEE, MMMM d, yyyy')

  function handleTaskComplete(id: string) {
    setAllTasksList(prev => prev.map(t => t.id === id ? { ...t, status: 'done' as const } : t))
  }

  const selectedDateTasks = selectedDate ? tasksByDate[selectedDate] || [] : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Top Header Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 28px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-elevated)',
        flexShrink: 0,
        gap: 16,
        flexWrap: 'wrap',
      }}>
        {/* Date Title & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            {headerLabel}
          </h1>
          <button className="btn btn-secondary btn-sm" onClick={goToday}>
            Today
          </button>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="icon-btn" onClick={() => navigate(-1)} title="Previous">
              <ChevronLeft size={18} />
            </button>
            <button className="icon-btn" onClick={() => navigate(1)} title="Next">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="view-tab-group">
          {(['month', 'week', 'day'] as CalendarView[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="view-tab"
              style={{
                background: view === v ? 'var(--color-accent-muted)' : 'transparent',
                color: view === v ? 'var(--color-accent-text)' : 'var(--color-text-secondary)',
                fontWeight: view === v ? 700 : 500,
                textTransform: 'capitalize',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '16px 16px 96px 16px' }}>
          {view === 'month' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, width: '100%' }}>
              {/* Day Headers (7 Equal Columns) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                width: '100%',
                marginBottom: 8,
              }}>
                {weekDays.map(d => (
                  <div
                    key={d}
                    style={{
                      textAlign: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--color-text-tertiary)',
                      padding: '8px 0',
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Month Grid (7 Equal Columns) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                borderTop: '1px solid var(--color-border)',
                borderLeft: '1px solid var(--color-border)',
                flex: 1,
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'var(--color-bg-elevated)',
                width: '100%',
                boxShadow: 'var(--shadow-sm)',
              }}>
                {days.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const dayTasks = tasksByDate[dateStr] || []
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  const isDayToday = isToday(day)
                  const isSelected = selectedDate === dateStr
                  const hasOverdue = dayTasks.some(t => t.status === 'overdue')
                  const allDone = dayTasks.length > 0 && dayTasks.every(t => t.status === 'done')

                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      className={`cal-grid-cell${isSelected ? ' selected' : ''}${!isCurrentMonth ? ' other-month' : ''}`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 115,
                        minWidth: 0,
                        overflow: 'hidden',
                        background: isSelected
                          ? 'var(--color-accent-muted)'
                          : isDayToday
                          ? 'rgba(99,102,241,0.05)'
                          : undefined,
                      }}
                    >
                      {/* Day Number Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div
                          className={`cal-day-num${isDayToday ? ' today' : ''}`}
                          style={{
                            color: isDayToday
                              ? 'white'
                              : isCurrentMonth
                              ? 'var(--color-text-primary)'
                              : 'var(--color-text-disabled)',
                          }}
                        >
                          {format(day, 'd')}
                        </div>

                        {/* Status Dots */}
                        <div style={{ display: 'flex', gap: 4 }}>
                          {hasOverdue && (
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-danger)' }} />
                          )}
                          {allDone && (
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-success)' }} />
                          )}
                        </div>
                      </div>

                      {/* Task Chips Container */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        {dayTasks.slice(0, 3).map(task => (
                          <CalendarTaskChip
                            key={task.id}
                            task={task}
                            onClick={() => openTaskModal(task.id)}
                          />
                        ))}
                        {dayTasks.length > 3 && (
                          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', padding: '2px 6px', fontWeight: 600 }}>
                            +{dayTasks.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {view === 'week' && (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 12 }}>
                {days.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const dayTasks = tasksByDate[dateStr] || []
                  const isDayToday = isToday(day)

                  return (
                    <div
                      key={dateStr}
                      style={{
                        background: 'var(--color-bg-elevated)',
                        border: `1px solid ${isDayToday ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-md)',
                        padding: 14,
                        minHeight: 380,
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: isDayToday ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                        minWidth: 0,
                      }}
                    >
                      <div style={{ textAlign: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                          {format(day, 'EEE')}
                        </div>
                        <div
                          className={`cal-day-num${isDayToday ? ' today' : ''}`}
                          style={{ margin: '6px auto 0', width: 30, height: 30, fontSize: 14 }}
                        >
                          {format(day, 'd')}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 }}>
                        {dayTasks.map(task => (
                          <TaskCard key={task.id} task={task} compact onComplete={handleTaskComplete} />
                        ))}
                        {dayTasks.length === 0 && (
                          <div style={{ color: 'var(--color-text-disabled)', fontSize: 12, textAlign: 'center', margin: 'auto 0' }}>
                            No tasks
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {view === 'day' && (
            <div className="page">
              <div style={{ marginBottom: 24 }}>
                <TaskQuickAdd
                  defaultDate={format(currentDate, 'yyyy-MM-dd')}
                  onAdd={() => setRefreshKey(k => k + 1)}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(tasksByDate[format(currentDate, 'yyyy-MM-dd')] || []).map(task => (
                  <TaskCard key={task.id} task={task} onComplete={handleTaskComplete} />
                ))}
                {(tasksByDate[format(currentDate, 'yyyy-MM-dd')] || []).length === 0 && (
                  <div className="empty">
                    <CalendarIcon size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <p style={{ fontWeight: 700, fontSize: 16 }}>No tasks scheduled for this day</p>
                    <p style={{ fontSize: 13 }}>Use the quick-add bar above to create one</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Selected Date Side Drawer */}
        {selectedDate && view === 'month' && (
          <div
            style={{
              width: 360,
              minWidth: 360,
              borderLeft: '1px solid var(--color-border)',
              background: 'var(--color-bg-elevated)',
              display: 'flex',
              flexDirection: 'column',
              padding: 20,
              overflowY: 'auto',
              flexShrink: 0,
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  {format(parseISO(selectedDate), 'EEEE')}
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                  {format(parseISO(selectedDate), 'MMMM d, yyyy')}
                </div>
              </div>
              <button className="icon-btn" onClick={() => setSelectedDate(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ marginBottom: 18 }}>
              <TaskQuickAdd
                defaultDate={selectedDate}
                onAdd={() => setRefreshKey(k => k + 1)}
                placeholder="Add task for this day..."
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {selectedDateTasks.length === 0 ? (
                <div className="empty" style={{ padding: '40px 16px' }}>
                  <span>No tasks for this date</span>
                </div>
              ) : (
                selectedDateTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleTaskComplete}
                    compact
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
