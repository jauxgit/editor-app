import { create } from 'zustand'
import { useEditorStore } from './editorStore'

export interface TabInfo {
  path: string
  name: string
  content: string
  isDirty: boolean
  isUntitled?: boolean
}

interface WorkspaceState {
  root: string | null
  openTabs: TabInfo[]
  activeTabPath: string | null
  refreshSignal: number

  setRoot: (root: string) => void
  openFile: (path: string, content: string) => void
  openUntitled: (path: string) => void
  closeTab: (path: string) => void
  setActiveTab: (path: string) => void
  updateContent: (path: string, content: string) => void
  markClean: (path: string) => void
  updateTabPath: (oldPath: string, newPath: string) => void
  triggerRefresh: () => void
}

let untitledSeq = 0

export function nextUntitledId(): string {
  untitledSeq++
  return `untitled-${untitledSeq}`
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  root: null,
  openTabs: [],
  activeTabPath: null,
  refreshSignal: 0,

  setRoot: (root) => {
    set({ root })
    useEditorStore.getState().setLastRootPath(root)
  },

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
    // 记录最近打开的文件路径
    useEditorStore.getState().setLastFilePath(path)
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

  openUntitled: (path) => {
    const tabs = get().openTabs
    const existing = tabs.find(t => t.path === path)
    if (existing) {
      set({ activeTabPath: path })
      return
    }
    set({
      openTabs: [...tabs, { path, name: path, content: '', isDirty: true, isUntitled: true }],
      activeTabPath: path,
    })
  },

  updateTabPath: (oldPath, newPath) => {
    const state = get()
    const tab = state.openTabs.find(t => t.path === oldPath)
    if (!tab) return
    const name = newPath.split(/[/\\]/).pop() || newPath
    set({
      openTabs: state.openTabs.map(t =>
        t.path === oldPath ? { ...t, path: newPath, name, isUntitled: false } : t
      ),
      activeTabPath: state.activeTabPath === oldPath ? newPath : state.activeTabPath,
    })
  },

  triggerRefresh: () => set({ refreshSignal: get().refreshSignal + 1 }),
}))
