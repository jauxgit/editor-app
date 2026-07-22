import { useEffect, useRef, useState } from 'react'
import type { EditorView } from '@codemirror/view'

interface Props {
  view: EditorView
  /** 工具栏在编辑器容器中的 top/left 位置 */
  top: number
  left: number
  onClose: () => void
}

type FormatAction = (view: EditorView) => void

interface FormatButton {
  label: string
  title: string
  action: FormatAction
}

/** 在选中文本前后包裹指定字符串 */
function wrapSelection(view: EditorView, before: string, after: string) {
  const { from, to } = view.state.selection.main
  const text = view.state.sliceDoc(from, to)
  view.dispatch({
    changes: { from, to, insert: before + text + after },
    selection: { anchor: from + before.length, head: from + before.length + text.length },
  })
  view.focus()
}

/** 在每行前加前缀 */
function prefixLines(view: EditorView, prefix: string) {
  const { from, to } = view.state.selection.main
  const text = view.state.sliceDoc(from, to)
  const lines = text.split('\n')
  const newText = lines.map((l) => prefix + l).join('\n')
  view.dispatch({
    changes: { from, to, insert: newText },
    selection: { anchor: from, head: from + newText.length },
  })
  view.focus()
}

/** 在当前行/选中区域前插入 heading */
function insertHeading(view: EditorView) {
  const { from, to } = view.state.selection.main
  const line = view.state.doc.lineAt(from)
  const text = view.state.sliceDoc(line.from, line.to)
  // 检测当前 heading 级别并递增/重置
  const match = text.match(/^(#{1,6})\s/)
  if (match) {
    const level = match[1].length
    if (level >= 6) {
      // 已到最大，移除 heading
      const newText = text.replace(/^#{1,6}\s/, '')
      view.dispatch({
        changes: { from: line.from, to: line.to, insert: newText },
        selection: { anchor: line.from },
      })
    } else {
      const newText = text.replace(/^(#+)\s/, '#'.repeat(level + 1) + ' ')
      view.dispatch({
        changes: { from: line.from, to: line.to, insert: newText },
        selection: { anchor: line.from },
      })
    }
  } else {
    view.dispatch({
      changes: { from: line.from, insert: '### ' },
      selection: { anchor: line.from },
    })
  }
  view.focus()
}

/** 插入链接 */
function insertLink(view: EditorView) {
  const { from, to } = view.state.selection.main
  const text = view.state.sliceDoc(from, to)
  const url = window.prompt('Enter URL:', 'https://')
  if (!url) return
  const markdown = text ? `[${text}](${url})` : `[${url}](${url})`
  view.dispatch({
    changes: { from, to, insert: markdown },
    selection: { anchor: from, head: from + markdown.length },
  })
  view.focus()
}

const buttons: FormatButton[] = [
  { label: 'B', title: 'Bold (Ctrl+B)', action: (v) => wrapSelection(v, '**', '**') },
  { label: 'I', title: 'Italic (Ctrl+I)', action: (v) => wrapSelection(v, '*', '*') },
  { label: '`', title: 'Inline Code', action: (v) => wrapSelection(v, '`', '`') },
  { label: '🔗', title: 'Link', action: insertLink },
  { label: '#', title: 'Heading (cycle)', action: insertHeading },
  { label: '•', title: 'Unordered List', action: (v) => prefixLines(v, '- ') },
  { label: '1.', title: 'Ordered List', action: (v) => prefixLines(v, '1. ') },
  { label: '☐', title: 'Task List', action: (v) => prefixLines(v, '- [ ] ') },
  { label: '❝', title: 'Blockquote', action: (v) => prefixLines(v, '> ') },
  { label: '—', title: 'Horizontal Rule', action: (v) => {
    const { from } = v.state.selection.main
    v.dispatch({
      changes: { from, insert: '\n---\n' },
      selection: { anchor: from + 5 },
    })
    v.focus()
  }},
]

export function FormatToolbar({ view, top, left, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    requestAnimationFrame(() => document.addEventListener('mousedown', handler))
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // ESC 关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // 防止超出屏幕右侧
  const adjustedLeft = Math.min(left, window.innerWidth - 400)

  return (
    <div
      ref={ref}
      className="fixed z-[100] flex items-center gap-0.5 px-1.5 py-1 rounded-xl border transition-all duration-150"
      style={{
        top: Math.max(top - 44, 4),
        left: adjustedLeft,
        background: 'var(--bg-elevated)',
        borderColor: 'var(--border)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.1)',
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-4px)',
        opacity: visible ? 1 : 0,
        transformOrigin: 'bottom left',
      }}
    >
      {buttons.map((btn) => (
        <button
          key={btn.label}
          title={btn.title}
          onMouseDown={(e) => { e.preventDefault(); btn.action(view); onClose() }}
          className="flex items-center justify-center w-7 h-7 rounded-md text-xs font-medium transition-colors duration-75"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent)';
            e.currentTarget.style.color = 'var(--accent-contrast)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          {btn.label}
        </button>
      ))}
    </div>
  )
}
