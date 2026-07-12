import { create } from 'zustand'
import { useEditorStore } from './editorStore'

export interface TabInfo {
  path: string
  name: string
  content: string
  /** Snapshot from the last successful save/open, used to derive isDirty. */
  savedContent: string
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
  updateTabPath: (
    oldPath: string,
    newPath: string,
    opts?: { contentWritten?: boolean; content?: string },
  ) => void
  triggerRefresh: () => void
}

let untitledSeq = 0

export function nextUntitledId(): string {
  untitledSeq++
  return `untitled-${untitledSeq}`
}

function parentDir(path: string): string {
  return path.substring(0, Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')))
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  root: null,
  openTabs: [],
  activeTabPath: null,
  refreshSignal: 0,

  setRoot: (root) => {
    set({ root })
    useEditorStore.getState().addRecentFolder(root)
  },

  openFile: (path, content) => {
    const editor = useEditorStore.getState()
    editor.addRecentFile(path)

    const currentRoot = get().root
    const dir = parentDir(path)
    if (dir && dir !== currentRoot) {
      if (!currentRoot || (!path.startsWith(currentRoot + '/') && !path.startsWith(currentRoot + '\\'))) {
        get().setRoot(dir)
      }
    }

    const tabs = get().openTabs
    const existing = tabs.find(t => t.path === path)
    if (existing) {
      set({
        activeTabPath: path,
        openTabs: tabs.map(t =>
          t.path === path ? { ...t, content, isDirty: false, savedContent: content, isUntitled: false } : t
        ),
      })
      editor.setSaveStatus('saved', Date.now())
      return
    }

    const name = path.split(/[/\\]/).pop() || path
    set({
      openTabs: [...tabs, { path, name, content, savedContent: content, isDirty: false }],
      activeTabPath: path,
    })
    editor.setSaveStatus('saved', Date.now())
  },

  closeTab: (path) => {
    const currentTabs = get().openTabs
    const tabs = currentTabs.filter(t => t.path !== path)
    const active = get().activeTabPath
    let next = active
    if (active === path) {
      const idx = currentTabs.findIndex(t => t.path === path)
      next = tabs[Math.min(idx, tabs.length - 1)]?.path ?? null
    }
    set({ openTabs: tabs, activeTabPath: next })
  },

  setActiveTab: (path) => set({ activeTabPath: path }),

  updateContent: (path, content) => {
    const nextTabs = get().openTabs.map(t => {
      if (t.path !== path) return t
      const isDirty = t.isUntitled ? true : content !== t.savedContent
      return { ...t, content, isDirty }
    })
    const changedTab = nextTabs.find(t => t.path === path)
    set({ openTabs: nextTabs })
    if (changedTab?.isDirty) {
      useEditorStore.getState().setSaveStatus('unsaved')
    }
  },

  markClean: (path) => {
    set({
      openTabs: get().openTabs.map(t =>
        t.path === path && !t.isUntitled ? { ...t, isDirty: false, savedContent: t.content } : t
      ),
    })
    useEditorStore.getState().setSaveStatus('saved', Date.now())
  },

  openUntitled: (path) => {
    const tabs = get().openTabs
    const existing = tabs.find(t => t.path === path)
    if (existing) {
      set({ activeTabPath: path })
      return
    }
    set({
      openTabs: [...tabs, { path, name: path, content: '', savedContent: '', isDirty: true, isUntitled: true }],
      activeTabPath: path,
    })
    useEditorStore.getState().setSaveStatus('unsaved')
  },

  updateTabPath: (oldPath, newPath, opts) => {
    const state = get()
    const tab = state.openTabs.find(t => t.path === oldPath)
    if (!tab) return
    const name = newPath.split(/[/\\]/).pop() || newPath
    const contentWritten = opts?.contentWritten ?? true
    const content = opts?.content ?? tab.content
    set({
      openTabs: state.openTabs.map(t => {
        if (t.path !== oldPath) return t
        if (contentWritten) {
          return {
            ...t,
            path: newPath,
            name,
            content,
            isUntitled: false,
            isDirty: false,
            savedContent: content,
          }
        }
        // Path-only change: keep dirty state relative to last real save.
        return {
          ...t,
          path: newPath,
          name,
          isUntitled: false,
          isDirty: content !== t.savedContent,
          content,
        }
      }),
      activeTabPath: state.activeTabPath === oldPath ? newPath : state.activeTabPath,
    })
    useEditorStore.getState().addRecentFile(newPath)
    if (contentWritten) {
      useEditorStore.getState().setSaveStatus('saved', Date.now())
    } else {
      const stillDirty = content !== tab.savedContent
      useEditorStore.getState().setSaveStatus(stillDirty ? 'unsaved' : 'saved', stillDirty ? undefined : Date.now())
    }
  },

  triggerRefresh: () => set({ refreshSignal: get().refreshSignal + 1 }),
}))
