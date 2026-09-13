import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d, yyyy')
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return format(parseISO(dateStr), 'MMM d')
}

export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
}

export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type Status = 'not_started' | 'in_progress' | 'done' | 'skipped' | 'overdue'
export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived'

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; border: string }> = {
  low:    { label: 'Low',    color: 'text-slate-400',   bg: 'bg-slate-400/10',   border: 'border-slate-400/30' },
  medium: { label: 'Medium', color: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-400/30' },
  high:   { label: 'High',   color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/30' },
  urgent: { label: 'Urgent', color: 'text-rose-400',    bg: 'bg-rose-400/10',    border: 'border-rose-400/30' },
}

export const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string }> = {
  not_started: { label: 'Not Started', color: 'text-slate-400',  bg: 'bg-slate-400/10' },
  in_progress: { label: 'In Progress', color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  done:        { label: 'Done',        color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  skipped:     { label: 'Skipped',     color: 'text-slate-500',   bg: 'bg-slate-500/10' },
  overdue:     { label: 'Overdue',     color: 'text-rose-400',    bg: 'bg-rose-400/10' },
}

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  active:    { label: 'Active',     color: 'text-emerald-400' },
  on_hold:   { label: 'On Hold',    color: 'text-amber-400' },
  completed: { label: 'Completed',  color: 'text-blue-400' },
  archived:  { label: 'Archived',   color: 'text-slate-500' },
}

export function getPriorityOrder(priority: string): number {
  const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
  return order[priority] ?? 4
}

export function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex
  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
}

export function generateStreakData(logs: { date: string; isStreakDay: boolean }[]): number {
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date))
  let streak = 0
  const today = getTodayString()
  for (const log of sorted) {
    if (log.date > today) continue
    if (log.isStreakDay) streak++
    else break
  }
  return streak
}
