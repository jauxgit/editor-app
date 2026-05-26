import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HighlightThemeId } from '../lib/highlightThemes'
import type { Lang } from '../lib/i18n'

export type ViewMode = 'source' | 'preview' | 'split'

interface EditorState {
  viewMode: ViewMode
  theme: 'light' | 'dark'
  showFileTree: boolean
  highlightTheme: HighlightThemeId
  language: Lang
  lastFilePath: string | null
  lastRootPath: string | null
  disabledPlugins: string[]

  setViewMode: (mode: ViewMode) => void
  toggleFileTree: () => void
  toggleTheme: () => void
  setHighlightTheme: (t: HighlightThemeId) => void
  setLanguage: (lang: Lang) => void
  setLastFilePath: (path: string | null) => void
  setLastRootPath: (path: string | null) => void
  togglePlugin: (id: string) => void
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      viewMode: 'preview',
      theme: 'light',
      showFileTree: true,
      highlightTheme: 'github-dark',
      language: 'en',
      lastFilePath: null,
      lastRootPath: null,
      disabledPlugins: [],

      setViewMode: (mode) => set({ viewMode: mode }),
      toggleFileTree: () => set(s => ({ showFileTree: !s.showFileTree })),
      toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
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
    }),
    {
      name: 'markedit-settings',
      partialize: (state) => ({
        theme: state.theme,
        highlightTheme: state.highlightTheme,
        language: state.language,
        showFileTree: state.showFileTree,
        lastFilePath: state.lastFilePath,
        lastRootPath: state.lastRootPath,
        disabledPlugins: state.disabledPlugins,
      }),
    }
  )
)
