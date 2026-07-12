import { useEffect, useState, useCallback, useRef } from 'react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useT } from '../../lib/i18n'
import { useToastStore } from '../../stores/toastStore'
import { createNamedFileInDir, renameEntry } from '../../lib/workspaceActions'
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
  renamingPath: string | null
  onRenameTriggered: () => void
  creatingIn: string | null
  createValue: string
  onCreateValueChange: (value: string) => void
  onConfirmCreate: () => void
  onCancelCreate: () => void
  activeTabPath: string | null
  expandedDirs: Set<string>
  childrenMap: Record<string, FileEntry[]>
  loadingDirs: Set<string>
}

function FileIcon({ name, isDirectory, isExpanded }: { name: string; isDirectory: boolean; isExpanded: boolean }) {
  const isMd = /\.(md|markdown)$/i.test(name)
  const isCode = /\.(ts|tsx|js|jsx|py|rs|go|java|cs|c|cpp|h|hpp|css|scss|json|yaml|yml|toml|xml|sql|rb|php|sh)$/i.test(name)

  if (isDirectory) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)', opacity: 0.7 }}>
        {isExpanded ? (
          <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.5l2 2H12.5A1.5 1.5 0 0 1 14 6.5v5A1.5 1.5 0 0 1 12.5 13h-9A1.5 1.5 0 0 1 2 11.5z" />
        ) : (
          <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2l1.5 2H12.5A1.5 1.5 0 0 1 14 6.5v5A1.5 1.5 0 0 1 12.5 13h-9A1.5 1.5 0 0 1 2 11.5z" />
        )}
      </svg>
    )
  }
  if (isMd) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}>
        <path d="M3 2.5A1.5 1.5 0 0 1 4.5 1h5l4 4v8.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 3 14.5z" />
        <polyline points="9.5,1 9.5,5 13.5,5" />
        <line x1="5.5" y1="8.5" x2="10.5" y2="8.5" />
        <line x1="5.5" y1="10.5" x2="9" y2="10.5" />
      </svg>
    )
  }
  if (isCode) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-dim)' }}>
        <polyline points="4,5 1,8 4,11" /><polyline points="12,5 15,8 12,11" /><line x1="9" y1="4" x2="7" y2="12" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-dim)' }}>
      <path d="M3 2.5A1.5 1.5 0 0 1 4.5 1h5l4 4v8.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 3 14.5z" />
      <polyline points="9.5,1 9.5,5 13.5,5" />
    </svg>
  )
}

function CreateFileInput({
  depth,
  value,
  onChange,
  onConfirm,
  onCancel,
}: {
  depth: number
  value: string
  onChange: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const confirmedRef = useRef(false)
  const paddingLeft = 12 + depth * 16

  useEffect(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [])

  const finish = (mode: 'confirm' | 'cancel') => {
    if (confirmedRef.current) return
    confirmedRef.current = true
    if (mode === 'confirm') onConfirm()
    else onCancel()
  }

  return (
    <div
      className="flex items-center gap-2 pr-3 py-1"
      style={{ paddingLeft: `${paddingLeft}px` }}
      onClick={e => e.stopPropagation()}
    >
      <span className="shrink-0 w-4" />
      <FileIcon name="new.md" isDirectory={false} isExpanded={false} />
      <input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            finish('confirm')
          } else if (e.key === 'Escape') {
            e.preventDefault()
            finish('cancel')
          }
        }}
        onBlur={() => finish('confirm')}
        className="flex-1 min-w-0 px-1 py-0 text-xs rounded outline-none border"
        style={{
          background: 'var(--bg-base)',
          color: 'var(--text-primary)',
          borderColor: 'var(--accent)',
        }}
        placeholder="filename.md"
      />
    </div>
  )
}

function TreeNode({
  entry,
  depth,
  onClick,
  onExpand,
  onAddFile,
  onRename,
  onContextMenu,
  renamingPath,
  onRenameTriggered,
  creatingIn,
  createValue,
  onCreateValueChange,
  onConfirmCreate,
  onCancelCreate,
  activeTabPath,
  expandedDirs,
  childrenMap,
  loadingDirs,
}: TreeNodeProps) {
  const t = useT()
  const isRenaming = renamingPath === entry.path
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const isMd = (name: string) => /\.(md|markdown|txt)$/i.test(name)
  const isExpanded = expandedDirs.has(entry.path)
  const isLoading = loadingDirs.has(entry.path)
  const children = childrenMap[entry.path]
  const isActive = activeTabPath === entry.path
  const isCreatingHere = creatingIn === entry.path

  const paddingLeft = 12 + depth * 16

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
    const hasExt = trimmed.includes('.')
    const newName = !entry.isDirectory && ext && !hasExt ? trimmed + ext : trimmed

    await onRename(entry, newName)
  }

  const cancelRename = () => {
    setRenaming(false)
    onRenameTriggered()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void confirmRename()
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
        className="group flex items-center gap-2 pr-3 py-1 cursor-pointer select-none transition-all duration-100"
        style={{
          paddingLeft: `${paddingLeft}px`,
          background: isActive ? 'var(--accent-muted)' : 'transparent',
          color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
          borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)' }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
        onDoubleClick={entry.isDirectory ? undefined : startRename}
        onClick={handleRowClick}
        onContextMenu={e => onContextMenu(e, entry)}
      >
        <span className="shrink-0 w-4 flex justify-center" style={{ color: 'var(--text-dim)' }}>
          {entry.isDirectory && (isLoading ? (
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="animate-spin">
              <circle cx="8" cy="8" r="6" opacity="0.3" />
              <path d="M14 8a6 6 0 0 0-6-6" />
            </svg>
          ) : (
            <svg
              width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
            >
              <polyline points="3,2 7,5 3,8" />
            </svg>
          ))}
        </span>

        <FileIcon name={entry.name} isDirectory={entry.isDirectory} isExpanded={isExpanded} />

        {renaming ? (
          <input
            ref={inputRef}
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { void confirmRename() }}
            className="flex-1 min-w-0 px-1 py-0 text-xs rounded outline-none border"
            style={{
              background: 'var(--bg-base)',
              color: 'var(--text-primary)',
              borderColor: 'var(--accent)',
            }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className={`truncate flex-1 min-w-0 text-xs ${!entry.isDirectory && !isMd(entry.name) ? 'opacity-50' : ''}`}>
            {entry.name}
          </span>
        )}

        {entry.isDirectory && !renaming && (
          <span
            className="ml-auto text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-default shrink-0"
            style={{ color: 'var(--accent)' }}
            onClick={e => { e.stopPropagation(); onAddFile(entry) }}
            title={t('fileTree.addFile')}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="6" y1="2" x2="6" y2="10" /><line x1="2" y1="6" x2="10" y2="6" />
            </svg>
          </span>
        )}
      </div>

      {entry.isDirectory && isExpanded && (
        <div style={{ transition: 'all 0.15s' }}>
          {isCreatingHere && (
            <CreateFileInput
              depth={depth + 1}
              value={createValue}
              onChange={onCreateValueChange}
              onConfirm={onConfirmCreate}
              onCancel={onCancelCreate}
            />
          )}
          {children?.map(child => (
            <TreeNode
              key={child.path}
              entry={child}
              depth={depth + 1}
              onClick={onClick}
              onExpand={onExpand}
              onAddFile={onAddFile}
              onRename={onRename}
              onContextMenu={onContextMenu}
              renamingPath={renamingPath}
              onRenameTriggered={onRenameTriggered}
              creatingIn={creatingIn}
              createValue={createValue}
              onCreateValueChange={onCreateValueChange}
              onConfirmCreate={onConfirmCreate}
              onCancelCreate={onCancelCreate}
              activeTabPath={activeTabPath}
              expandedDirs={expandedDirs}
              childrenMap={childrenMap}
              loadingDirs={loadingDirs}
            />
          ))}
        </div>
      )}
    </>
  )
}

export function FileTree() {
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [childrenMap, setChildrenMap] = useState<Record<string, FileEntry[]>>({})
  const [loadingDirs, setLoadingDirs] = useState<Set<string>>(new Set())
  const [creatingIn, setCreatingIn] = useState<string | null>(null)
  const [createValue, setCreateValue] = useState('untitled')
  const [renamingPath, setRenamingPath] = useState<string | null>(null)
  const createBusyRef = useRef(false)

  const root = useWorkspaceStore(s => s.root)
  const refreshSignal = useWorkspaceStore(s => s.refreshSignal)
  const openFile = useWorkspaceStore(s => s.openFile)
  const activeTabPath = useWorkspaceStore(s => s.activeTabPath)
  const t = useT()
  const showToast = useToastStore(s => s.showToast)
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])

  useEffect(() => {
    let cancelled = false

    const loadRoot = async () => {
      if (!root || !window.electronAPI) {
        if (!cancelled) setEntries([])
        return
      }

      try {
        const saved = localStorage.getItem(`markedit-expanded-dirs:${root}`)
        const nextExpanded = new Set(saved ? JSON.parse(saved) as string[] : [])
        const nextEntries = await window.electronAPI.listDir(root)
        if (cancelled) return
        setChildrenMap({})
        setExpandedDirs(nextExpanded)
        setEntries(nextEntries)
      } catch (error) {
        if (cancelled) return
        setEntries([])
        useToastStore.getState().showToast({ type: 'error', message: tRef.current('toast.folderOpenFailed'), detail: error instanceof Error ? error.message : String(error) })
      }
    }

    void loadRoot()
    return () => {
      cancelled = true
    }
  }, [root, refreshSignal])

  useEffect(() => {
    if (!root) return
    localStorage.setItem(`markedit-expanded-dirs:${root}`, JSON.stringify([...expandedDirs]))
  }, [expandedDirs, root])

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

  useEffect(() => {
    if (!activeTabPath || !root || !window.electronAPI) return
    const normalizedRoot = root.replace(/\\/g, '/')
    const normalizedPath = activeTabPath.replace(/\\/g, '/')
    if (!normalizedPath.startsWith(normalizedRoot)) return

    const relative = normalizedPath.slice(normalizedRoot.length).replace(/^\//, '')
    const parts = relative.split('/').filter(Boolean)
    if (parts.length <= 1) return

    const dirs: string[] = []
    let current = root.replace(/[\\/]$/, '')
    for (const part of parts.slice(0, -1)) {
      current = current + '/' + part
      dirs.push(current)
    }

    setExpandedDirs(prev => new Set([...prev, ...dirs]))
    dirs.forEach(async (dir) => {
      if (childrenMap[dir]) return
      try {
        const children = await window.electronAPI!.listDir(dir)
        setChildrenMap(prev => ({ ...prev, [dir]: prev[dir] || children }))
      } catch {
        // ignore
      }
    })
  }, [activeTabPath, root, childrenMap])

  const handleClick = async (entry: FileEntry) => {
    if (!window.electronAPI) return
    const { content } = await window.electronAPI.readFile(entry.path)
    openFile(entry.path, content)
  }

  const beginCreateIn = useCallback(async (dirPath: string) => {
    setCreatingIn(dirPath)
    setCreateValue('untitled')
    setExpandedDirs(prev => new Set(prev).add(dirPath))
    if (!childrenMap[dirPath] && window.electronAPI && root && dirPath !== root) {
      try {
        const children = await window.electronAPI.listDir(dirPath)
        setChildrenMap(prev => ({ ...prev, [dirPath]: children }))
      } catch {
        // ignore
      }
    }
  }, [childrenMap, root])

  const handleAddFile = useCallback((entry: FileEntry) => {
    void beginCreateIn(entry.path)
  }, [beginCreateIn])

  const handleRootNewFile = useCallback(() => {
    if (!root) return
    void beginCreateIn(root)
  }, [beginCreateIn, root])

  const cancelCreate = useCallback(() => {
    setCreatingIn(null)
    setCreateValue('untitled')
    createBusyRef.current = false
  }, [])

  const confirmCreate = useCallback(async () => {
    if (!creatingIn || createBusyRef.current) return
    const raw = createValue.trim()
    if (!raw) {
      cancelCreate()
      return
    }
    createBusyRef.current = true
    const path = await createNamedFileInDir(creatingIn, raw)
    createBusyRef.current = false
    if (path) {
      if (window.electronAPI) {
        try {
          if (root && creatingIn === root) {
            const next = await window.electronAPI.listDir(root)
            setEntries(next)
          } else {
            const children = await window.electronAPI.listDir(creatingIn)
            setChildrenMap(prev => ({ ...prev, [creatingIn]: children }))
          }
        } catch {
          // refreshSignal handles full reload
        }
      }
      setCreatingIn(null)
      setCreateValue('untitled')
    }
  }, [cancelCreate, createValue, creatingIn, root])

  const handleRefresh = useCallback(() => {
    useWorkspaceStore.getState().triggerRefresh()
    showToast({ type: 'info', message: t('toast.fileTreeRefreshed'), duration: 1600 })
  }, [showToast, t])

  const handleCollapseAll = useCallback(() => {
    setExpandedDirs(new Set())
  }, [])

  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; entry: FileEntry } | null>(null)

  const handleContextMenu = useCallback((e: React.MouseEvent, entry: FileEntry) => {
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ x: e.clientX, y: e.clientY, entry })
  }, [])

  const handleDelete = useCallback(async (entry: FileEntry) => {
    if (!window.electronAPI) return
    setCtxMenu(null)
    const confirmed = window.confirm(t(entry.isDirectory ? 'confirm.deleteFolder' : 'confirm.deleteFile', { name: entry.name }))
    if (!confirmed) return
    try {
      const ok = entry.isDirectory ? await window.electronAPI.deleteDir(entry.path) : await window.electronAPI.deleteFile(entry.path)
      if (!ok) throw new Error(entry.path)
      const store = useWorkspaceStore.getState()
      const isOpen = store.openTabs.some(tab => tab.path === entry.path)
      if (isOpen) store.closeTab(entry.path)
      store.triggerRefresh()
      showToast({ type: 'success', message: t(entry.isDirectory ? 'toast.folderDeleted' : 'toast.fileDeleted'), detail: entry.path })
    } catch (error) {
      showToast({ type: 'error', message: t('toast.deleteFailed'), detail: error instanceof Error ? error.message : String(error) })
    }
  }, [showToast, t])

  const handleRename = useCallback(async (_entry: FileEntry, newName: string): Promise<boolean> => {
    const result = await renameEntry(_entry.path, newName)
    return result !== null
  }, [])

  const clearRenaming = () => setRenamingPath(null)

  const ctxMenuItems: ContextMenuItem[] = ctxMenu ? [
    { id: 'rename', label: t('fileTree.rename'), action: () => {
      setCtxMenu(null)
      setRenamingPath(ctxMenu.entry.path)
    }},
    ctxMenu.entry.isDirectory
      ? { id: 'new-file', label: t('fileTree.addFile'), action: () => { setCtxMenu(null); handleAddFile(ctxMenu.entry) } }
      : null,
    { id: 'div1', divider: true },
    { id: 'delete', label: ctxMenu.entry.isDirectory ? t('fileTree.deleteFolder') : t('fileTree.delete'), action: () => handleDelete(ctxMenu.entry) },
  ].filter(Boolean) as ContextMenuItem[] : []

  return (
    <div className="h-full min-h-0 flex flex-col text-sm" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b select-none shrink-0" style={{ borderColor: 'var(--border)' }}>
        <span className="font-medium text-xs uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
          {t('fileTree.title')}
        </span>
        <div className="flex items-center gap-1">
          <button title={t('fileTree.addFile')} onClick={handleRootNewFile} className="flex h-6 w-6 items-center justify-center rounded" style={{ color: 'var(--text-dim)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="6" y1="2" x2="6" y2="10" /><line x1="2" y1="6" x2="10" y2="6" /></svg>
          </button>
          <button title={t('fileTree.refresh')} onClick={handleRefresh} className="flex h-6 w-6 items-center justify-center rounded" style={{ color: 'var(--text-dim)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M13 8a5 5 0 1 1-1.5-3.5" /><polyline points="13,2 13,6 9,6" /></svg>
          </button>
          <button title={t('fileTree.collapseAll')} onClick={handleCollapseAll} className="flex h-6 w-6 items-center justify-center rounded" style={{ color: 'var(--text-dim)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M4 6h8M4 10h8" /></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-0.5">
        {entries.length === 0 && !(creatingIn && root && creatingIn === root) && (
          <div className="px-4 py-10 text-center" style={{ color: 'var(--text-dim)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="mx-auto mb-2" style={{ opacity: 0.3 }}>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <line x1="8" y1="7" x2="16" y2="7" /><line x1="8" y1="11" x2="13" y2="11" />
            </svg>
            <div className="text-xs">{root ? t('fileTree.empty') : t('fileTree.hint')}</div>
          </div>
        )}
        {creatingIn && root && creatingIn === root && (
          <CreateFileInput
            depth={0}
            value={createValue}
            onChange={setCreateValue}
            onConfirm={() => { void confirmCreate() }}
            onCancel={cancelCreate}
          />
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
            renamingPath={renamingPath}
            onRenameTriggered={clearRenaming}
            creatingIn={creatingIn}
            createValue={createValue}
            onCreateValueChange={setCreateValue}
            onConfirmCreate={() => { void confirmCreate() }}
            onCancelCreate={cancelCreate}
            activeTabPath={activeTabPath}
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
          />
        )}
      </div>
    </div>
  )
}
