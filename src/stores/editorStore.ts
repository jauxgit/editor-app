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

  setViewMode: (mode: ViewMode) => void
  toggleFileTree: () => void
  toggleTheme: () => void
  setHighlightTheme: (t: HighlightThemeId) => void
  setLanguage: (lang: Lang) => void
  setLastFilePath: (path: string | null) => void
  setLastRootPath: (path: string | null) => void
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      viewMode: 'source',
      theme: 'light',
      showFileTree: true,
      highlightTheme: 'github-dark',
      language: 'en',
      lastFilePath: null,
      lastRootPath: null,

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
      }),
    }
  )
)
