'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { AppHeader } from '@/components/layout/AppHeader'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { TaskModal } from '@/components/tasks/TaskModal'
import { ProjectModal } from '@/components/projects/ProjectModal'
import { useUIStore } from '@/lib/store'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { taskModalOpen, closeTaskModal, taskModalId, projectModalOpen, closeProjectModal, projectModalId } = useUIStore()

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: 'var(--bg)', position: 'relative' }}>
      {/* Aurora background blobs — subtle aesthetic ambient glow */}
      <div className="aurora-blob aurora-1" aria-hidden="true" />
      <div className="aurora-blob aurora-2" aria-hidden="true" />

      {/* Sidebar — desktop only */}
      <div className="desktop-sidebar" style={{ display: 'none', height: '100%', position: 'relative', zIndex: 2 }}>
        <Sidebar />
      </div>

      <style>{`
        @media (min-width: 768px) {
          .desktop-sidebar { display: flex !important; }
          .mobile-bottom-bar { display: none !important; }
          .floating-sparkle-fab { right: 32px !important; bottom: 32px !important; }
        }
      `}</style>

      {/* Main container with Top App Header */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', position: 'relative', zIndex: 1 }}>
        <AppHeader />

        {/* Main scroll area */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0,
          background: 'transparent',
          position: 'relative',
        }}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav & floating action button */}
      <div className="mobile-bottom-bar">
        <MobileNav />
      </div>

      {/* Global overlays */}
      <CommandPalette />
      {taskModalOpen && <TaskModal taskId={taskModalId} onClose={closeTaskModal} />}
      {projectModalOpen && <ProjectModal projectId={projectModalId} onClose={closeProjectModal} />}
    </div>
  )
}
