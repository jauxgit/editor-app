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

export interface OpenFileOptions {
  /**
   * When false, never call setRoot even if the path looks outside the current root.
   * Used by in-workspace actions (search results, tree clicks) so a path-format
   * mismatch cannot collapse the file tree to the file's parent directory.
   * Default: true (dialogs / OS open may adopt a new root).
   */
  allowRootChange?: boolean
}

interface WorkspaceState {
  root: string | null
  openTabs: TabInfo[]
  activeTabPath: string | null
  refreshSignal: number

  setRoot: (root: string) => void
  openFile: (path: string, content: string, opts?: OpenFileOptions) => void
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

/**
 * Normalize for comparison only (does not change storage form).
 * - strip Win32 long-path / device prefixes
 * - unify separators to `/`
 * - drop trailing slashes (except drive root `C:/`)
 */
export function normalizePath(path: string): string {
  let p = path.trim()
  // \\?\C:\foo → C:\foo ; \\?\UNC\server\share → //server/share
  if (p.startsWith('\\\\?\\UNC\\')) p = '\\\\' + p.slice('\\\\?\\UNC\\'.length)
  else if (p.startsWith('\\\\?\\')) p = p.slice('\\\\?\\'.length)
  p = p.replace(/\\/g, '/')
  // Collapse duplicate slashes but keep leading // for UNC
  if (p.startsWith('//')) {
    p = '//' + p.slice(2).replace(/\/+/g, '/')
  } else {
    p = p.replace(/\/+/g, '/')
  }
  // Strip trailing slash except "C:/" style roots
  if (p.length > 3) p = p.replace(/\/+$/, '')
  return p
}

/**
 * True if `filePath` is inside `root` (or is the root itself).
 * Must tolerate Windows `\` vs `/`, drive-letter case, and long-path prefixes —
 * otherwise openFile wrongly setRoot(parentDir) and the file tree "jumps" to
 * the file's parent as the new workspace root (search-result click repro).
 */
export function isPathUnderRoot(filePath: string, root: string): boolean {
  const a = normalizePath(filePath).toLowerCase()
  const b = normalizePath(root).toLowerCase()
  if (!b || !a) return false
  return a === b || a.startsWith(b + '/')
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  root: null,
  openTabs: [],
  activeTabPath: null,
  refreshSignal: 0,

  setRoot: (root) => {
    const current = get().root
    // Idempotent: same folder with different separators must not remount FileTree
    // (loadRoot clears childrenMap and looks like a full tree refresh).
    if (current && normalizePath(current) === normalizePath(root)) {
      return
    }
    set({ root })
    useEditorStore.getState().addRecentFolder(root)
  },

  openFile: (path, content, opts) => {
    const editor = useEditorStore.getState()
    editor.addRecentFile(path)

    const currentRoot = get().root
    // Default true: dialogs / OS open may need to adopt a new root.
    // In-workspace UX (search, file tree) MUST pass allowRootChange: false.
    const allowRootChange = opts?.allowRootChange !== false
    if (allowRootChange) {
      if (!currentRoot) {
        const dir = parentDir(path)
        if (dir) get().setRoot(dir)
      } else if (!isPathUnderRoot(path, currentRoot)) {
        const dir = parentDir(path)
        if (dir) get().setRoot(dir)
      }
    }

    const tabs = get().openTabs
    // Match tabs by normalized path so tree `\` vs search `/` does not open a duplicate tab
    // ("重新开一个窗口/标签") for the same file.
    const existing = tabs.find(t => normalizePath(t.path) === normalizePath(path))
    if (existing) {
      // 已有标签只激活，绝不用磁盘内容覆盖缓冲区：重复打开（文件树双击、
      // 搜索结果、最近文件、系统打开）不能吞掉未保存的编辑。
      if (existing.isDirty) {
        set({ activeTabPath: existing.path })
        return
      }
      // Keep the existing tab's path string as the stable key (avoids EditorView remount + tree key thrash)
      const stablePath = existing.path
      set({
        activeTabPath: stablePath,
        openTabs: tabs.map(t =>
          normalizePath(t.path) === normalizePath(path)
            ? {
                ...t,
                // Prefer the form already used by the tree when under workspace
                path: stablePath,
                content,
                isDirty: false,
                savedContent: content,
                isUntitled: false,
              }
            : t
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
