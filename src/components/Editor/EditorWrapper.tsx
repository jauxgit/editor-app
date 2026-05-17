import { useEffect, useRef, useCallback } from 'react'
import { EditorState } from '@codemirror/state'
import {
  EditorView, keymap, lineNumbers, highlightActiveLine,
  highlightSpecialChars, drawSelection, rectangularSelection, crosshairCursor,
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { syntaxHighlighting, defaultHighlightStyle, type Language, type LanguageSupport } from '@codemirror/language'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { json } from '@codemirror/lang-json'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { go } from '@codemirror/lang-go'
import { rust } from '@codemirror/lang-rust'
import { php } from '@codemirror/lang-php'
import { sql } from '@codemirror/lang-sql'
import { xml } from '@codemirror/lang-xml'
import { yaml } from '@codemirror/lang-yaml'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { oneDark } from '@codemirror/theme-one-dark'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useEditorStore } from '../../stores/editorStore'
import { imageViewPlugin } from './extensions/imagePlugin'
import { multiCursorKeymap } from './extensions/multiCursor'
import { useImageHandler } from './ImageDropHandler'

interface Props {
  docPath: string
  onScrollChange?: (ratio: number) => void
}

/** 代码块语言映射 — 模块级单例，避免每次渲染重建 */
const codeLanguages: Record<string, LanguageSupport> = {
  javascript: javascript(),
  js: javascript(),
  jsx: javascript({ jsx: true }),
  typescript: javascript({ typescript: true }),
  ts: javascript({ typescript: true }),
  tsx: javascript({ typescript: true, jsx: true }),
  python: python(),
  py: python(),
  json: json(),
  css: css(),
  html: html(),
  // 新增语言
  java: java(),
  cpp: cpp(),
  c: cpp(),
  'c++': cpp(),
  go: go(),
  rust: rust(),
  php: php(),
  sql: sql(),
  xml: xml(),
  yaml: yaml(),
  toml: yaml(),
  // 无专属解析器的语言 — 用近亲代替
  csharp: java(),
  'c#': java(),
  kotlin: java(),
  scala: java(),
  swift: java(),
  bash: javascript(),
  sh: javascript(),
}

function getCodeParser(info: string): Language | null {
  const lang = codeLanguages[info]
  return lang?.language ?? null
}

/**
 * CodeMirror 6 编辑器 React 包装器
 * 每个 Tab 持有一个独立的 EditorView 实例
 */
export function EditorWrapper({ docPath, onScrollChange }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const updateContent = useWorkspaceStore(s => s.updateContent)
  const markClean = useWorkspaceStore(s => s.markClean)
  const root = useWorkspaceStore(s => s.root)
  const tab = useWorkspaceStore(s => s.openTabs.find(t => t.path === docPath))
  const theme = useEditorStore(s => s.theme)

  // 在光标位置插入文本
  const onInsertAtCursor = useCallback((text: string) => {
    const view = viewRef.current
    if (!view) return
    view.dispatch(
      view.state.replaceSelection(text)
    )
    view.focus()
  }, [])

  // 图片拖入/粘贴处理
  useImageHandler({ docPath, containerRef: editorRef, onInsertAtCursor })

  // 初始化 CodeMirror
  useEffect(() => {
    if (!editorRef.current || !tab) return

    if (viewRef.current) {
      viewRef.current.destroy()
    }

    const extensions = [
      lineNumbers(),
      EditorView.lineWrapping,
      highlightActiveLine(),
      highlightSpecialChars(),
      highlightSelectionMatches(),
      drawSelection(),
      rectangularSelection(),
      crosshairCursor(),
      history(),
      closeBrackets(),
      syntaxHighlighting(defaultHighlightStyle),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        ...closeBracketsKeymap,
        indentWithTab,
      ]),
      multiCursorKeymap,
      markdown({
        base: markdownLanguage,
        codeLanguages: getCodeParser,
      }),
      // 图片内联渲染插件
      imageViewPlugin(root),
      ...(theme === 'dark' ? [oneDark] : []),
      EditorView.updateListener.of(update => {
        if (update.docChanged) {
          const content = update.state.doc.toString()
          updateContent(docPath, content)
        }
      }),
    ]

    const state = EditorState.create({
      doc: tab.content,
      extensions,
    })

    const view = new EditorView({
      state,
      parent: editorRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [docPath, theme])

  // 同步外部内容变更到编辑器
  useEffect(() => {
    if (!viewRef.current || !tab) return
    const current = viewRef.current.state.doc.toString()
    if (tab.content !== current && tab.content !== undefined) {
      viewRef.current.dispatch({
        changes: { from: 0, to: current.length, insert: tab.content },
      })
    }
  }, [tab?.content])

  // 注册 Electron 菜单保存事件
  useEffect(() => {
    if (!window.electronAPI || !tab) return
    window.electronAPI.onMenuSave(() => {
      if (viewRef.current) {
        const content = viewRef.current.state.doc.toString()
        updateContent(docPath, content)
        window.electronAPI!.writeFile(docPath, content).then(() => markClean(docPath))
      }
    })
  }, [docPath, tab, updateContent, markClean])

  // Ctrl+S 保存
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (viewRef.current && tab) {
          const content = viewRef.current.state.doc.toString()
          updateContent(docPath, content)
          if (window.electronAPI) {
            window.electronAPI.writeFile(docPath, content).then(() => markClean(docPath))
          }
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [docPath, tab, updateContent, markClean])

  // 滚动位置同步
  useEffect(() => {
    if (!onScrollChange || !editorRef.current) return
    const scroller = editorRef.current.querySelector('.cm-scroller')
    if (!scroller) return
    const handler = () => {
      const max = scroller.scrollHeight - scroller.clientHeight
      if (max > 0) onScrollChange(scroller.scrollTop / max)
    }
    scroller.addEventListener('scroll', handler, { passive: true })
    return () => scroller.removeEventListener('scroll', handler)
  }, [onScrollChange, docPath])

  // 监听图片双击事件
  useEffect(() => {
    const handler = (e: Event) => {
      const { path } = (e as CustomEvent).detail
      // 在 Electron 中，发送到主进程以系统查看器打开
      if (window.electronAPI && path) {
        // 使用 openExternal 之类的 API（此处简化处理）
        console.log('Open image externally:', path)
      }
    }
    window.addEventListener('image:dblclick', handler)
    return () => window.removeEventListener('image:dblclick', handler)
  }, [])

  return (
    <div
      ref={editorRef}
      className="h-full w-full"
      style={{ overflow: 'auto' }}
    />
  )
}
