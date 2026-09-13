'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { format, subDays, parseISO, eachDayOfInterval } from 'date-fns'
import { CheckCircle2, Flame, FolderKanban, AlertCircle } from 'lucide-react'
import { useUIStore } from '@/lib/store'

interface AnalyticsData {
  dailyLogs: { date: string; tasksCompleted: number; tasksTotal: number }[]
  heatmapLogs: { date: string; tasksCompleted: number }[]
  tasksByPriority: { priority: string; _count: { id: number } }[]
  projects: { id: string; name: string; color: string; totalTasks: number; completedTasks: number }[]
  overdueCount: number
  todayCompleted: number
  todayTotal: number
  currentStreak: number
  longestStreak: number
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#6b7280',
}

function StatBox({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; accent: string
}) {
  return (
    <div className="stat-box">
      <div className="stat-label">
        {label}
        <div style={{
          width: 32, height: 32, borderRadius: 'var(--radius-sm)',
          background: accent + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <Icon size={16} style={{ color: accent }} />
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
  for (const l of logs) map[l.date] = l.tasksCompleted
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
    if (day.getDay() === 0 || day === days[days.length - 1]) { weeks.push(cur); cur = [] }
  }

  return (
    <div style={{ overflowX: 'auto', padding: '4px 0' }}>
      <div style={{ display: 'flex', gap: 4, minWidth: 'min-content' }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {week.map(day => {
              const ds = format(day, 'yyyy-MM-dd')
              return (
                <div
                  key={ds}
                  className={`hm-${level(map[ds] || 0)}`}
                  style={{ width: 12, height: 12, borderRadius: 3 }}
                  title={`${format(day, 'MMM d, yyyy')}: ${map[ds] || 0} tasks completed`}
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
  fontSize: 13,
  fontWeight: 600,
  padding: '8px 12px',
  boxShadow: 'var(--shadow-md)',
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(30)
  const { tasksVersion, projectsVersion } = useUIStore()

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics?days=${range}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [range, tasksVersion, projectsVersion])

  if (loading || !data) {
    return (
      <div className="page-wide">
        <div style={{ height: 60, marginBottom: 28 }} className="skeleton" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
          {[1, 2, 3, 4].map(i => <div key={i} style={{ height: 110 }} className="skeleton" />)}
        </div>
        <div style={{ height: 260, marginBottom: 16 }} className="skeleton" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[1, 2].map(i => <div key={i} style={{ height: 240 }} className="skeleton" />)}
        </div>
      </div>
    )
  }

  const chartData = Array.from({ length: range }, (_, i) => {
    const date = format(subDays(new Date(), range - 1 - i), 'yyyy-MM-dd')
    const log = data.dailyLogs.find(l => l.date === date)
    return {
      date: format(parseISO(date), range <= 7 ? 'EEE' : 'MMM d'),
      completed: log?.tasksCompleted || 0,
    }
  })

  const pieData = data.tasksByPriority.map(p => ({
    name: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
    value: p._count.id,
    color: PRIORITY_COLORS[p.priority] || '#9ca3af',
  }))

  return (
    <div className="page-wide">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Performance metrics and productivity insights</p>
        </div>
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
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 20 }}>
        <StatBox label="Today" value={`${data.todayCompleted}/${data.todayTotal}`} sub="tasks finished" icon={CheckCircle2} accent="#10b981" />
        <StatBox label="Current Streak" value={`${data.currentStreak} 🔥`} sub={`All-time best: ${data.longestStreak}d`} icon={Flame} accent="#f59e0b" />
        <StatBox label="Projects" value={data.projects.length} sub="active workspaces" icon={FolderKanban} accent="#6366f1" />
        <StatBox label="Overdue" value={data.overdueCount} sub="pending attention" icon={AlertCircle} accent="#ef4444" />
      </div>

      {/* Line Chart */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Tasks Completed Over Time</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 2 }}>Daily output for the last {range} days</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={210}>
          <LineChart data={chartData} margin={{ top: 6, right: 10, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--color-text-tertiary)', fontSize: 12, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              interval={Math.floor(range / 7)}
            />
            <YAxis tick={{ fill: 'var(--color-text-tertiary)', fontSize: 12, fontWeight: 500 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={ttStyle} cursor={{ stroke: 'var(--color-border-strong)' }} />
            <Line type="monotone" dataKey="completed" stroke="var(--color-accent)" strokeWidth={2.5} dot={false} name="Completed" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Priority Pie Chart */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>Tasks by Priority</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginBottom: 16 }}>Distribution across urgency levels</div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={4} dataKey="value">
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={ttStyle} />
                <Legend formatter={v => <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty" style={{ height: 190, border: 'none' }}>No tasks found</div>
          )}
        </div>

        {/* Project Progress */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>Project Progress</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginBottom: 16 }}>Completion status by project</div>
          {data.projects.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {data.projects.map(p => {
                const pct = p.totalTasks > 0 ? Math.round((p.completedTasks / p.totalTasks) * 100) : 0
                return (
                  <div key={p.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{p.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{pct}%</span>
                    </div>
                    <div className="progress-track" style={{ height: 5, marginBottom: 4 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: p.color, borderRadius: 100 }} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                      {p.completedTasks} of {p.totalTasks} tasks completed
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty" style={{ height: 190, border: 'none' }}>No active projects</div>
          )}
        </div>
      </div>

      {/* Heatmap Activity */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Yearly Activity Contribution</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 2 }}>Task completion density across 52 weeks</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginRight: 2 }}>Less</span>
            {[0, 1, 2, 3, 4].map(l => <div key={l} className={`hm-${l}`} style={{ width: 11, height: 11, borderRadius: 2 }} />)}
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginLeft: 2 }}>More</span>
          </div>
        </div>
        <Heatmap logs={data.heatmapLogs} />
      </div>
    </div>
  )
}
