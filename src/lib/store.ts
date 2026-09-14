import { create } from 'zustand'

type Theme = 'dark' | 'light'

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return (localStorage.getItem('dt-theme') as Theme) || 'dark'
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
    document.documentElement.classList.remove('light')
  } else {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
  }
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('dt-theme', theme)
}


interface UIState {
  sidebarCollapsed: boolean
  commandPaletteOpen: boolean
  selectedDate: string
  theme: Theme
  taskModalOpen: boolean
  taskModalId: string | null
  taskModalProjectId: string | null
  projectModalOpen: boolean
  projectModalId: string | null

  // Live reactivity version counters
  tasksVersion: number
  projectsVersion: number
  tagsVersion: number

  setSidebarCollapsed: (v: boolean) => void
  setCommandPaletteOpen: (v: boolean) => void
  setSelectedDate: (date: string) => void
  toggleTheme: () => void
  openTaskModal: (id?: string | null, projectId?: string | null) => void
  closeTaskModal: () => void
  openProjectModal: (id?: string) => void
  closeProjectModal: () => void

  refreshTasks: () => void
  refreshProjects: () => void
  refreshTags: () => void
  refreshAll: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  selectedDate: new Date().toISOString().split('T')[0],
  theme: 'dark',

  taskModalOpen: false,
  taskModalId: null,
  taskModalProjectId: null,
  projectModalOpen: false,
  projectModalId: null,

  tasksVersion: 0,
  projectsVersion: 0,
  tagsVersion: 0,

  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),
  setSelectedDate: (date) => set({ selectedDate: date }),

  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    set({ theme: next })
  },

  openTaskModal: (id, projectId) => set({ taskModalOpen: true, taskModalId: id ?? null, taskModalProjectId: projectId ?? null }),
  closeTaskModal: () => set({ taskModalOpen: false, taskModalId: null, taskModalProjectId: null }),
  openProjectModal: (id) => set({ projectModalOpen: true, projectModalId: id ?? null }),
  closeProjectModal: () => set({ projectModalOpen: false, projectModalId: null }),

  refreshTasks: () => set((state) => ({ tasksVersion: state.tasksVersion + 1 })),
  refreshProjects: () => set((state) => ({ projectsVersion: state.projectsVersion + 1 })),
  refreshTags: () => set((state) => ({ tagsVersion: state.tagsVersion + 1 })),
  refreshAll: () => set((state) => ({
    tasksVersion: state.tasksVersion + 1,
    projectsVersion: state.projectsVersion + 1,
    tagsVersion: state.tagsVersion + 1,
  })),
}))

// Init on client
if (typeof window !== 'undefined') {
  const theme = getStoredTheme()
  applyTheme(theme)
  useUIStore.setState({ theme })
}
