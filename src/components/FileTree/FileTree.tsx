import { useEffect, useState } from 'react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useEditorStore } from '../../stores/editorStore'
import type { FileEntry } from '../../types/electron'

export function FileTree() {
  const [entries, setEntries] = useState<FileEntry[]>([])
  const root = useWorkspaceStore(s => s.root)
  const openFile = useWorkspaceStore(s => s.openFile)
  const activeTabPath = useWorkspaceStore(s => s.activeTabPath)
  const theme = useEditorStore(s => s.theme)

  useEffect(() => {
    if (!root || !window.electronAPI) return
    window.electronAPI.listDir(root).then(setEntries).catch(() => setEntries([]))
  }, [root])

  const handleClick = async (entry: FileEntry) => {
    if (entry.isDirectory) return
    if (!window.electronAPI) return
    const { content } = await window.electronAPI.readFile(entry.path)
    openFile(entry.path, content)
  }

  const isMd = (name: string) => /\.(md|markdown|txt)$/i.test(name)

  const bg = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
  const text = theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
  const activeBg = theme === 'dark' ? 'bg-gray-700' : 'bg-white'
  const hoverBg = theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'

  return (
    <div className={`h-full ${bg} ${text} flex flex-col text-sm`}>
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
          <div
            key={entry.path}
            onClick={() => handleClick(entry)}
            className={`flex items-center gap-2 px-4 py-1.5 cursor-pointer ${hoverBg} transition-colors select-none ${
              activeTabPath === entry.path ? activeBg : ''
            } ${!entry.isDirectory && !isMd(entry.name) ? 'opacity-50' : ''}`}
          >
            <span className="text-sm shrink-0">
              {entry.isDirectory ? '📁' : '📝'}
            </span>
            <span className="truncate">{entry.name}</span>
            {entry.isDirectory && (
              <span className="ml-auto text-xs opacity-40">›</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
