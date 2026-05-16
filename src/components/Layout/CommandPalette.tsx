import { useState, useEffect, useRef, useCallback } from 'react'
import { commands, type Command } from '../../lib/commands'
import { useEditorStore } from '../../stores/editorStore'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const theme = useEditorStore(s => s.theme)

  const results: Command[] = commands.search(query)

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

  const overlay = theme === 'dark'
    ? 'bg-black/60 backdrop-blur-sm'
    : 'bg-black/30 backdrop-blur-sm'
  const dialog = theme === 'dark'
    ? 'bg-gray-800 border-gray-700 text-gray-200'
    : 'bg-white border-gray-200 text-gray-800'
  const inputBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white'
  const itemHover = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
  const dimText = theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
  const activeBg = theme === 'dark' ? 'bg-indigo-600' : 'bg-indigo-500'
  const activeText = 'text-white'

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center pt-[15vh] ${overlay}`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden ${dialog}`}
        onClick={e => e.stopPropagation()}
      >
        {/* 搜索输入 */}
        <div className="flex items-center px-4 py-3 border-b border-gray-700/20">
          <span className={`mr-2 text-lg ${dimText}`}>›</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setIndex(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className={`flex-1 outline-none text-sm ${inputBg} placeholder:${dimText}`}
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setIndex(0) }}
              className={`ml-2 text-xs ${dimText} hover:opacity-70`}
            >
              ✕
            </button>
          )}
        </div>

        {/* 结果列表 */}
        <div className="max-h-72 overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className={`px-4 py-6 text-center text-sm ${dimText}`}>
              No matching commands
            </div>
          ) : (
            results.map((cmd, i) => (
              <div
                key={cmd.id}
                onClick={() => { cmd.action(); onClose() }}
                onMouseEnter={() => setIndex(i)}
                className={`flex items-center justify-between px-4 py-2 cursor-pointer text-sm transition-colors ${
                  i === index
                    ? `${activeBg} ${activeText}`
                    : `hover:${itemHover}`
                }`}
              >
                <span>{cmd.label}</span>
                {cmd.category && (
                  <span className={`text-xs ${i === index ? 'opacity-70' : dimText}`}>
                    {cmd.category}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* 提示 */}
        <div className={`px-4 py-1.5 border-t border-gray-700/20 text-xs ${dimText} flex gap-4`}>
          <span>↑↓ Navigate</span>
          <span>↵ Execute</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  )
}

/**
 * 注册所有可用命令
 */
export function useRegisterCommands() {
  const viewMode = useEditorStore(s => s.viewMode)
  const setViewMode = useEditorStore(s => s.setViewMode)
  const toggleFileTree = useEditorStore(s => s.toggleFileTree)
  const toggleTheme = useEditorStore(s => s.toggleTheme)

  useEffect(() => {
    commands.registerAll([
      { id: 'view.source', label: 'View: Source Mode', category: 'View', action: () => setViewMode('source') },
      { id: 'view.preview', label: 'View: Preview Mode', category: 'View', action: () => setViewMode('preview') },
      { id: 'view.split', label: 'View: Split Mode', category: 'View', action: () => setViewMode('split') },
      { id: 'view.toggle-file-tree', label: 'View: Toggle File Tree', category: 'View', action: toggleFileTree },
      { id: 'view.toggle-theme', label: 'View: Toggle Dark/Light Theme', category: 'View', action: toggleTheme },
      { id: 'file.open', label: 'File: Open File', category: 'File', action: () => {
        // 触发 Electron 的打开文件对话框
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'o', ctrlKey: true, metaKey: true }))
      }},
      { id: 'file.open-folder', label: 'File: Open Folder', category: 'File', action: () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'o', shiftKey: true, ctrlKey: true, metaKey: true }))
      }},
      { id: 'file.save', label: 'File: Save', category: 'File', action: () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, metaKey: true }))
      }},
    ])
  }, [setViewMode, toggleFileTree, toggleTheme])
}
