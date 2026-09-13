export interface Subtask {
  id: string
  title: string
  isCompleted: boolean
  order: number
  taskId: string
  createdAt: Date
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Task {
  id: string
  title: string
  description?: string | null
  status: 'not_started' | 'in_progress' | 'done' | 'skipped' | 'overdue'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string | null
  dueTime?: string | null
  estimatedDuration?: number | null
  isTimeBlocked: boolean
  isRecurring: boolean
  recurrenceRule?: string | null
  projectId?: string | null
  notes?: string | null
  completedAt?: Date | null
  createdAt: Date
  updatedAt: Date
  project?: Project | null
  subtasks?: Subtask[]
  tags?: { tag: Tag }[]
}

export interface Project {
  id: string
  name: string
  description?: string | null
  color: string
  icon: string
  deadline?: string | null
  status: 'active' | 'on_hold' | 'completed' | 'archived'
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  tasks?: Task[]
}

export interface DailyLog {
  id: string
  date: string
  tasksCompleted: number
  tasksTotal: number
  isStreakDay: boolean
  createdAt: Date
  updatedAt: Date
}

export interface RecurrenceRule {
  type: 'daily' | 'weekly' | 'custom'
  days?: number[]   // 0=Sun, 1=Mon, ...
  interval?: number // every N days/weeks
}

export interface KanbanColumn {
  id: string
  title: string
  status: string
  color: string
}

export const DEFAULT_KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'not_started', title: 'To Do',       status: 'not_started', color: '#6B7280' },
  { id: 'in_progress', title: 'In Progress',  status: 'in_progress', color: '#3B82F6' },
  { id: 'done',        title: 'Done',         status: 'done',        color: '#10B981' },
]
