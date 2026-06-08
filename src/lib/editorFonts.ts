export interface EditorFont {
  id: string
  uiFont: string
  monoFont: string
  googleFont?: string
}

export const DEFAULT_FONT_ID = 'default'

export const editorFonts: EditorFont[] = [
  {
    id: 'default',
    uiFont: "'IBM Plex Sans', system-ui, -apple-system, sans-serif",
    monoFont: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace",
    googleFont: 'family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;1,400',
  },
  {
    id: 'fira',
    uiFont: "'Inter', system-ui, -apple-system, sans-serif",
    monoFont: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
    googleFont: 'family=Inter:wght@400;500;600&family=Fira+Code:wght@400;500;600',
  },
  {
    id: 'cascadia',
    uiFont: "'IBM Plex Sans', system-ui, -apple-system, sans-serif",
    monoFont: "'Cascadia Code', 'Cascadia Mono', 'JetBrains Mono', monospace",
    googleFont: 'family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Cascadia+Code:wght@400;600',
  },
  {
    id: 'source',
    uiFont: "'Source Sans 3', system-ui, -apple-system, sans-serif",
    monoFont: "'Source Code Pro', 'JetBrains Mono', 'Consolas', monospace",
    googleFont: 'family=Source+Sans+3:ital,wght@0,400;0,500;0,600;1,400&family=Source+Code+Pro:wght@400;500;600',
  },
  {
    id: 'system',
    uiFont: "system-ui, -apple-system, sans-serif",
    monoFont: "'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace",
    googleFont: 'family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400',
  },
  {
    id: 'legacy',
    uiFont: "'Segoe UI', system-ui, -apple-system, sans-serif",
    monoFont: "'Consolas', 'Courier New', monospace",
    googleFont: 'family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400',
  },
]

export function getFont(id: string): EditorFont {
  return editorFonts.find(f => f.id === id) || editorFonts[0]
}
