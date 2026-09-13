export interface RecurrenceRule {
  type: 'none' | 'daily' | 'weekdays' | 'weekends' | 'custom' | 'weekly'
  days?: number[] // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
}

export const DAY_OPTIONS = [
  { label: 'M', fullLabel: 'Mon', dayIndex: 1 },
  { label: 'T', fullLabel: 'Tue', dayIndex: 2 },
  { label: 'W', fullLabel: 'Wed', dayIndex: 3 },
  { label: 'T', fullLabel: 'Thu', dayIndex: 4 },
  { label: 'F', fullLabel: 'Fri', dayIndex: 5 },
  { label: 'S', fullLabel: 'Sat', dayIndex: 6 },
  { label: 'S', fullLabel: 'Sun', dayIndex: 0 },
]

/**
 * Checks whether a given task is scheduled to appear on a target date (YYYY-MM-DD).
 */
export function isTaskScheduledForDate(
  task: {
    dueDate?: string | null
    isRecurring: boolean
    recurrenceRule?: string | null
    status?: string
    projectId?: string | null
  },
  targetDateStr: string,
  options?: { includeOngoingTillDue?: boolean }
): boolean {
  // If task has an exact dueDate matching the target date
  if (task.dueDate === targetDateStr) return true

  // If task is recurring
  if (task.isRecurring && task.recurrenceRule) {
    // If task has a future start date, do not show before its start dueDate
    if (task.dueDate && task.dueDate > targetDateStr) return false

    try {
      const rule: RecurrenceRule = typeof task.recurrenceRule === 'string'
        ? JSON.parse(task.recurrenceRule)
        : task.recurrenceRule

      if (!rule || rule.type === 'none') return false

      const targetDate = new Date(targetDateStr + 'T12:00:00')
      const dayOfWeek = targetDate.getDay() // 0=Sun, 1=Mon, ..., 6=Sat

      if (rule.type === 'daily') return true
      if (rule.type === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5
      if (rule.type === 'weekends') return dayOfWeek === 0 || dayOfWeek === 6
      if (rule.type === 'custom' || rule.type === 'weekly') {
        if (rule.days && Array.isArray(rule.days)) {
          return rule.days.includes(dayOfWeek)
        }
      }
    } catch (err) {
      console.error('Error checking task recurrence:', err)
    }
    return false
  }

  // If includeOngoingTillDue is requested (Daily / Today view):
  if (options?.includeOngoingTillDue) {
    const isDone = task.status === 'done'
    // Active tasks without due date (anytime backlog)
    if (!task.dueDate && !isDone) return true

    // Active tasks with future due date (project tasks, milestones, multi-day subtasks to complete till due date)
    if (task.dueDate && task.dueDate >= targetDateStr && !isDone) {
      return true
    }

    // Active overdue tasks (must remain visible until completed)
    if (task.dueDate && task.dueDate < targetDateStr && !isDone) {
      return true
    }
  }

  return false
}

/**
 * Returns a human-friendly string describing the recurrence rule.
 */
export function formatRecurrenceLabel(ruleJson?: string | null): string | null {
  if (!ruleJson) return null
  try {
    const rule: RecurrenceRule = typeof ruleJson === 'string' ? JSON.parse(ruleJson) : ruleJson
    if (!rule || rule.type === 'none') return null
    if (rule.type === 'daily') return 'Daily'
    if (rule.type === 'weekdays') return 'Weekdays (Mon–Fri)'
    if (rule.type === 'weekends') return 'Weekends (Sat–Sun)'
    if (rule.type === 'custom' || rule.type === 'weekly') {
      if (!rule.days || rule.days.length === 0) return 'Custom days'
      if (rule.days.length === 7) return 'Daily'
      const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const sortedDays = [...rule.days].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
      return sortedDays.map(d => names[d]).join(', ')
    }
  } catch {}
  return 'Recurring'
}
