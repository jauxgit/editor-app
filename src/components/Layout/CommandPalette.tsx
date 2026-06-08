import { useState, useEffect, useRef, useCallback } from 'react'
import { commands, type Command } from '../../lib/commands'
import { usePlugins } from '../../lib/pluginRegistry'
import { useEditorStore } from '../../stores/editorStore'
import { highlightThemes } from '../../lib/highlightThemes'
import { useT } from '../../lib/i18n'
import { useWorkspaceStore, nextUntitledId } from '../../stores/workspaceStore'
import { createNewFile } from '../../lib/commands'
import { editorThemes } from '../../lib/editorThemes'
import { editorFonts } from '../../lib/editorFonts'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const t = useT()

  const results: Command[] = commands.search(query)

  // 开启动画
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [isOpen])

  // 打开时聚焦输入框并重置
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  // 键盘导航
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setIndex(i => Math.min(i + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (results[index]) {
          results[index].action()
          onClose()
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [results, index, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] transition-opacity duration-200"
      style={{
        background: visible ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
        backdropFilter: visible ? 'blur(6px)' : 'blur(0px)',
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden transition-all duration-200"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.97)',
          opacity: visible ? 1 : 0,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: 'var(--accent)', marginRight: 10, flexShrink: 0 }}>
            <line x1="12.5" y1="12.5" x2="15" y2="15" />
            <circle cx="7" cy="7" r="5.5" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setIndex(0) }}
            onKeyDown={handleKeyDown}
            placeholder={t('cmdPalette.placeholder')}
            className="flex-1 outline-none text-sm bg-transparent"
            style={{ color: 'var(--text-primary)' }}
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setIndex(0) }}
              className="flex items-center justify-center w-5 h-5 rounded text-xs transition-colors"
              style={{ color: 'var(--text-dim)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="2" y1="2" x2="8" y2="8" /><line x1="8" y1="2" x2="2" y2="8" />
              </svg>
            </button>
          )}
        </div>

        {/* Results list */}
        <div className="max-h-72 overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
              {t('cmdPalette.noResults')}
            </div>
          ) : (
            results.map((cmd, i) => (
              <div
                key={cmd.id}
                onClick={() => { cmd.action(); onClose() }}
                onMouseEnter={() => setIndex(i)}
                className="flex items-center justify-between px-4 py-2 cursor-pointer text-sm transition-colors duration-75"
                style={{
                  background: i === index ? 'var(--accent-muted)' : 'transparent',
                  color: i === index ? 'var(--accent)' : 'var(--text-primary)',
                }}
              >
                <span>{cmd.label}</span>
                {cmd.category && (
                  <span
                    className="text-xs ml-4 shrink-0"
                    style={{ color: i === index ? 'var(--accent)' : 'var(--text-dim)', opacity: i === index ? 0.8 : 1 }}
                  >
                    {cmd.category}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div
          className="flex items-center gap-4 px-4 py-2 border-t text-xs"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)', background: 'var(--bg-surface)' }}
        >
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>↑↓</kbd>
            {t('cmdPalette.navigate')}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>↵</kbd>
            {t('cmdPalette.execute')}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>Esc</kbd>
            {t('cmdPalette.close')}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * 注册所有可用命令
 */
export function useRegisterCommands() {
  const setViewMode = useEditorStore(s => s.setViewMode)
  const toggleFileTree = useEditorStore(s => s.toggleFileTree)
  const setTheme = useEditorStore(s => s.setTheme)
  const setHighlightTheme = useEditorStore(s => s.setHighlightTheme)
  const setFont = useEditorStore(s => s.setFont)
  const setLanguage = useEditorStore(s => s.setLanguage)
  const language = useEditorStore(s => s.language)
  const t = useT()
  const registry = usePlugins()
  const root = useWorkspaceStore(s => s.root)
  const openFile = useWorkspaceStore(s => s.openFile)

  useEffect(() => {
    commands.clear()
    commands.registerAll([
      { id: 'plugins.manager', label: t('cmd.plugins.manager'), category: 'Plugins', action: () => {
        window.dispatchEvent(new CustomEvent('open-plugin-manager'))
      }},
      { id: 'file.new', label: t('cmd.file.new'), category: t('cmd.category.file'), action: async () => {
        const store = useWorkspaceStore.getState()
        if (store.root) {
          const path = await createNewFile(store.root)
          if (path) { store.openFile(path, ''); store.triggerRefresh() }
        } else {
          store.openUntitled(nextUntitledId())
        }
      }},
      { id: 'view.source', label: t('cmd.view.source'), category: t('cmd.category.view'), action: () => setViewMode('source') },
      { id: 'view.preview', label: t('cmd.view.preview'), category: t('cmd.category.view'), action: () => setViewMode('preview') },
      { id: 'view.split', label: t('cmd.view.split'), category: t('cmd.category.view'), action: () => setViewMode('split') },
      { id: 'view.toggle-file-tree', label: t('cmd.view.toggleFileTree'), category: t('cmd.category.view'), action: toggleFileTree },
      // 编辑器主题：每个主题一条命令
      ...editorThemes.map(et => ({
        id: `theme.editor.${et.id}`,
        label: t(`editorTheme.${et.id}`),
        category: t('cmd.category.editorTheme'),
        action: () => setTheme(et.id),
      })),
      // 编辑器字体：每个预设一条命令
      ...editorFonts.map(f => ({
        id: `font.${f.id}`,
        label: t(`editorFont.${f.id}`),
        category: t('cmd.category.font'),
        action: () => setFont(f.id),
      })),
      { id: 'file.open', label: t('cmd.file.open'), category: t('cmd.category.file'), action: () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'o', ctrlKey: true, metaKey: true }))
      }},
      { id: 'file.open-folder', label: t('cmd.file.openFolder'), category: t('cmd.category.file'), action: () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'o', shiftKey: true, ctrlKey: true, metaKey: true }))
      }},
      { id: 'file.save', label: t('cmd.file.save'), category: t('cmd.category.file'), action: () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, metaKey: true }))
      }},
      ...highlightThemes.map(theme => ({
        id: `theme.highlight.${theme.id}`,
        label: `${t('cmd.category.highlight')}: ${t(`theme.${theme.id}`)}`,
        category: t('cmd.category.highlight'),
        action: () => setHighlightTheme(theme.id),
      })),
      { id: 'language.en', label: `${t('cmd.category.language')}: ${t('language.en')}`, category: t('cmd.category.language'), action: () => setLanguage('en') },
      { id: 'language.zh', label: `${t('cmd.category.language')}: ${t('language.zh')}`, category: t('cmd.category.language'), action: () => setLanguage('zh') },
      // 插件命令
      ...registry.getAllCommands(),
    ])
  }, [setViewMode, toggleFileTree, setTheme, setHighlightTheme, setFont, setLanguage, language, t, registry.version])
}
