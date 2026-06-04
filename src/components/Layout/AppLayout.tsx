import { useEffect, useState, useCallback, useRef } from 'react'
import { useWorkspaceStore, nextUntitledId } from '../../stores/workspaceStore'
import { createNewFile } from '../../lib/commands'
import { useEditorStore } from '../../stores/editorStore'
import { useT } from '../../lib/i18n'
import { FileTree } from '../FileTree/FileTree'
import { EditorWrapper } from '../Editor/EditorWrapper'
import { MarkdownPreview } from '../Preview/MarkdownPreview'
import { CommandPalette, useRegisterCommands } from './CommandPalette'
import { PluginManager } from '../Settings/PluginManager'
import { MenuBar } from './MenuBar'
import { getTheme, editorThemes } from '../../lib/editorThemes'

export function AppLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [pluginManagerOpen, setPluginManagerOpen] = useState(false)
  const [scrollRatio, setScrollRatio] = useState<number | undefined>(undefined)
  const t = useT()
  const tRef = useRef(t)
  tRef.current = t
  const [isDragOver, setIsDragOver] = useState(false)
  const tabs = useWorkspaceStore(s => s.openTabs)
  const activeTabPath = useWorkspaceStore(s => s.activeTabPath)
  const setActiveTab = useWorkspaceStore(s => s.setActiveTab)
  const closeTab = useWorkspaceStore(s => s.closeTab)
  const openFile = useWorkspaceStore(s => s.openFile)
  const setRoot = useWorkspaceStore(s => s.setRoot)
  const root = useWorkspaceStore(s => s.root)

  const viewMode = useEditorStore(s => s.viewMode)
  const setViewMode = useEditorStore(s => s.setViewMode)
  const showFileTree = useEditorStore(s => s.showFileTree)
  const toggleFileTree = useEditorStore(s => s.toggleFileTree)
  const theme = useEditorStore(s => s.theme)
  const cycleTheme = useEditorStore(s => s.cycleTheme)
  const themeDef = getTheme(theme) || editorThemes[0]

  const activeTab = tabs.find(t => t.path === activeTabPath)
  const sidebarWidth = showFileTree ? '260px' : '0px'

  // 注册命令面板命令
  useRegisterCommands()

  // 启动时检查是否有启动参数（从 Explorer 双击打开），否则恢复上次记录
  useEffect(() => {
    const store = useEditorStore.getState()
    const ws = useWorkspaceStore.getState()

    ;(async () => {
      // 优先处理启动参数（从 Explorer 双击打开的文件/文件夹）
      const args = window.electronAPI ? await window.electronAPI.getStartupArgs() : []
      if (args.length > 0) {
        for (const arg of args) {
          if (arg.type === 'file') {
            ws.openFile(arg.path, arg.content || '')
          } else if (arg.type === 'folder') {
            ws.setRoot(arg.path)
          }
        }
        return
      }

      // 无启动参数时恢复上次记录
      if (store.lastRootPath) {
        ws.setRoot(store.lastRootPath)
      }

      const lastPath = store.lastFilePath
      if (lastPath && window.electronAPI) {
        window.electronAPI.readFile(lastPath).then(({ content }) => {
          ws.openFile(lastPath, content)
        }).catch(() => {
          useEditorStore.getState().setLastFilePath(null)
        })
      }
    })()
  }, [])

  // 应用主题 CSS 变量
  useEffect(() => {
    const def = getTheme(theme) || editorThemes[0]
    const root = document.documentElement
    for (const [key, val] of Object.entries(def.vars)) {
      root.style.setProperty(key, val)
    }
  }, [theme])

  // 全局快捷键（绕过 CodeMirror 的按键拦截）
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey
    // Cmd+Shift+P → 命令面板
    if (mod && e.shiftKey && e.key.toLowerCase() === 'p') {
      e.preventDefault()
      setPaletteOpen(o => !o)
      return
    }
    // Cmd+O → 打开文件（不影响文件树，仅新增标签页）
    if (mod && !e.shiftKey && e.key.toLowerCase() === 'o') {
      e.preventDefault()
      if (window.electronAPI) {
        window.electronAPI.openFileDialog().then(result => {
          if (result) openFile(result.path, result.content)
        })
      }
      return
    }
    // Cmd+Shift+O → 打开文件夹
    if (mod && e.shiftKey && e.key.toLowerCase() === 'o') {
      e.preventDefault()
      if (window.electronAPI) {
        window.electronAPI.openFolderDialog().then(result => {
          if (result) setRoot(result.path)
        })
      }
      return
    }
    // Cmd+N → 新建文件
    if (mod && !e.shiftKey && e.key.toLowerCase() === 'n') {
      e.preventDefault()
      const store = useWorkspaceStore.getState()
      if (store.root) {
        createNewFile(store.root).then(path => {
          if (path) { store.openFile(path, ''); store.triggerRefresh() }
        })
      } else {
        const id = nextUntitledId()
        store.openUntitled(id)
      }
      return
    }
  }, [setRoot, openFile])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // 命令面板/插件管理弹窗的自定义事件
  useEffect(() => {
    const handler = () => setPluginManagerOpen(true)
    window.addEventListener('open-plugin-manager', handler)
    return () => window.removeEventListener('open-plugin-manager', handler)
  }, [])

  // 拖拽文件/文件夹到窗口
  useEffect(() => {
    const api = window.electronAPI
    if (!api) return

    let dragLeaveTimer: ReturnType<typeof setTimeout> | null = null

    const onDragOver = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
      if (dragLeaveTimer) clearTimeout(dragLeaveTimer)
      setIsDragOver(true)
    }

    const onDragLeave = (e: DragEvent) => {
      // 只在真正离开 document 时隐藏提示
      if (e.relatedTarget === null || e.relatedTarget === document) {
        dragLeaveTimer = setTimeout(() => setIsDragOver(false), 100)
      }
    }

    const onDrop = async (e: DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (dragLeaveTimer) clearTimeout(dragLeaveTimer)

      const items = e.dataTransfer?.items
      if (!items) return

      const filePaths: string[] = []
      const dirPaths: string[] = []

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.kind !== 'file') continue
        const entry = item.webkitGetAsEntry()
        if (!entry) continue

        if (entry.isFile) {
          const file = item.getAsFile()
          if (file) {
            const p = (file as unknown as { path: string }).path
            if (p) filePaths.push(p)
          }
        } else if (entry.isDirectory) {
          // 从子文件路径推断目录路径
          const dirName = entry.name
          const files = e.dataTransfer?.files
          if (files) {
            for (let j = 0; j < files.length; j++) {
              const fp = (files[j] as unknown as { path?: string }).path
              if (fp) {
                const sep = fp.includes('\\') ? '\\' : '/'
                const needle = sep + dirName + sep
                const idx = fp.indexOf(needle)
                if (idx !== -1) {
                  dirPaths.push(fp.substring(0, idx + dirName.length + 1).replace(/[\\/]$/, ''))
                  break
                }
              }
            }
          }
        }
      }

      // 检查拖放目标是否在编辑器区域内（图片由 ImageDropHandler 处理）
      const editorEl = (e.target as HTMLElement)?.closest('.cm-editor')

      // 处理文件
      for (const p of filePaths) {
        if (editorEl) {
          const ext = p.split('.').pop()?.toLowerCase()
          if (ext && ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
            continue // 编辑器内的图片由 ImageDropHandler 处理
          }
        }
        try {
          const result = await api.readFile(p)
          if (result) openFile(result.path, result.content)
        } catch {
          // 无法读取的文件跳过
        }
      }

      // 处理文件夹
      for (const dir of dirPaths) {
        const msg = tRef.current('drag.trust.message', { folder: dir })
        const title = tRef.current('drag.trust.title')
        try {
          const trusted = await api.showConfirmDialog(msg, title)
          if (trusted) setRoot(dir)
        } catch {
          // 对话框被关闭或出错时跳过
        }
      }
    }

    document.addEventListener('dragover', onDragOver)
    document.addEventListener('dragleave', onDragLeave)
    document.addEventListener('drop', onDrop)

    return () => {
      document.removeEventListener('dragover', onDragOver)
      document.removeEventListener('dragleave', onDragLeave)
      document.removeEventListener('drop', onDrop)
      if (dragLeaveTimer) clearTimeout(dragLeaveTimer)
    }
  }, [openFile, setRoot])

  // 监听 Electron 事件
  useEffect(() => {
    if (!window.electronAPI) return

    window.electronAPI.onFileOpened(({ path, content }) => {
      openFile(path, content)
    })

    window.electronAPI.onFolderOpened(async ({ path }) => {
      const msg = tRef.current('drag.trust.message', { folder: path })
      const title = tRef.current('drag.trust.title')
      const trusted = await window.electronAPI!.showConfirmDialog(msg, title)
      if (trusted) setRoot(path)
    })

    window.electronAPI.onMenuSave(() => {
      // 在 EditorWrapper 中处理
    })
  }, [openFile, setRoot])

  const lineCount = activeTab?.content?.split('\n').length || 0

  const viewModeLabels: Record<string, string> = {
    source: t('toolbar.source'),
    preview: t('toolbar.preview'),
    split: t('toolbar.split'),
  }

  return (
    <>
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <PluginManager isOpen={pluginManagerOpen} onClose={() => setPluginManagerOpen(false)} />
      {isDragOver && (
        <div className="fixed inset-0 z-50 pointer-events-none ring-2 ring-[var(--accent)] ring-inset drag-over-overlay" />
      )}
      <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        {/* ===== Menu Bar ===== */}
        <MenuBar onOpenPalette={() => setPaletteOpen(true)} onOpenPluginManager={() => setPluginManagerOpen(true)} />

        {/* ===== Toolbar ===== */}
        <div className="flex items-center h-9 px-3 gap-2 border-b shrink-0 select-none" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)' }}>
          {/* Toggle file tree */}
          <button
            onClick={toggleFileTree}
            className="flex items-center justify-center w-7 h-7 rounded text-xs transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            title={t('toolbar.toggleFileTree')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {showFileTree
                ? <><rect x="2" y="3" width="12" height="10" rx="1.5" /><line x1="6" y1="7" x2="10" y2="7" /></>
                : <><rect x="2" y="3" width="12" height="10" rx="1.5" /><line x1="6" y1="7" x2="10" y2="7" /><line x1="8" y1="5" x2="8" y2="9" /></>
              }
            </svg>
          </button>

          <div className="w-px h-4" style={{ background: 'var(--border)' }} />

          {/* View mode segmented control */}
          <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-base)' }}>
            {(['source', 'preview', 'split'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs transition-all duration-150"
                style={{
                  color: viewMode === mode ? 'var(--accent)' : 'var(--text-dim)',
                  background: viewMode === mode ? 'var(--accent-muted)' : 'transparent',
                  fontWeight: viewMode === mode ? 500 : 400,
                }}
              >
                {mode === 'source' && (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4,5 1,8 4,11" /><polyline points="12,5 15,8 12,11" /><line x1="9" y1="4" x2="7" y2="12" />
                  </svg>
                )}
                {mode === 'preview' && (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="12" height="10" rx="1.5" /><circle cx="8" cy="8" r="2" />
                  </svg>
                )}
                {mode === 'split' && (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="5.5" height="10" rx="1" /><rect x="8.5" y="3" width="5.5" height="10" rx="1" />
                  </svg>
                )}
                {viewModeLabels[mode]}
              </button>
            ))}
          </div>

          <div className="w-px h-4" style={{ borderColor: 'var(--border)' }} />

          {/* Workspace path */}
          <span className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>
            {root || t('toolbar.noFolderOpen')}
          </span>

          <div className="ml-auto flex items-center gap-2">
            {/* Theme toggle — cycles through available themes */}
            <button
              onClick={cycleTheme}
              className="flex items-center justify-center w-7 h-7 rounded text-xs transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              title={`${themeDef.name} — click to cycle`}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={themeDef.iconColor} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <path d={themeDef.iconPath} />
              </svg>
            </button>
          </div>
        </div>

        {/* ===== Main content area ===== */}
        <div className="flex flex-1 overflow-hidden">
          {/* File Tree */}
          <div
            className="shrink-0 border-r overflow-hidden transition-all duration-200"
            style={{ width: sidebarWidth, borderColor: 'var(--border)' }}
          >
            {showFileTree && <FileTree />}
          </div>

          {/* Editor area */}
          <div className="flex-1 flex flex-col min-w-0" style={{ background: 'var(--bg-base)' }}>
            {/* Tab bar */}
            {tabs.length > 0 && (
              <div className="flex items-center h-9 border-b shrink-0 overflow-x-auto" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                {tabs.map(tab => {
                  const isActive = tab.path === activeTabPath
                  return (
                    <div
                      key={tab.path}
                      onClick={() => setActiveTab(tab.path)}
                      className="group relative flex items-center gap-1.5 h-full px-3 text-xs cursor-pointer select-none shrink-0 transition-colors duration-150"
                      style={{
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        background: isActive ? 'var(--bg-base)' : 'transparent',
                        borderRight: '1px solid var(--border)',
                        fontWeight: isActive ? 500 : 400,
                      }}
                    >
                      {/* Active tab indicator */}
                      {isActive && (
                        <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: 'var(--accent)' }} />
                      )}
                      {/* Dirty indicator */}
                      {tab.isDirty && (
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--accent)' }} />
                      )}
                      <span className="truncate max-w-36">{tab.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); closeTab(tab.path) }}
                        className="flex items-center justify-center w-4 h-4 rounded opacity-0 group-hover:opacity-100 transition-all text-xs leading-none hover:rotate-90"
                        style={{ color: 'var(--text-dim)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <line x1="2" y1="2" x2="8" y2="8" /><line x1="8" y1="2" x2="2" y2="8" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Editor / Preview */}
            <div className="flex-1 flex overflow-hidden">
              {activeTab ? (
                <>
                  {/* Source editor */}
                  {(viewMode === 'source' || viewMode === 'split') && (
                    <div className="flex-1 min-w-0" style={viewMode === 'split' ? { borderRight: '1px solid var(--border)' } : undefined}>
                      <EditorWrapper
                        docPath={activeTabPath!}
                        onScrollChange={viewMode === 'split' ? setScrollRatio : undefined}
                      />
                    </div>
                  )}

                  {/* Preview panel */}
                  {(viewMode === 'preview' || viewMode === 'split') && (
                    <div className="flex-1 min-w-0">
                      <MarkdownPreview
                        content={activeTab?.content || ''}
                        scrollRatio={viewMode === 'split' ? scrollRatio : undefined}
                        onScrollChange={viewMode === 'split' ? setScrollRatio : undefined}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center select-none">
                  <div className="text-center max-w-md">
                    <div className="mb-4 flex justify-center">
                      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                        <path d="M14 6H8a2 2 0 0 0-2 2v32a2 2 0 0 0 2 2h32a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-6" />
                        <polyline points="14,6 14,12 24,12 34,12 34,6" />
                        <line x1="16" y1="22" x2="32" y2="22" />
                        <line x1="16" y1="28" x2="28" y2="28" />
                        <line x1="16" y1="34" x2="24" y2="34" />
                      </svg>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-dim)' }}>{t('empty.hint')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== Status Bar ===== */}
        <div
          className="flex items-center h-7 px-3 gap-4 text-xs border-t select-none shrink-0"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.6">
              <rect x="2" y="3" width="12" height="10" rx="1" />
              <line x1="2" y1="8" x2="14" y2="8" />
              <line x1="8" y1="3" x2="8" y2="13" />
            </svg>
            {activeTab ? t('status.lines', { n: lineCount }) : t('status.noFile')}
          </span>
          <span>{viewModeLabels[viewMode]}</span>
          <span className="ml-auto">{t('status.utf8')}</span>
          <span>{t('status.markdown')}</span>
        </div>
      </div>
    </>
  )
}
