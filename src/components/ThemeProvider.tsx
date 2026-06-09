import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useEditorStore } from '../stores/editorStore'
import { getTheme, editorThemes } from '../lib/editorThemes'
import { getFont, editorFonts } from '../lib/editorFonts'
import { applyHighlightTheme } from '../lib/highlightThemes'

interface Props {
  children: ReactNode
}

/**
 * 全局样式注入组件。
 * 负责在 documentElement 上设置主题 CSS 变量、字体 CSS 变量和高亮主题 CSS。
 * 从 AppLayout 中提取，使布局组件职责更聚焦。
 */
export function ThemeProvider({ children }: Props) {
  const theme = useEditorStore(s => s.theme)
  const font = useEditorStore(s => s.font)
  const highlightTheme = useEditorStore(s => s.highlightTheme)

  // 应用主题 CSS 变量
  useEffect(() => {
    const def = getTheme(theme) || editorThemes[0]
    const root = document.documentElement
    for (const [key, val] of Object.entries(def.vars)) {
      root.style.setProperty(key, val)
    }
  }, [theme])

  // 应用字体 CSS 变量
  useEffect(() => {
    const def = getFont(font) || editorFonts[0]
    const root = document.documentElement
    root.style.setProperty('--font-ui', def.uiFont)
    root.style.setProperty('--font-mono', def.monoFont)
  }, [font])

  // 注入 highlight.js 预览代码高亮 CSS
  useEffect(() => {
    applyHighlightTheme(highlightTheme)
  }, [highlightTheme])

  return <>{children}</>
}
