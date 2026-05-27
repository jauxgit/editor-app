import { useEffect, useState, useCallback, useRef } from 'react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useEditorStore } from '../../stores/editorStore'
import { useT } from '../../lib/i18n'
import { createNewFile } from '../../lib/commands'
import { ContextMenu, type ContextMenuItem } from '../ContextMenu/index'
import type { FileEntry } from '../../types/electron'

interface TreeNodeProps {
  entry: FileEntry
  depth: number
  onClick: (entry: FileEntry) => void
  onExpand: (entry: FileEntry) => void
  onAddFile: (entry: FileEntry) => void
  onRename: (entry: FileEntry, newName: string) => Promise<boolean>
  onContextMenu: (e: React.MouseEvent, entry: FileEntry) => void
  isRenaming: boolean
  onRenameTriggered: () => void
  activeTabPath: string | null
  theme: 'dark' | 'light'
  expandedDirs: Set<string>
  childrenMap: Record<string, FileEntry[]>
  loadingDirs: Set<string>
}

function TreeNode({ entry, depth, onClick, onExpand, onAddFile, onRename, onContextMenu, isRenaming, onRenameTriggered, activeTabPath, theme, expandedDirs, childrenMap, loadingDirs }: TreeNodeProps) {
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const isMd = (name: string) => /\.(md|markdown|txt)$/i.test(name)
  const isExpanded = expandedDirs.has(entry.path)
  const isLoading = loadingDirs.has(entry.path)
  const children = childrenMap[entry.path]

  const bg = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
  const text = theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
  const activeBg = theme === 'dark' ? 'bg-gray-700' : 'bg-white'
  const hoverBg = theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
  const accentText = theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'
  const accentHover = theme === 'dark' ? 'hover:text-indigo-300' : 'hover:text-indigo-700'
  const inputBorder = theme === 'dark' ? 'border-gray-600' : 'border-gray-400'
  const inputBg = theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'

  const paddingLeft = 12 + depth * 16

  // 外部触发重命名（右键菜单）
  useEffect(() => {
    if (isRenaming && !renaming) {
      startRename()
    }
  }, [isRenaming])

  const startRename = () => {
    const dot = entry.name.lastIndexOf('.')
    const base = dot > 0 ? entry.name.slice(0, dot) : entry.name
    setRenameValue(base)
    setRenaming(true)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }

  const confirmRename = async () => {
    if (!renaming) return
    setRenaming(false)
    onRenameTriggered()
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === entry.name) return

    const dot = entry.name.lastIndexOf('.')
    const ext = (!entry.isDirectory && dot > 0) ? entry.name.slice(dot) : ''
    const newName = ext ? trimmed + ext : trimmed

    await onRename(entry, newName)
  }

  const cancelRename = () => {
    setRenaming(false)
    onRenameTriggered()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      confirmRename()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelRename()
    }
  }

  const handleRowClick = () => {
    if (renaming) return
    if (entry.isDirectory) {
      onExpand(entry)
    } else {
      onClick(entry)
    }
  }

  return (
    <>
      <div
        className={`group flex items-center gap-2 pr-3 py-1.5 cursor-pointer ${hoverBg} transition-colors select-none ${
          activeTabPath === entry.path ? activeBg : ''
        } ${!entry.isDirectory && !isMd(entry.name) ? 'opacity-50' : ''} ${bg} ${text}`}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onDoubleClick={entry.isDirectory ? undefined : startRename}
        onClick={handleRowClick}
        onContextMenu={e => onContextMenu(e, entry)}
      >
        {/* 展开/折叠指示器 */}
        <span className="text-xs shrink-0 w-4 text-center">
          {entry.isDirectory && (isLoading ? '⏳' : isExpanded ? '▾' : '▸')}
        </span>
        <span className="text-sm shrink-0">
          {entry.isDirectory ? (isExpanded ? '📂' : '📁') : '📝'}
        </span>

        {/* 名称或重命名输入框 */}
        {renaming ? (
          <input
            ref={inputRef}
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={confirmRename}
            className={`flex-1 min-w-0 px-1 py-0 text-xs border rounded outline-none ${inputBorder} ${inputBg}`}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="truncate flex-1 min-w-0">{entry.name}</span>
        )}

        {/* 文件夹悬停时显示 + 按钮 */}
        {entry.isDirectory && !renaming && (
          <span
            className={`ml-auto text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-default ${accentText} ${accentHover}`}
            onClick={e => { e.stopPropagation(); onAddFile(entry) }}
            title="New File"
          >
            +
          </span>
        )}
      </div>
      {/* 子节点 */}
      {entry.isDirectory && isExpanded && children && (
        children.map(child => (
          <TreeNode
            key={child.path}
            entry={child}
            depth={depth + 1}
            onClick={onClick}
            onExpand={onExpand}
            onAddFile={onAddFile}
            onRename={onRename}
            onContextMenu={onContextMenu}
            isRenaming={isRenaming}
            onRenameTriggered={onRenameTriggered}
            activeTabPath={activeTabPath}
            theme={theme}
            expandedDirs={expandedDirs}
            childrenMap={childrenMap}
            loadingDirs={loadingDirs}
          />
        ))
      )}
    </>
  )
}

export function FileTree() {
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [childrenMap, setChildrenMap] = useState<Record<string, FileEntry[]>>({})
  const [loadingDirs, setLoadingDirs] = useState<Set<string>>(new Set())
  const root = useWorkspaceStore(s => s.root)
  const refreshSignal = useWorkspaceStore(s => s.refreshSignal)
  const openFile = useWorkspaceStore(s => s.openFile)
  const activeTabPath = useWorkspaceStore(s => s.activeTabPath)
  const theme = useEditorStore(s => s.theme)
  const t = useT()

  // 加载根目录（root 或 refreshSignal 变化时重载）
  useEffect(() => {
    if (!root || !window.electronAPI) return
    setExpandedDirs(new Set())
    setChildrenMap({})
    window.electronAPI.listDir(root).then(setEntries).catch(() => setEntries([]))
  }, [root, refreshSignal])

  const handleExpand = useCallback(async (entry: FileEntry) => {
    if (!entry.isDirectory || !window.electronAPI) return

    if (expandedDirs.has(entry.path)) {
      setExpandedDirs(prev => {
        const next = new Set(prev)
        next.delete(entry.path)
        return next
      })
      return
    }

    if (childrenMap[entry.path]) {
      setExpandedDirs(prev => new Set(prev).add(entry.path))
      return
    }

    setLoadingDirs(prev => new Set(prev).add(entry.path))
    try {
      const children = await window.electronAPI!.listDir(entry.path)
      setChildrenMap(prev => ({ ...prev, [entry.path]: children }))
      setExpandedDirs(prev => new Set(prev).add(entry.path))
    } catch {
    } finally {
      setLoadingDirs(prev => {
        const next = new Set(prev)
        next.delete(entry.path)
        return next
      })
    }
  }, [expandedDirs, childrenMap])

  const handleClick = async (entry: FileEntry) => {
    if (!window.electronAPI) return
    const { content } = await window.electronAPI.readFile(entry.path)
    openFile(entry.path, content)
  }

  const handleAddFile = useCallback(async (entry: FileEntry) => {
    if (!window.electronAPI) return
    const path = await createNewFile(entry.path)
    if (path) {
      const children = await window.electronAPI.listDir(entry.path)
      setChildrenMap(prev => ({ ...prev, [entry.path]: children }))
      openFile(path, '')
    }
  }, [openFile])

  // 右键菜单状态
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; entry: FileEntry } | null>(null)
  const [renamingPath, setRenamingPath] = useState<string | null>(null)

  // 右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent, entry: FileEntry) => {
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ x: e.clientX, y: e.clientY, entry })
  }, [])

  const handleDelete = useCallback(async (entry: FileEntry) => {
    if (!window.electronAPI) return
    setCtxMenu(null)
    const ok = entry.isDirectory
      ? await window.electronAPI.deleteDir(entry.path)
      : await window.electronAPI.deleteFile(entry.path)
    if (ok) {
      // 如果被删除的文件在标签中，关闭标签
      const store = useWorkspaceStore.getState()
      const isOpen = store.openTabs.some(t => t.path === entry.path)
      if (isOpen) store.closeTab(entry.path)
      store.triggerRefresh()
    }
  }, [])

  // 重命名
  const handleRename = useCallback(async (entry: FileEntry, newName: string): Promise<boolean> => {
    if (!window.electronAPI) return false

    const parentDir = entry.path.substring(0, Math.max(entry.path.lastIndexOf('/'), entry.path.lastIndexOf('\\')))
    const newPath = parentDir + '/' + newName

    if (newPath === entry.path) return false

    const ok = await window.electronAPI.rename(entry.path, newPath)
    if (!ok) return false

    // 如果被重命名的文件当前在标签中，更新标签路径
    const store = useWorkspaceStore.getState()
    const isOpen = store.openTabs.some(t => t.path === entry.path)
    if (isOpen) {
      store.updateTabPath(entry.path, newPath)
    }

    // 刷新目录
    store.triggerRefresh()
    return true
  }, [])

  const themeVal = useEditorStore(s => s.theme)

  // 根据右键目标构建菜单项
  const isRenamingEntry = (path: string) => renamingPath === path
  const triggerRename = (path: string) => setRenamingPath(path)
  const clearRenaming = () => setRenamingPath(null)

  const ctxMenuItems: ContextMenuItem[] = ctxMenu ? [
    { id: 'rename', label: 'Rename', action: () => {
      setCtxMenu(null)
      setRenamingPath(ctxMenu.entry.path)
    }},
    ctxMenu.entry.isDirectory
      ? { id: 'new-file', label: 'New File', action: () => { setCtxMenu(null); handleAddFile(ctxMenu.entry) } }
      : null,
    { id: 'div1', divider: true },
    { id: 'delete', label: ctxMenu.entry.isDirectory ? 'Delete Folder' : 'Delete', action: () => handleDelete(ctxMenu.entry) },
  ].filter(Boolean) as ContextMenuItem[] : []

  return (
    <div className="h-full flex flex-col text-sm" style={{ backgroundColor: theme === 'dark' ? '#111827' : '#f3f4f6', color: theme === 'dark' ? '#d1d5db' : '#374151' }}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/30 select-none">
        <span className="font-semibold text-xs uppercase tracking-wider opacity-60">
          {t('fileTree.title')}
        </span>
      </div>

      {/* 文件列表 */}
      <div className="flex-1 overflow-y-auto py-1">
        {entries.length === 0 && (
          <div className="px-4 py-8 text-center opacity-40 text-xs">
            {root ? t('fileTree.empty') : t('fileTree.hint')}
          </div>
        )}
        {entries.map(entry => (
          <TreeNode
            key={entry.path}
            entry={entry}
            depth={0}
            onClick={handleClick}
            onExpand={handleExpand}
            onAddFile={handleAddFile}
            onRename={handleRename}
            onContextMenu={handleContextMenu}
            isRenaming={isRenamingEntry(entry.path)}
            onRenameTriggered={clearRenaming}
            activeTabPath={activeTabPath}
            theme={theme}
            expandedDirs={expandedDirs}
            childrenMap={childrenMap}
            loadingDirs={loadingDirs}
          />
        ))}
        {ctxMenu && (
          <ContextMenu
            x={ctxMenu.x}
            y={ctxMenu.y}
            items={ctxMenuItems}
            onClose={() => setCtxMenu(null)}
            theme={theme}
          />
        )}
      </div>
    </div>
  )
}
