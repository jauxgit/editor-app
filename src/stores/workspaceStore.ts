import { create } from 'zustand'

export interface TabInfo {
  path: string
  name: string
  content: string
  isDirty: boolean
}

interface WorkspaceState {
  root: string | null
  openTabs: TabInfo[]
  activeTabPath: string | null

  setRoot: (root: string) => void
  openFile: (path: string, content: string) => void
  closeTab: (path: string) => void
  setActiveTab: (path: string) => void
  updateContent: (path: string, content: string) => void
  markClean: (path: string) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  root: null,
  openTabs: [],
  activeTabPath: null,

  setRoot: (root) => set({ root }),

  openFile: (path, content) => {
    const tabs = get().openTabs
    const existing = tabs.find(t => t.path === path)
    if (existing) {
      set({ activeTabPath: path })
      return
    }
    const name = path.split(/[/\\]/).pop() || path
    set({
      openTabs: [...tabs, { path, name, content, isDirty: false }],
      activeTabPath: path,
    })
  },

  closeTab: (path) => {
    const tabs = get().openTabs.filter(t => t.path !== path)
    const active = get().activeTabPath
    let next = active
    if (active === path) {
      const idx = get().openTabs.findIndex(t => t.path === path)
      next = tabs[Math.min(idx, tabs.length - 1)]?.path ?? null
    }
    set({ openTabs: tabs, activeTabPath: next })
  },

  setActiveTab: (path) => set({ activeTabPath: path }),

  updateContent: (path, content) => {
    set({
      openTabs: get().openTabs.map(t =>
        t.path === path ? { ...t, content, isDirty: true } : t
      ),
    })
  },

  markClean: (path) => {
    set({
      openTabs: get().openTabs.map(t =>
        t.path === path ? { ...t, isDirty: false } : t
      ),
    })
  },
}))
