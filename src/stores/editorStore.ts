import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HighlightThemeId } from '../lib/highlightThemes'
import type { Lang } from '../lib/i18n'
import { editorThemes, getTheme, DEFAULT_THEME_ID } from '../lib/editorThemes'
import { DEFAULT_FONT_ID } from '../lib/editorFonts'

export type ViewMode = 'source' | 'preview' | 'split'
export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

interface EditorState {
  viewMode: ViewMode
  theme: string
  showFileTree: boolean
  sidebarWidth: number
  highlightTheme: HighlightThemeId
  language: Lang
  lastFilePath: string | null
  lastRootPath: string | null
  recentFiles: string[]
  recentFolders: string[]
  saveStatus: SaveStatus
  lastSavedAt: number | null
  disabledPlugins: string[]
  font: string
  fontSize: number
  autoSave: boolean
  autoSaveDelay: number

  setViewMode: (mode: ViewMode) => void
  toggleFileTree: () => void
  toggleChangesPanel: () => void
  cycleTheme: () => void
  setTheme: (id: string) => void
  setHighlightTheme: (t: HighlightThemeId) => void
  setLanguage: (lang: Lang) => void
  setLastFilePath: (path: string | null) => void
  setLastRootPath: (path: string | null) => void
  addRecentFile: (path: string) => void
  addRecentFolder: (path: string) => void
  removeRecentFile: (path: string) => void
  removeRecentFolder: (path: string) => void
  setSaveStatus: (status: SaveStatus, lastSavedAt?: number | null) => void
  togglePlugin: (id: string) => void
  setFont: (id: string) => void
  setFontSize: (n: number) => void
  setSidebarWidth: (w: number) => void
  setAutoSave: (on: boolean) => void
  setAutoSaveDelay: (ms: number) => void
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      viewMode: 'source',
      theme: DEFAULT_THEME_ID,
      showFileTree: true,
      sidebarWidth: 260,
      highlightTheme: 'github',
      language: 'en',
      lastFilePath: null,
      lastRootPath: null,
      recentFiles: [],
      recentFolders: [],
      saveStatus: 'saved',
      lastSavedAt: null,
      disabledPlugins: [],
      font: DEFAULT_FONT_ID,
      fontSize: 14,
      autoSave: true,
      autoSaveDelay: 2000,

      setViewMode: (mode) => set({ viewMode: mode }),
      toggleFileTree: () => set(s => ({ showFileTree: !s.showFileTree })),
      toggleChangesPanel: () => undefined,
      cycleTheme: () => set(s => {
        const idx = editorThemes.findIndex(t => t.id === s.theme)
        const next = (idx + 1) % editorThemes.length
        const nextTheme = editorThemes[next]
        return { theme: nextTheme.id, highlightTheme: nextTheme.highlightThemeId as HighlightThemeId }
      }),
      setTheme: (id) => {
        const theme = getTheme(id)
        if (theme) set({ theme: id, highlightTheme: theme.highlightThemeId as HighlightThemeId })
      },
      setHighlightTheme: (t) => set({ highlightTheme: t }),
      setLanguage: (lang) => {
        set({ language: lang })
        if (window.electronAPI) window.electronAPI.setLanguage(lang)
      },
      setLastFilePath: (path) => set({ lastFilePath: path }),
      setLastRootPath: (path) => set({ lastRootPath: path }),
      addRecentFile: (path) => set((state) => ({
        recentFiles: [path, ...state.recentFiles.filter((item) => item !== path)].slice(0, 10),
        lastFilePath: path,
      })),
      addRecentFolder: (path) => set((state) => ({
        recentFolders: [path, ...state.recentFolders.filter((item) => item !== path)].slice(0, 10),
        lastRootPath: path,
      })),
      removeRecentFile: (path) => set((state) => ({
        recentFiles: state.recentFiles.filter((item) => item !== path),
        lastFilePath: state.lastFilePath === path ? null : state.lastFilePath,
      })),
      removeRecentFolder: (path) => set((state) => ({
        recentFolders: state.recentFolders.filter((item) => item !== path),
        lastRootPath: state.lastRootPath === path ? null : state.lastRootPath,
      })),
      setSaveStatus: (status, lastSavedAt) => set((state) => ({
        saveStatus: status,
        lastSavedAt: lastSavedAt === undefined ? state.lastSavedAt : lastSavedAt,
      })),
      togglePlugin: (id) => set(s => {
        const disabled = [...s.disabledPlugins]
        const idx = disabled.indexOf(id)
        if (idx >= 0) disabled.splice(idx, 1)
        else disabled.push(id)
        return { disabledPlugins: disabled }
      }),
      setFont: (id) => set({ font: id }),
      setFontSize: (n) => set({ fontSize: n }),
      setSidebarWidth: (w) => set({ sidebarWidth: w }),
      setAutoSave: (on) => set({ autoSave: on }),
      setAutoSaveDelay: (ms) => set({ autoSaveDelay: ms }),
    }),
    {
      name: 'markedit-settings',
      partialize: (state) => ({
        theme: state.theme,
        highlightTheme: state.highlightTheme,
        language: state.language,
        showFileTree: state.showFileTree,
        sidebarWidth: state.sidebarWidth,
        lastFilePath: state.lastFilePath,
        lastRootPath: state.lastRootPath,
        recentFiles: state.recentFiles,
        recentFolders: state.recentFolders,
        disabledPlugins: state.disabledPlugins,
        font: state.font,
        fontSize: state.fontSize,
        autoSave: state.autoSave,
        autoSaveDelay: state.autoSaveDelay,
      }),
    }
  )
)
