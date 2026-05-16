import { useMemo, useRef, useEffect } from 'react'
import { renderMarkdown } from '../../lib/markdown'
import { useEditorStore } from '../../stores/editorStore'

interface Props {
  content: string
  /** 编辑器滚动位置同步 (0-1 比例) */
  scrollRatio?: number
  onScrollChange?: (ratio: number) => void
}

export function MarkdownPreview({ content, scrollRatio, onScrollChange }: Props) {
  const html = useMemo(() => renderMarkdown(content), [content])
  const theme = useEditorStore(s => s.theme)
  const ref = useRef<HTMLDivElement>(null)

  // 同步滚动位置
  useEffect(() => {
    if (!ref.current || scrollRatio === undefined) return
    const el = ref.current
    const max = el.scrollHeight - el.clientHeight
    if (max > 0) {
      el.scrollTop = scrollRatio * max
    }
  }, [scrollRatio])

  // 发出滚动事件
  useEffect(() => {
    const el = ref.current
    if (!el || !onScrollChange) return
    const handler = () => {
      const max = el.scrollHeight - el.clientHeight
      if (max > 0) onScrollChange(el.scrollTop / max)
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [onScrollChange])

  const isDark = theme === 'dark'
  const bg = isDark ? 'bg-gray-900' : 'bg-white'
  const text = isDark ? 'text-gray-200' : 'text-gray-900'

  return (
    <div
      ref={ref}
      className={`markdown-preview ${bg} ${text}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
