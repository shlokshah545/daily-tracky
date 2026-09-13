'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { format, subDays, parseISO, eachDayOfInterval } from 'date-fns'
import { CheckCircle2, Flame, FolderKanban, AlertCircle, RefreshCw } from 'lucide-react'
import { useUIStore } from '@/lib/store'

interface AnalyticsData {
  dailyLogs: { date: string; tasksCompleted: number; tasksTotal: number }[]
  heatmapLogs: { date: string; tasksCompleted: number }[]
  tasksByPriority: { priority: string; _count: { id: number } }[]
  tasksByStatus?: { status: string; _count: { id: number } }[]
  projects: { id: string; name: string; color: string; totalTasks: number; completedTasks: number }[]
  overdueCount: number
  todayCompleted: number
  todayTotal: number
  currentStreak: number
  longestStreak: number
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#3b82f6',
  low: '#6b7280',
}

function StatBox({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; accent: string
}) {
  return (
    <div className="stat-box">
      <div className="stat-label">
        <span>{label}</span>
        <div style={{
          width: 28, height: 28, borderRadius: 'var(--radius-sm)',
          background: accent + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)',
          flexShrink: 0,
        }}>
          <Icon size={15} style={{ color: accent }} />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

function Heatmap({ logs }: { logs: { date: string; tasksCompleted: number }[] }) {
  const today = new Date()
  const start = subDays(today, 364)
  const days  = eachDayOfInterval({ start, end: today })
  const map: Record<string, number> = {}
  for (const l of logs || []) map[l.date] = l.tasksCompleted
  const max = Math.max(1, ...Object.values(map))

  function level(v: number) {
    if (!v) return 0
    const r = v / max
    if (r < 0.25) return 1
    if (r < 0.5)  return 2
    if (r < 0.75) return 3
    return 4
  }

  const weeks: Date[][] = []
  let cur: Date[] = []
  for (const day of days) {
    cur.push(day)
    if (day.getDay() === 0 || day === days[days.length - 1]) {
      weeks.push(cur)
      cur = []
    }
  }

  return (
    <div style={{ overflowX: 'auto', padding: '6px 0', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ display: 'flex', gap: 3.5, minWidth: 'min-content' }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            {week.map(day => {
              const ds = format(day, 'yyyy-MM-dd')
              const count = map[ds] || 0
              return (
                <div
                  key={ds}
                  className={`hm-${level(count)}`}
                  style={{ width: 11, height: 11, borderRadius: 2.5, flexShrink: 0 }}
                  title={`${format(day, 'MMM d, yyyy')}: ${count} tasks completed`}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

const ttStyle = {
  background: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  padding: '6px 10px',
  boxShadow: 'var(--shadow-md)',
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(30)
  const { tasksVersion, projectsVersion } = useUIStore()

  const loadData = () => {
    setLoading(true)
    fetch(`/api/analytics?days=${range}`)
      .then(r => r.json())
      .then(d => {
        setData(d || {
          dailyLogs: [],
          heatmapLogs: [],
          tasksByPriority: [],
          projects: [],
          overdueCount: 0,
          todayCompleted: 0,
          todayTotal: 0,
          currentStreak: 0,
          longestStreak: 0,
        })
        setLoading(false)
      })
      .catch(() => {
        setData({
          dailyLogs: [],
          heatmapLogs: [],
          tasksByPriority: [],
          projects: [],
          overdueCount: 0,
          todayCompleted: 0,
          todayTotal: 0,
          currentStreak: 0,
          longestStreak: 0,
        })
        setLoading(false)
      })
  }

  useEffect(() => {
    loadData()
  }, [range, tasksVersion, projectsVersion])

  if (loading && !data) {
    return (
      <div className="page-wide">
        <div style={{ height: 48, marginBottom: 24 }} className="skeleton" />
        <div className="stat-grid">
          {[1, 2, 3, 4].map(i => <div key={i} style={{ height: 96 }} className="skeleton" />)}
        </div>
        <div style={{ height: 240, marginBottom: 20 }} className="skeleton" />
        <div className="dashboard-split-grid">
          {[1, 2].map(i => <div key={i} style={{ height: 220 }} className="skeleton" />)}
        </div>
      </div>
    )
  }

  const currentData = data || {
    dailyLogs: [],
    heatmapLogs: [],
    tasksByPriority: [],
    projects: [],
    overdueCount: 0,
    todayCompleted: 0,
    todayTotal: 0,
    currentStreak: 0,
    longestStreak: 0,
  }

  const chartData = Array.from({ length: range }, (_, i) => {
    const date = format(subDays(new Date(), range - 1 - i), 'yyyy-MM-dd')
    const log = currentData.dailyLogs?.find(l => l.date === date)
    return {
      date: format(parseISO(date), range <= 7 ? 'EEE' : 'MMM d'),
      completed: log?.tasksCompleted || 0,
    }
  })

  const pieData = (currentData.tasksByPriority || []).map(p => ({
    name: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
    value: p._count.id,
    color: PRIORITY_COLORS[p.priority] || '#9ca3af',
  }))

  return (
    <div className="page-wide">
      {/* Header */}
      <div className="responsive-header">
        <div>
          <h1 className="page-title">Stats & Analytics</h1>
          <p className="page-sub">Performance metrics and productivity insights</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div className="view-tab-group">
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setRange(d)}
                className="view-tab"
                style={{
                  background: range === d ? 'var(--color-accent-muted)' : 'transparent',
                  color: range === d ? 'var(--color-accent-text)' : 'var(--color-text-secondary)',
                  fontWeight: range === d ? 700 : 500,
                }}
              >
                {d}D
              </button>
            ))}
          </div>
          <button
            onClick={loadData}
            className="icon-btn"
            title="Refresh analytics"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <StatBox
          label="Today"
          value={`${currentData.todayCompleted}/${currentData.todayTotal}`}
          sub="tasks done"
          icon={CheckCircle2}
          accent="#10b981"
        />
        <StatBox
          label="Streak"
          value={`${currentData.currentStreak} 🔥`}
          sub={`Best: ${currentData.longestStreak}d`}
          icon={Flame}
          accent="#f59e0b"
        />
        <StatBox
          label="Projects"
          value={currentData.projects.length}
          sub="active boards"
          icon={FolderKanban}
          accent="#6366f1"
        />
        <StatBox
          label="Overdue"
          value={currentData.overdueCount}
          sub="needs attention"
          icon={AlertCircle}
          accent="#ef4444"
        />
      </div>

      {/* Line Chart */}
      <div className="card" style={{ padding: '20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Tasks Completed Over Time
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
              Daily productivity trend for the last {range} days
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={210}>
          <LineChart data={chartData} margin={{ top: 6, right: 10, bottom: 0, left: -24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              interval={Math.max(1, Math.floor(range / 7))}
            />
            <YAxis
              tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip contentStyle={ttStyle} cursor={{ stroke: 'var(--color-border-strong)' }} />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="var(--color-accent)"
              strokeWidth={2.5}
              dot={false}
              name="Completed"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 2-Column Responsive Split */}
      <div className="dashboard-split-grid">
        {/* Priority Pie Chart */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 2 }}>
            Tasks by Priority
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 14 }}>
            Urgency distribution
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={4} dataKey="value">
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={ttStyle} />
                <Legend formatter={v => <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-secondary)' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty" style={{ height: 180, border: 'none' }}>
              No tasks recorded yet
            </div>
          )}
        </div>

        {/* Project Progress */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 2 }}>
            Project Progress
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 14 }}>
            Completion status by active board
          </div>
          {currentData.projects.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 190, overflowY: 'auto' }}>
              {currentData.projects.map(p => {
                const pct = p.totalTasks > 0 ? Math.round((p.completedTasks / p.totalTasks) * 100) : 0
                return (
                  <div key={p.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{p.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{pct}%</span>
                    </div>
                    <div className="progress-track" style={{ height: 5, marginBottom: 3 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: p.color, borderRadius: 100 }} />
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)' }}>
                      {p.completedTasks} of {p.totalTasks} completed
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty" style={{ height: 180, border: 'none' }}>
              No active projects found
            </div>
          )}
        </div>
      </div>

      {/* Heatmap Activity */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Yearly Activity Density
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
              Consistency across 52 weeks
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginRight: 2 }}>Less</span>
            {[0, 1, 2, 3, 4].map(l => <div key={l} className={`hm-${l}`} style={{ width: 10, height: 10, borderRadius: 2 }} />)}
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginLeft: 2 }}>More</span>
          </div>
        </div>
        <Heatmap logs={currentData.heatmapLogs} />
      </div>
    </div>
  )
}
