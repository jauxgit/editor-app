import { useEffect, useState, useCallback } from 'react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useEditorStore } from '../../stores/editorStore'
import type { FileEntry } from '../../types/electron'

interface TreeNodeProps {
  entry: FileEntry
  depth: number
  onClick: (entry: FileEntry) => void
  onExpand: (entry: FileEntry) => void
  activeTabPath: string | null
  theme: 'dark' | 'light'
  expandedDirs: Set<string>
  childrenMap: Record<string, FileEntry[]>
  loadingDirs: Set<string>
}

function TreeNode({ entry, depth, onClick, onExpand, activeTabPath, theme, expandedDirs, childrenMap, loadingDirs }: TreeNodeProps) {
  const isMd = (name: string) => /\.(md|markdown|txt)$/i.test(name)
  const isExpanded = expandedDirs.has(entry.path)
  const isLoading = loadingDirs.has(entry.path)
  const children = childrenMap[entry.path]

  const bg = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
  const text = theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
  const activeBg = theme === 'dark' ? 'bg-gray-700' : 'bg-white'
  const hoverBg = theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'

  const paddingLeft = 12 + depth * 16

  return (
    <>
      <div
        className={`flex items-center gap-2 pr-3 py-1.5 cursor-pointer ${hoverBg} transition-colors select-none ${
          activeTabPath === entry.path ? activeBg : ''
        } ${!entry.isDirectory && !isMd(entry.name) ? 'opacity-50' : ''} ${bg} ${text}`}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={() => {
          if (entry.isDirectory) {
            onExpand(entry)
          } else {
            onClick(entry)
          }
        }}
      >
        {/* 展开/折叠指示器 */}
        <span className="text-xs shrink-0 w-4 text-center">
          {entry.isDirectory && (isLoading ? '⏳' : isExpanded ? '▾' : '▸')}
        </span>
        <span className="text-sm shrink-0">
          {entry.isDirectory ? (isExpanded ? '📂' : '📁') : '📝'}
        </span>
        <span className="truncate">{entry.name}</span>
        {entry.isDirectory && !isExpanded && (
          <span className="ml-auto text-xs opacity-40">›</span>
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
  const openFile = useWorkspaceStore(s => s.openFile)
  const activeTabPath = useWorkspaceStore(s => s.activeTabPath)
  const theme = useEditorStore(s => s.theme)

  // 加载根目录
  useEffect(() => {
    if (!root || !window.electronAPI) return
    setExpandedDirs(new Set())
    setChildrenMap({})
    window.electronAPI.listDir(root).then(setEntries).catch(() => setEntries([]))
  }, [root])

  const handleExpand = useCallback(async (entry: FileEntry) => {
    if (!entry.isDirectory || !window.electronAPI) return

    // 如果已展开 → 折叠
    if (expandedDirs.has(entry.path)) {
      setExpandedDirs(prev => {
        const next = new Set(prev)
        next.delete(entry.path)
        return next
      })
      return
    }

    // 如果已有缓存的子节点 → 直接展开
    if (childrenMap[entry.path]) {
      setExpandedDirs(prev => new Set(prev).add(entry.path))
      return
    }

    // 展开并加载子目录
    setLoadingDirs(prev => new Set(prev).add(entry.path))
    try {
      const children = await window.electronAPI!.listDir(entry.path)
      setChildrenMap(prev => ({ ...prev, [entry.path]: children }))
      setExpandedDirs(prev => new Set(prev).add(entry.path))
    } catch {
      // 加载失败，静默处理
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

  return (
    <div className="h-full flex flex-col text-sm" style={{ backgroundColor: theme === 'dark' ? '#111827' : '#f3f4f6', color: theme === 'dark' ? '#d1d5db' : '#374151' }}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/30 select-none">
        <span className="font-semibold text-xs uppercase tracking-wider opacity-60">
          Files
        </span>
      </div>

      {/* 文件列表 */}
      <div className="flex-1 overflow-y-auto py-1">
        {entries.length === 0 && (
          <div className="px-4 py-8 text-center opacity-40 text-xs">
            {root ? 'Empty folder' : 'Open a folder to start'}
          </div>
        )}
        {entries.map(entry => (
          <TreeNode
            key={entry.path}
            entry={entry}
            depth={0}
            onClick={handleClick}
            onExpand={handleExpand}
            activeTabPath={activeTabPath}
            theme={theme}
            expandedDirs={expandedDirs}
            childrenMap={childrenMap}
            loadingDirs={loadingDirs}
          />
        ))}
      </div>
    </div>
  )
}
