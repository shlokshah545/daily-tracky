'use client'

import type { Task } from '@/types'

const STORAGE_KEYS = {
  TASKS: 'dt_persistent_tasks',
  DELETED_IDS: 'dt_deleted_task_ids',
  UPDATED_MAP: 'dt_updated_tasks_map',
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

  // Also remove from updated map if present
  const updates = getUpdatedTasksMap()
  delete updates[taskId]
  safeSet(STORAGE_KEYS.UPDATED_MAP, updates)

  // Remove from persistent tasks cache
  const cached = safeGet<Task[]>(STORAGE_KEYS.TASKS, [])
  const filtered = cached.filter(t => t.id !== taskId)
  safeSet(STORAGE_KEYS.TASKS, filtered)
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

export function recordNewTask(task: Task) {
  const cached = safeGet<Task[]>(STORAGE_KEYS.TASKS, [])
  // Ensure not already there
  const without = cached.filter(t => t.id !== task.id)
  safeSet(STORAGE_KEYS.TASKS, [task, ...without])
}

/**
 * Merges server tasks with local persistent state:
 * 1. Filters out any tasks that the user deleted locally (prevents serverless respawns).
 * 2. Applies local optimistic updates (completions, field changes).
 * 3. Incorporates locally created tasks not yet present in server response.
 */
export function mergeWithLocalTasks(serverTasks: Task[] = []): Task[] {
  if (typeof window === 'undefined') return serverTasks

  const deletedIds = getDeletedTaskIds()
  const updates = getUpdatedTasksMap()
  const cached = safeGet<Task[]>(STORAGE_KEYS.TASKS, [])

  // 1. Process server tasks
  const validServerTasks = serverTasks
    .filter(t => !deletedIds.has(t.id))
    .map(t => {
      const localPatch = updates[t.id]
      return localPatch ? { ...t, ...localPatch } : t
    })

  // 2. Identify locally created tasks not yet returned by server
  const serverIdSet = new Set(validServerTasks.map(t => t.id))
  const localOnlyTasks = cached.filter(t => !serverIdSet.has(t.id) && !deletedIds.has(t.id))

  // 3. Combined list
  const combined = [...localOnlyTasks, ...validServerTasks]

  // Persist combined snapshot
  safeSet(STORAGE_KEYS.TASKS, combined)
  return combined
}
