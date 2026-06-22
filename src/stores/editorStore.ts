import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HighlightThemeId } from '../lib/highlightThemes'
import type { Lang } from '../lib/i18n'
import { editorThemes, getTheme, DEFAULT_THEME_ID } from '../lib/editorThemes'
import { DEFAULT_FONT_ID } from '../lib/editorFonts'

export type ViewMode = 'source' | 'preview' | 'split'

interface EditorState {
  viewMode: ViewMode
  /** Theme ID — see lib/editorThemes.ts for available themes */
  theme: string
  showFileTree: boolean
  showChangesPanel: boolean
  /** Sidebar width in pixels — persisted for drag-to-resize */
  sidebarWidth: number
  highlightTheme: HighlightThemeId
  language: Lang
  lastFilePath: string | null
  lastRootPath: string | null
  disabledPlugins: string[]
  /** Font preset ID — see lib/editorFonts.ts for available fonts */
  font: string
  /** 编辑器字号（px） */
  fontSize: number

  setViewMode: (mode: ViewMode) => void
  toggleFileTree: () => void
  toggleChangesPanel: () => void
  /** Switch to the next/prev theme (cycling through the available themes) */
  cycleTheme: () => void
  /** Set a specific theme by ID */
  setTheme: (id: string) => void
  setHighlightTheme: (t: HighlightThemeId) => void
  setLanguage: (lang: Lang) => void
  setLastFilePath: (path: string | null) => void
  setLastRootPath: (path: string | null) => void
  togglePlugin: (id: string) => void
  setFont: (id: string) => void
  setFontSize: (n: number) => void
  setSidebarWidth: (w: number) => void
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      viewMode: 'source',
      theme: DEFAULT_THEME_ID,
      showFileTree: true,
      showChangesPanel: false,
      sidebarWidth: 260,
      highlightTheme: 'github',
      language: 'en',
      lastFilePath: null,
      lastRootPath: null,
      disabledPlugins: [],
      font: DEFAULT_FONT_ID,
      fontSize: 14,

      setViewMode: (mode) => set({ viewMode: mode }),
      toggleFileTree: () => set(s => ({ showFileTree: !s.showFileTree })),
      toggleChangesPanel: () => set(s => ({ showChangesPanel: !s.showChangesPanel })),
      cycleTheme: () => set(s => {
        const idx = editorThemes.findIndex(t => t.id === s.theme)
        const next = (idx + 1) % editorThemes.length
        const nextTheme = editorThemes[next]
        return { theme: nextTheme.id, highlightTheme: nextTheme.highlightThemeId as any }
      }),
      setTheme: (id) => {
        const theme = getTheme(id)
        if (theme) set({ theme: id, highlightTheme: theme.highlightThemeId as any })
      },
      setHighlightTheme: (t) => set({ highlightTheme: t }),
      setLanguage: (lang) => {
        set({ language: lang })
        if (window.electronAPI) {
          window.electronAPI.setLanguage(lang)
        }
      },
      setLastFilePath: (path) => set({ lastFilePath: path }),
      setLastRootPath: (path) => set({ lastRootPath: path }),
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
        disabledPlugins: state.disabledPlugins,
        font: state.font,
        fontSize: state.fontSize,
      }),
    }
  )
)
