import { create } from 'zustand'

export type ViewMode = 'source' | 'preview' | 'split'

interface EditorState {
  viewMode: ViewMode
  theme: 'light' | 'dark'
  showFileTree: boolean

  setViewMode: (mode: ViewMode) => void
  toggleFileTree: () => void
  toggleTheme: () => void
}

export const useEditorStore = create<EditorState>((set) => ({
  viewMode: 'source',
  theme: 'dark',
  showFileTree: true,

  setViewMode: (mode) => set({ viewMode: mode }),
  toggleFileTree: () => set(s => ({ showFileTree: !s.showFileTree })),
  toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
}))
