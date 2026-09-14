'use client'

import type { Task } from '@/types'

const STORAGE_KEYS = {
  TASKS: 'dt_persistent_tasks',
  DELETED_IDS: 'dt_deleted_task_ids',
  UPDATED_MAP: 'dt_updated_tasks_map',
  RECURRING_COMPLETED: 'dt_recurring_completed_dates',
}

// Safely retrieve items from localStorage
function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function safeSet(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('localStorage save failed:', e)
  }
}

export function getDeletedTaskIds(): Set<string> {
  const arr = safeGet<string[]>(STORAGE_KEYS.DELETED_IDS, [])
  return new Set(arr)
}

export function markTaskAsDeleted(taskId: string) {
  const ids = getDeletedTaskIds()
  ids.add(taskId)
  safeSet(STORAGE_KEYS.DELETED_IDS, Array.from(ids))

  // Remove from updated map if present
  const updates = getUpdatedTasksMap()
  delete updates[taskId]
  safeSet(STORAGE_KEYS.UPDATED_MAP, updates)

  // Remove from persistent tasks cache
  const cached = safeGet<Task[]>(STORAGE_KEYS.TASKS, [])
  const filtered = cached.filter(t => t.id !== taskId)
  safeSet(STORAGE_KEYS.TASKS, filtered)

  // Clean recurring completion map
  const recMap = safeGet<Record<string, string[]>>(STORAGE_KEYS.RECURRING_COMPLETED, {})
  delete recMap[taskId]
  safeSet(STORAGE_KEYS.RECURRING_COMPLETED, recMap)
}

export function getUpdatedTasksMap(): Record<string, Partial<Task>> {
  return safeGet<Record<string, Partial<Task>>>(STORAGE_KEYS.UPDATED_MAP, {})
}

export function recordTaskUpdate(taskId: string, patch: Partial<Task>) {
  const updates = getUpdatedTasksMap()
  updates[taskId] = { ...(updates[taskId] || {}), ...patch }
  safeSet(STORAGE_KEYS.UPDATED_MAP, updates)

  // Also update persistent tasks cache
  const cached = safeGet<Task[]>(STORAGE_KEYS.TASKS, [])
  const idx = cached.findIndex(t => t.id === taskId)
  if (idx !== -1) {
    cached[idx] = { ...cached[idx], ...patch }
    safeSet(STORAGE_KEYS.TASKS, cached)
  }
}

/**
 * Records a newly created task.
 * If replaceTempId is provided, the temporary local task is cleanly replaced to prevent duplicate task listings.
 */
export function recordNewTask(task: Task, replaceTempId?: string) {
  const cached = safeGet<Task[]>(STORAGE_KEYS.TASKS, [])

  let filtered = cached.filter(t => t.id !== task.id)
  if (replaceTempId) {
    filtered = filtered.filter(t => t.id !== replaceTempId)
  }

  // If this is a real server task (not local_), remove any local placeholder with matching title & date
  if (!task.id.startsWith('local_')) {
    filtered = filtered.filter(t => !(t.id.startsWith('local_') && t.title === task.title && (t.dueDate || '') === (task.dueDate || '')))
  }

  safeSet(STORAGE_KEYS.TASKS, [task, ...filtered])
}

/**
 * Recurring task completion tracking per individual date.
 */
export function getRecurringCompletedDates(taskId: string): string[] {
  const recMap = safeGet<Record<string, string[]>>(STORAGE_KEYS.RECURRING_COMPLETED, {})
  return recMap[taskId] || []
}

export function setRecurringCompletedDate(taskId: string, dateStr: string, isCompleted: boolean) {
  const recMap = safeGet<Record<string, string[]>>(STORAGE_KEYS.RECURRING_COMPLETED, {})
  const current = new Set(recMap[taskId] || [])

  if (isCompleted) {
    current.add(dateStr)
  } else {
    current.delete(dateStr)
  }

  recMap[taskId] = Array.from(current)
  safeSet(STORAGE_KEYS.RECURRING_COMPLETED, recMap)
}

/**
 * Merges server tasks with local persistent state:
 * 1. Permanently filters out any user-deleted tasks.
 * 2. Applies local optimistic updates.
 * 3. Incorporates local-only tasks not yet saved to server, avoiding duplicates.
 * 4. Strictly respects project filtering so projects do not auto-detect unassigned tasks.
 */
export function mergeWithLocalTasks(
  serverTasks: Task[] = [],
  options?: { projectId?: string | null }
): Task[] {
  if (typeof window === 'undefined') return serverTasks

  const deletedIds = getDeletedTaskIds()
  const updates = getUpdatedTasksMap()
  const cached = safeGet<Task[]>(STORAGE_KEYS.TASKS, [])

  // 1. Process server tasks
  let validServerTasks = serverTasks
    .filter(t => !deletedIds.has(t.id))
    .map(t => {
      const localPatch = updates[t.id]
      return localPatch ? { ...t, ...localPatch } : t
    })

  // 2. Identify locally created tasks not yet returned by server
  const serverIdSet = new Set(validServerTasks.map(t => t.id))
  let localOnlyTasks = cached.filter(t => !serverIdSet.has(t.id) && !deletedIds.has(t.id))

  // Prune any temporary local task if an identical server task already exists
  localOnlyTasks = localOnlyTasks.filter(localT => {
    const hasMatchOnServer = validServerTasks.some(
      st => st.title.trim() === localT.title.trim() && (st.dueDate || '') === (localT.dueDate || '')
    )
    return !hasMatchOnServer
  })

  // 3. Apply Project filtering if specified
  if (options && 'projectId' in options) {
    const targetProj = options.projectId
    if (targetProj) {
      // Must strictly match this project
      validServerTasks = validServerTasks.filter(t => t.projectId === targetProj)
      localOnlyTasks = localOnlyTasks.filter(t => t.projectId === targetProj)
    } else {
      // General tasks without project
      validServerTasks = validServerTasks.filter(t => !t.projectId)
      localOnlyTasks = localOnlyTasks.filter(t => !t.projectId)
    }
  }

  // 4. Combined unique list
  const seenIds = new Set<string>()
  const combined: Task[] = []

  for (const t of [...localOnlyTasks, ...validServerTasks]) {
    if (!seenIds.has(t.id)) {
      seenIds.add(t.id)
      combined.push(t)
    }
  }

  // Save cleaned state
  if (!options) {
    safeSet(STORAGE_KEYS.TASKS, combined)
  }

  return combined
}
