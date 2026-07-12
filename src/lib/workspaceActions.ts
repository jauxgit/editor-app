import { translate } from './i18n'
import { getActiveEditorView, joinPath, writeNamedFile } from './commands'
import { useEditorStore } from '../stores/editorStore'
import { useToastStore } from '../stores/toastStore'
import { nextUntitledId, type TabInfo, useWorkspaceStore } from '../stores/workspaceStore'

function t(key: string, params?: Record<string, string | number>) {
  return translate(useEditorStore.getState().language, key, params)
}

function showError(messageKey: string, detail?: string, params?: Record<string, string | number>) {
  useToastStore.getState().showToast({ type: 'error', message: t(messageKey, params), detail })
}

function parentDir(path: string): string {
  return path.substring(0, Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')))
}

/** Illegal filename characters on Windows + path separators. */
const INVALID_NAME_RE = /[<>:"/\\|?*\x00-\x1f]/

/** Normalize user-entered name: trim, strip path seps, default .md if no extension. */
export function normalizeNewFileName(raw: string): string | null {
  let name = raw.trim()
  if (!name) return null
  // Reject path segments
  if (name.includes('/') || name.includes('\\')) return null
  if (name === '.' || name === '..') return null
  if (INVALID_NAME_RE.test(name)) return null
  if (!name.includes('.')) name = `${name}.md`
  return name
}

/** Sync active CM6 doc into the workspace store only for the active tab. */
function flushEditorContentToTab(tab: TabInfo): TabInfo {
  const store = useWorkspaceStore.getState()
  if (store.activeTabPath !== tab.path) return tab
  const view = getActiveEditorView()
  if (!view) return tab
  const content = view.state.doc.toString()
  if (content === tab.content) return tab
  store.updateContent(tab.path, content)
  return { ...tab, content, isDirty: tab.isUntitled ? true : content !== tab.savedContent }
}

export async function openFileFromDialog(): Promise<boolean> {
  if (!window.electronAPI) return false
  try {
    const result = await window.electronAPI.openFileDialog()
    if (!result) return false
    useWorkspaceStore.getState().openFile(result.path, result.content)
    useToastStore.getState().showToast({ type: 'success', message: t('toast.fileOpened'), detail: result.path })
    return true
  } catch (error) {
    showError('toast.fileOpenFailed', error instanceof Error ? error.message : String(error))
    return false
  }
}

export async function openFolderFromDialog(): Promise<boolean> {
  if (!window.electronAPI) return false
  try {
    const result = await window.electronAPI.openFolderDialog()
    if (!result) return false
    useWorkspaceStore.getState().setRoot(result.path)
    useToastStore.getState().showToast({ type: 'success', message: t('toast.folderOpened'), detail: result.path })
    return true
  } catch (error) {
    showError('toast.folderOpenFailed', error instanceof Error ? error.message : String(error))
    return false
  }
}

export async function openRecentFile(path: string): Promise<boolean> {
  if (!window.electronAPI) return false
  try {
    const result = await window.electronAPI.readFile(path)
    useWorkspaceStore.getState().openFile(result.path, result.content)
    return true
  } catch (error) {
    useEditorStore.getState().removeRecentFile(path)
    showError('toast.fileOpenFailed', error instanceof Error ? error.message : String(error), { path })
    return false
  }
}

export function openRecentFolder(path: string): boolean {
  useWorkspaceStore.getState().setRoot(path)
  return true
}

/**
 * Always open a virtual untitled tab (even when a workspace root is open).
 * First save must go through Save As.
 */
export async function createNewDocument(_dir?: string): Promise<string | null> {
  const store = useWorkspaceStore.getState()
  const id = nextUntitledId()
  store.openUntitled(id)
  useToastStore.getState().showToast({ type: 'info', message: t('toast.untitledCreated'), detail: id })
  return id
}

/**
 * Create a named empty file under dir (file tree flow).
 * Caller supplies the final name after inline rename UI.
 */
export async function createNamedFileInDir(dir: string, rawName: string): Promise<string | null> {
  if (!window.electronAPI) return null
  const fileName = normalizeNewFileName(rawName)
  if (!fileName) {
    showError('toast.invalidFileName')
    return null
  }

  try {
    const path = await writeNamedFile(dir, fileName)
    if (!path) {
      showError('toast.fileNameExists', undefined, { name: fileName })
      return null
    }
    const store = useWorkspaceStore.getState()
    store.openFile(path, '')
    store.triggerRefresh()
    useToastStore.getState().showToast({ type: 'success', message: t('toast.fileCreated'), detail: path })
    return path
  } catch (error) {
    showError('toast.fileCreateFailed', error instanceof Error ? error.message : String(error))
    return null
  }
}

/**
 * Rename an on-disk entry. If a tab is open, flush editor content to the new path
 * so auto-save cannot recreate the old path with stale content.
 */
export async function renameEntry(oldPath: string, newName: string): Promise<string | null> {
  if (!window.electronAPI) return null
  const trimmed = newName.trim()
  if (!trimmed || INVALID_NAME_RE.test(trimmed) || trimmed.includes('/') || trimmed.includes('\\')) {
    showError('toast.invalidFileName')
    return null
  }

  const dir = parentDir(oldPath)
  const newPath = joinPath(dir, trimmed)
  if (newPath === oldPath) return oldPath

  const store = useWorkspaceStore.getState()
  const openTab = store.openTabs.find((item) => item.path === oldPath)
  let content: string | undefined
  if (openTab) {
    const flushed = flushEditorContentToTab(openTab)
    content = flushed.content
  }

  try {
    // Pre-check collision so we fail before rename.
    const siblings = await window.electronAPI.listDir(dir)
    if (siblings.some((e) => e.name === trimmed && e.path !== oldPath)) {
      showError('toast.fileNameExists', undefined, { name: trimmed })
      return null
    }

    const ok = await window.electronAPI.rename(oldPath, newPath)
    if (!ok) {
      showError('toast.renameFailed', oldPath)
      return null
    }

    let contentWritten = false
    if (openTab && content !== undefined) {
      // Ensure new path has the latest buffer (disk may still have pre-edit bytes).
      await window.electronAPI.writeFile(newPath, content)
      contentWritten = true
    }

    if (openTab) {
      store.updateTabPath(oldPath, newPath, {
        contentWritten,
        content,
      })
    }

    store.triggerRefresh()
    useToastStore.getState().showToast({ type: 'success', message: t('toast.renamed'), detail: newPath })
    return newPath
  } catch (error) {
    showError('toast.renameFailed', error instanceof Error ? error.message : String(error))
    return null
  }
}

/** @returns final path on success, null on cancel/failure */
export async function saveTab(tab: TabInfo): Promise<string | null> {
  if (!window.electronAPI) return null
  const store = useWorkspaceStore.getState()
  const editor = useEditorStore.getState()
  const current = flushEditorContentToTab(tab)

  editor.setSaveStatus('saving')
  try {
    if (current.isUntitled) {
      const defaultPath = store.root
        ? joinPath(store.root, 'untitled.md')
        : current.name || 'untitled.md'
      const savePath = await window.electronAPI.saveDialog(defaultPath)
      if (!savePath) {
        editor.setSaveStatus('unsaved')
        return null
      }
      await window.electronAPI.writeFile(savePath, current.content)
      store.updateTabPath(current.path, savePath, { contentWritten: true, content: current.content })
      store.markClean(savePath)
      if (!store.root) {
        const dir = parentDir(savePath)
        if (dir) store.setRoot(dir)
      }
      store.triggerRefresh()
      useToastStore.getState().showToast({ type: 'success', message: t('toast.saveSuccess'), detail: savePath })
      return savePath
    }

    await window.electronAPI.writeFile(current.path, current.content)
    store.markClean(current.path)
    useToastStore.getState().showToast({ type: 'success', message: t('toast.saveSuccess'), detail: current.path })
    return current.path
  } catch (error) {
    editor.setSaveStatus('error')
    showError('toast.saveFailed', error instanceof Error ? error.message : String(error))
    return null
  }
}

export async function saveActiveTab(): Promise<boolean> {
  const store = useWorkspaceStore.getState()
  const tab = store.openTabs.find((item) => item.path === store.activeTabPath)
  if (!tab) {
    useToastStore.getState().showToast({ type: 'warning', message: t('toast.noActiveFile') })
    return false
  }
  return (await saveTab(tab)) !== null
}

export async function closeTabWithConfirm(tab: TabInfo): Promise<boolean> {
  const store = useWorkspaceStore.getState()
  const current = flushEditorContentToTab(tab)
  if (!current.isDirty) {
    store.closeTab(current.path)
    return true
  }

  if (window.electronAPI) {
    const action = await window.electronAPI.confirmUnsaved(
      t('confirm.unsavedMessage', { name: current.name }),
      t('confirm.unsavedTitle'),
    )
    if (action === 'save') {
      const savedPath = await saveTab(current)
      if (savedPath) {
        useWorkspaceStore.getState().closeTab(savedPath)
        return true
      }
      return false
    }
    if (action === 'discard') {
      store.closeTab(current.path)
      return true
    }
    return false
  }

  if (window.confirm(t('confirm.unsavedMessage', { name: current.name }))) {
    store.closeTab(current.path)
    return true
  }
  return false
}

export async function closeActiveTab(): Promise<boolean> {
  const store = useWorkspaceStore.getState()
  const tab = store.openTabs.find((item) => item.path === store.activeTabPath)
  if (!tab) return false
  return closeTabWithConfirm(tab)
}

export function activateNextTab(direction: 1 | -1): boolean {
  const store = useWorkspaceStore.getState()
  const tabs = store.openTabs
  if (tabs.length < 2 || !store.activeTabPath) return false
  const idx = tabs.findIndex((tab) => tab.path === store.activeTabPath)
  const next = tabs[(idx + direction + tabs.length) % tabs.length]
  if (!next) return false
  store.setActiveTab(next.path)
  return true
}
