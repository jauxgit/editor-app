import { useEffect, useState, useCallback, useRef } from 'react'
import { useWorkspaceStore, nextUntitledId } from '../../stores/workspaceStore'
import { createNewFile } from '../../lib/commands'
import { useEditorStore } from '../../stores/editorStore'
import { useT } from '../../lib/i18n'
import { FileTree } from '../FileTree/FileTree'
import { EditorWrapper } from '../Editor/EditorWrapper'
import { MarkdownPreview } from '../Preview/MarkdownPreview'
import { CommandPalette, useRegisterCommands } from './CommandPalette'
import { MenuBar } from './MenuBar'

export function AppLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false)
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
  const toggleTheme = useEditorStore(s => s.toggleTheme)

  const activeTab = tabs.find(t => t.path === activeTabPath)
  const sidebarWidth = showFileTree ? '260px' : '0px'

  // 注册命令面板命令
  useRegisterCommands()

  // 启动时恢复左侧目录 + 最近打开的文件
  useEffect(() => {
    const store = useEditorStore.getState()
    const ws = useWorkspaceStore.getState()

    // 先恢复左侧文件树目录
    if (store.lastRootPath) {
      ws.setRoot(store.lastRootPath)
    }

    // 再恢复最近打开的文件
    const lastPath = store.lastFilePath
    if (lastPath && window.electronAPI) {
      window.electronAPI.readFile(lastPath).then(({ content }) => {
        ws.openFile(lastPath, content)
      }).catch(() => {
        // 文件已被删除，清除记录
        useEditorStore.getState().setLastFilePath(null)
      })
    }
  }, [])

  // 主题 class 切换
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
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

  // 主题颜色
  const bg = theme === 'dark' ? 'bg-gray-950' : 'bg-white'
  const borderColor = theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
  const tabBg = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
  const tabActive = theme === 'dark' ? 'bg-gray-950' : 'bg-white'
  const textDim = theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
  const textColor = theme === 'dark' ? 'text-gray-200' : 'text-gray-800'

  const viewModeLabels: Record<string, string> = {
    source: t('toolbar.source'),
    preview: t('toolbar.preview'),
    split: t('toolbar.split'),
  }

  const lineCount = activeTab?.content?.split('\n').length || 0

  return (
    <>
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
      {isDragOver && (
        <div className="fixed inset-0 z-50 pointer-events-none ring-2 ring-indigo-500 ring-inset drag-over-overlay" />
      )}
      <div className={`h-full flex flex-col ${bg} ${textColor}`}>
        {/* ===== 菜单栏 ===== */}
        <MenuBar onOpenPalette={() => setPaletteOpen(true)} />

        {/* ===== 工具栏 ===== */}
      <div className={`h-10 flex items-center px-3 gap-2 border-b ${borderColor} select-none shrink-0`}>
        {/* 切换文件树 */}
        <button
          onClick={toggleFileTree}
          className={`px-2 py-1 text-xs rounded ${textDim} hover:bg-gray-700/20 transition-colors`}
          title={t('toolbar.toggleFileTree')}
        >
          {showFileTree ? '◧' : '◨'}
        </button>

        {/* 视图模式 */}
        <div className="flex rounded overflow-hidden border border-gray-600/30">
          {(['source', 'preview', 'split'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2 py-0.5 text-xs transition-colors ${
                viewMode === mode
                  ? 'bg-indigo-600 text-white'
                  : `${textDim} hover:bg-gray-700/20`
              }`}
            >
              {viewModeLabels[mode]}
            </button>
          ))}
        </div>

        {/* 工作区路径 */}
        <span className="text-xs opacity-40 ml-2 truncate">
          {root || t('toolbar.noFolderOpen')}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {/* 主题切换 */}
          <button
            onClick={toggleTheme}
            className={`px-2 py-1 text-xs rounded ${textDim} hover:bg-gray-700/20`}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </div>

      {/* ===== 主体区域 ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* 文件树 */}
        <div
          className={`shrink-0 border-r ${borderColor} overflow-hidden transition-all duration-200`}
          style={{ width: sidebarWidth }}
        >
          {showFileTree && <FileTree />}
        </div>

        {/* 编辑区 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab 栏 */}
          {tabs.length > 0 && (
            <div className={`h-9 flex items-center ${tabBg} border-b ${borderColor} shrink-0 overflow-x-auto`}>
              {tabs.map(tab => (
                <div
                  key={tab.path}
                  onClick={() => setActiveTab(tab.path)}
                  className={`group flex items-center gap-1.5 h-full px-3 text-xs cursor-pointer border-r ${borderColor} select-none shrink-0 transition-colors ${
                    tab.path === activeTabPath
                      ? `${tabActive} border-b-2 border-b-indigo-500 font-medium`
                      : `${textDim} hover:bg-gray-700/10`
                  }`}
                >
                  <span className="truncate max-w-40">
                    {tab.isDirty ? '● ' : ''}{tab.name}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); closeTab(tab.path) }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all text-base leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 编辑器 / 预览 */}
          <div className="flex-1 flex overflow-hidden">
            {activeTab ? (
              <>
                {/* 源码编辑器 */}
                {(viewMode === 'source' || viewMode === 'split') && (
                  <div className={`flex-1 min-w-0 ${viewMode === 'split' ? 'border-r ' + borderColor : ''}`}>
                    <EditorWrapper
                      docPath={activeTabPath!}
                      onScrollChange={viewMode === 'split' ? setScrollRatio : undefined}
                    />
                  </div>
                )}

                {/* 预览面板 */}
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
              <div className="flex-1 flex items-center justify-center opacity-30 text-sm select-none">
                <div className="text-center">
                  <div className="text-4xl mb-4">📝</div>
                  <p>{t('empty.hint')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== 状态栏 ===== */}
      <div className={`h-7 flex items-center px-3 gap-4 text-xs ${tabBg} border-t ${borderColor} select-none shrink-0 ${textDim}`}>
        <span>
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
