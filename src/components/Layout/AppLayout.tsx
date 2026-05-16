import { useEffect, useState, useCallback } from 'react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useEditorStore } from '../../stores/editorStore'
import { FileTree } from '../FileTree/FileTree'
import { EditorWrapper } from '../Editor/EditorWrapper'
import { MarkdownPreview } from '../Preview/MarkdownPreview'
import { CommandPalette, useRegisterCommands } from './CommandPalette'

export function AppLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [scrollRatio, setScrollRatio] = useState<number | undefined>(undefined)
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
    // Cmd+O → 打开文件
    if (mod && !e.shiftKey && e.key.toLowerCase() === 'o') {
      e.preventDefault()
      if (window.electronAPI) {
        window.electronAPI.openFileDialog().then(result => {
          if (result) {
            const dir = result.path.replace(/[/\\][^/\\]+$/, '')
            setRoot(dir)
            openFile(result.path, result.content)
          }
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
  }, [setRoot, openFile])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // 监听 Electron 事件
  useEffect(() => {
    if (!window.electronAPI) return

    window.electronAPI.onFileOpened(({ path, content }) => {
      // 设置工作区 root 为文件所在目录
      const dir = path.replace(/[/\\][^/\\]+$/, '')
      setRoot(dir)
      openFile(path, content)
    })

    window.electronAPI.onFolderOpened(({ path }) => {
      setRoot(path)
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

  return (
    <>
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <div className={`h-full flex flex-col ${bg} ${textColor}`}>
        {/* ===== 工具栏 ===== */}
      <div className={`h-10 flex items-center px-3 gap-2 border-b ${borderColor} select-none shrink-0`}>
        {/* 切换文件树 */}
        <button
          onClick={toggleFileTree}
          className={`px-2 py-1 text-xs rounded ${textDim} hover:bg-gray-700/20 transition-colors`}
          title="Toggle File Tree"
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
              {mode === 'source' ? 'Source' : mode === 'preview' ? 'Preview' : 'Split'}
            </button>
          ))}
        </div>

        {/* 工作区路径 */}
        <span className="text-xs opacity-40 ml-2 truncate">
          {root || 'No folder open'}
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
                  <div className={`flex-1 ${viewMode === 'split' ? 'border-r ' + borderColor : ''}`}>
                    <EditorWrapper
                      docPath={activeTabPath!}
                      onScrollChange={viewMode === 'split' ? setScrollRatio : undefined}
                    />
                  </div>
                )}

                {/* 预览面板 */}
                {(viewMode === 'preview' || viewMode === 'split') && (
                  <div className="flex-1">
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
                  <p>Cmd+O Open File &nbsp;|&nbsp; Cmd+Shift+O Open Folder</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== 状态栏 ===== */}
      <div className={`h-7 flex items-center px-3 gap-4 text-xs ${tabBg} border-t ${borderColor} select-none shrink-0 ${textDim}`}>
        <span>
          {activeTab ? `${activeTab?.content?.split('\n').length || 0} lines` : '—'}
        </span>
        <span>{viewMode}</span>
        <span className="ml-auto">UTF-8</span>
        <span>Markdown</span>
      </div>
    </div>
    </>
  )
}
