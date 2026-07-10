import { translate } from './i18n'
import { createNewFile } from './commands'
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

export async function createNewDocument(dir?: string): Promise<string | null> {
  const store = useWorkspaceStore.getState()
  const targetDir = dir || store.root

  if (targetDir && window.electronAPI) {
    try {
      const path = await createNewFile(targetDir)
      if (!path) throw new Error(t('toast.fileCreateFailed'))
      store.openFile(path, '')
      store.triggerRefresh()
      useToastStore.getState().showToast({ type: 'success', message: t('toast.fileCreated'), detail: path })
      return path
    } catch (error) {
      showError('toast.fileCreateFailed', error instanceof Error ? error.message : String(error))
      return null
    }
  }

  const id = nextUntitledId()
  store.openUntitled(id)
  useToastStore.getState().showToast({ type: 'info', message: t('toast.untitledCreated'), detail: id })
  return id
}

export async function saveTab(tab: TabInfo): Promise<boolean> {
  if (!window.electronAPI) return false
  const store = useWorkspaceStore.getState()
  const editor = useEditorStore.getState()

  editor.setSaveStatus('saving')
  try {
    if (tab.isUntitled) {
      const savePath = await window.electronAPI.saveDialog(store.root || tab.name)
      if (!savePath) {
        editor.setSaveStatus('unsaved')
        return false
      }
      await window.electronAPI.writeFile(savePath, tab.content)
      store.updateTabPath(tab.path, savePath)
      store.markClean(savePath)
      if (!store.root) {
        const dir = parentDir(savePath)
        if (dir) store.setRoot(dir)
      }
      store.triggerRefresh()
      useToastStore.getState().showToast({ type: 'success', message: t('toast.saveSuccess'), detail: savePath })
      return true
    }

    await window.electronAPI.writeFile(tab.path, tab.content)
    store.markClean(tab.path)
    useToastStore.getState().showToast({ type: 'success', message: t('toast.saveSuccess'), detail: tab.path })
    return true
  } catch (error) {
    editor.setSaveStatus('error')
    showError('toast.saveFailed', error instanceof Error ? error.message : String(error))
    return false
  }
}

export async function saveActiveTab(): Promise<boolean> {
  const store = useWorkspaceStore.getState()
  const tab = store.openTabs.find((item) => item.path === store.activeTabPath)
  if (!tab) {
    useToastStore.getState().showToast({ type: 'warning', message: t('toast.noActiveFile') })
    return false
  }
  return saveTab(tab)
}

export async function closeTabWithConfirm(tab: TabInfo): Promise<boolean> {
  const store = useWorkspaceStore.getState()
  if (!tab.isDirty) {
    store.closeTab(tab.path)
    return true
  }

  if (window.electronAPI) {
    const action = await window.electronAPI.confirmUnsaved(
      t('confirm.unsavedMessage', { name: tab.name }),
      t('confirm.unsavedTitle'),
    )
    if (action === 'save') {
      const saved = await saveTab(tab)
      if (saved) store.closeTab(tab.path)
      return saved
    }
    if (action === 'discard') {
      store.closeTab(tab.path)
      return true
    }
    return false
  }

  if (window.confirm(t('confirm.unsavedMessage', { name: tab.name }))) {
    store.closeTab(tab.path)
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
