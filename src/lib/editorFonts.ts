export interface EditorFont {
  id: string
  uiFont: string
  monoFont: string
  googleFont?: string
}

export const DEFAULT_FONT_ID = 'default'

/**
 * 字体系统 —— 重塑版
 * UI 主字体：Sora（几何现代，契合「笔记 + 编辑」的排印感）
 * 中文回退：Noto Sans SC；等宽：JetBrains Mono
 */
export const editorFonts: EditorFont[] = [
  {
    id: 'default',
    uiFont: "'Sora', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace",
    googleFont:
      'family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Noto+Sans+SC:wght@400;500;700',
  },
  {
    id: 'grotesk',
    uiFont: "'Space Grotesk', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace",
    googleFont:
      'family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;700',
  },
  {
    id: 'fira',
    uiFont: "'Inter', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
    monoFont: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
    googleFont:
      'family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;700',
  },
  {
    id: 'cascadia',
    uiFont: "'Sora', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
    monoFont: "'Cascadia Code', 'Cascadia Mono', 'JetBrains Mono', monospace",
    googleFont:
      'family=Sora:wght@400;500;600;700;800&family=Cascadia+Code:wght@400;600&family=Noto+Sans+SC:wght@400;500;700',
  },
  {
    id: 'source',
    uiFont: "'Source Sans 3', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
    monoFont: "'Source Code Pro', 'JetBrains Mono', 'Consolas', monospace",
    googleFont:
      'family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Source+Code+Pro:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;700',
  },
  {
    id: 'system',
    uiFont: "system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    monoFont: "'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace",
    googleFont: 'family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;700',
  },
]

export function getFont(id: string): EditorFont {
  return editorFonts.find(f => f.id === id) || editorFonts[0]
}
