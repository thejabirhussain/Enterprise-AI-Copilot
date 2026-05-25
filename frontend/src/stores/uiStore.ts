// Zustand UI Store — Phase 2 with extended navigation
import { create } from 'zustand'
import type { Page } from '@/types'

interface UIStore {
  currentPage: Page
  sidebarOpen: boolean
  ragPanelOpen: boolean
  sourcePanelOpen: boolean
  learnModuleIndex: number

  setPage: (page: Page) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleRagPanel: () => void
  toggleSourcePanel: () => void
  setSourcePanelOpen: (open: boolean) => void
  setLearnModule: (index: number) => void
}

export const useUIStore = create<UIStore>((set) => ({
  currentPage: 'chat',
  sidebarOpen: true,
  ragPanelOpen: false,
  sourcePanelOpen: false,
  learnModuleIndex: 0,

  setPage: (page) => set({ currentPage: page }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleRagPanel: () => set((state) => ({ ragPanelOpen: !state.ragPanelOpen })),
  toggleSourcePanel: () => set((state) => ({ sourcePanelOpen: !state.sourcePanelOpen })),
  setSourcePanelOpen: (open) => set({ sourcePanelOpen: open }),
  setLearnModule: (index) => set({ learnModuleIndex: index }),
}))
