'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Plus
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
        gap: 4,
        width: '100%',
        minWidth: 0,
        textAlign: 'left',
        background: bg,
        color: color,
        border: `1px solid ${isDone ? 'rgba(16,185,129,0.25)' : isOverdue ? 'rgba(239,68,68,0.25)' : (task.project?.color ? task.project.color + '35' : 'rgba(99,102,241,0.25)')}`,
        cursor: 'pointer',
        fontSize: 11,
        lineHeight: 1.3,
        padding: '2px 5px',
        borderRadius: 4,
        fontWeight: 500,
        textDecoration: isDone ? 'line-through' : 'none',
        opacity: isDone ? 0.6 : 1,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {task.dueTime && (
        <span style={{ fontSize: 10, opacity: 0.8, flexShrink: 0, fontWeight: 700 }}>
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
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const { openTaskModal, tasksVersion, projectsVersion } = useUIStore()

  const [allTasksList, setAllTasksList] = useState<Task[]>([])

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks')
      const data = await res.json()
      setAllTasksList(data?.tasks || [])
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
    if (view === 'month') setCurrentDate(d => dir === 1 ? addMonths(d, 1) : subMonths(d, 1))
    else if (view === 'week') setCurrentDate(d => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1))
    else setCurrentDate(d => {
      const nd = new Date(d)
      nd.setDate(nd.getDate() + dir)
      return nd
    })
  }

  const goToday = () => {
    const now = new Date()
    setCurrentDate(now)
    setSelectedDate(format(now, 'yyyy-MM-dd'))
  }

  const days = useMemo(() => {
    if (view === 'month') {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
      const end   = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
      return eachDayOfInterval({ start, end })
    }
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      const end   = endOfWeek(currentDate, { weekStartsOn: 1 })
      return eachDayOfInterval({ start, end })
    }
    return [currentDate]
  }, [view, currentDate])

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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
    setAllTasksList(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'done' ? 'not_started' : 'done' } : t))
  }

  const selectedDateTasks = selectedDate ? (allTasksList.filter(task => isTaskScheduledForDate(task, selectedDate))) : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: 'var(--color-bg)' }}>
      {/* Top Header Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-elevated)',
        flexShrink: 0,
        gap: 12,
        flexWrap: 'wrap',
      }}>
        {/* Date Title & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            {headerLabel}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={goToday}>
              Today
            </button>
            <div style={{ display: 'flex', gap: 2 }}>
              <button className="icon-btn" onClick={() => navigate(-1)} title="Previous">
                <ChevronLeft size={16} />
              </button>
              <button className="icon-btn" onClick={() => navigate(1)} title="Next">
                <ChevronRight size={16} />
              </button>
            </div>
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

      {/* Calendar Content Area */}
      <div style={{ flex: 1, padding: '16px 16px 100px 16px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {view === 'month' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 7-Column Month Table */}
            <div style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}>
              {/* Day Headers (Mon - Sun) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                background: 'var(--color-bg-subtle)',
                borderBottom: '1px solid var(--color-border)',
              }}>
                {weekDays.map(d => (
                  <div
                    key={d}
                    style={{
                      textAlign: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--color-text-tertiary)',
                      padding: '8px 2px',
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Month Grid Cells */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
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
                      onClick={() => setSelectedDate(dateStr)}
                      className={`cal-grid-cell${isSelected ? ' selected' : ''}${!isCurrentMonth ? ' other-month' : ''}`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 80,
                        padding: '6px 4px',
                        cursor: 'pointer',
                        background: isSelected
                          ? 'var(--color-accent-muted)'
                          : isDayToday
                          ? 'rgba(99,102,241,0.06)'
                          : undefined,
                        borderRight: '1px solid var(--color-border)',
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      {/* Day Number Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div
                          className={`cal-day-num${isDayToday ? ' today' : ''}`}
                          style={{
                            width: 22,
                            height: 22,
                            fontSize: 11.5,
                            color: isDayToday
                              ? 'white'
                              : isCurrentMonth
                              ? 'var(--color-text-primary)'
                              : 'var(--color-text-disabled)',
                          }}
                        >
                          {format(day, 'd')}
                        </div>

                        {/* Status Dots on Narrow / Mobile View */}
                        <div style={{ display: 'flex', gap: 2.5 }}>
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

                      {/* Desktop Chips (hidden on mobile, visible on desktop) */}
                      <div className="cal-chips-desktop" style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        {dayTasks.slice(0, 2).map(task => (
                          <CalendarTaskChip
                            key={task.id}
                            task={task}
                            onClick={() => openTaskModal(task.id)}
                          />
                        ))}
                        {dayTasks.length > 2 && (
                          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 600, paddingLeft: 2 }}>
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
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)' }}>
                    Schedule for {format(parseISO(selectedDate), 'EEEE, MMMM d')}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                    {selectedDateTasks.length} task{selectedDateTasks.length === 1 ? '' : 's'} scheduled
                  </div>
                </div>
                <button
                  onClick={() => openTaskModal()}
                  className="btn btn-primary btn-sm"
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedDateTasks.length === 0 ? (
                  <div className="empty" style={{ padding: '24px 16px' }}>
                    <span style={{ fontSize: 13 }}>No tasks scheduled for this day</span>
                  </div>
                ) : (
                  selectedDateTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={handleTaskComplete}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'week' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
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
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: isDayToday ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: isDayToday ? 'var(--color-accent-text)' : 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                        {format(day, 'EEEE')}
                      </span>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {format(day, 'MMM d')}
                      </div>
                    </div>
                    {isDayToday && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--color-accent-muted)', color: 'var(--color-accent-text)', padding: '2px 8px', borderRadius: 100 }}>
                        Today
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    {dayTasks.map(task => (
                      <TaskCard key={task.id} task={task} compact onComplete={handleTaskComplete} />
                    ))}
                    {dayTasks.length === 0 && (
                      <div style={{ color: 'var(--color-text-disabled)', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {view === 'day' && (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ marginBottom: 20 }}>
              <TaskQuickAdd
                defaultDate={format(currentDate, 'yyyy-MM-dd')}
                onAdd={() => setRefreshKey(k => k + 1)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(tasksByDate[format(currentDate, 'yyyy-MM-dd')] || []).map(task => (
                <TaskCard key={task.id} task={task} onComplete={handleTaskComplete} />
              ))}
              {(tasksByDate[format(currentDate, 'yyyy-MM-dd')] || []).length === 0 && (
                <div className="empty">
                  <CalendarIcon size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p style={{ fontWeight: 700, fontSize: 15 }}>No tasks scheduled for this day</p>
                  <p style={{ fontSize: 13 }}>Use the quick-add bar above to create one</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .cal-chips-desktop { display: none !important; }
        }
      `}</style>
    </div>
  )
}
