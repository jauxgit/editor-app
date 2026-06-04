import { useState, useRef, useEffect } from 'react'
import { undo, redo } from '@codemirror/commands'
import { openSearchPanel } from '@codemirror/search'
import { useT } from '../../lib/i18n'
import { useWorkspaceStore, nextUntitledId } from '../../stores/workspaceStore'
import { useEditorStore } from '../../stores/editorStore'
import { getActiveEditorView, createNewFile } from '../../lib/commands'

interface MenuItem {
  id: string
  label: string
  shortcut?: string
  action?: () => void
  divider?: boolean
}

interface MenuGroup {
  id: string
  label: string
  items: MenuItem[]
}

interface Props {
  onOpenPalette: () => void
  onOpenPluginManager: () => void
}

export function MenuBar({ onOpenPalette, onOpenPluginManager }: Props) {
  const t = useT()
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const setViewMode = useEditorStore(s => s.setViewMode)
  const toggleFileTree = useEditorStore(s => s.toggleFileTree)
  const toggleTheme = useEditorStore(s => s.toggleTheme)
  const root = useWorkspaceStore(s => s.root)
  const closeTab = useWorkspaceStore(s => s.closeTab)
  const activeTabPath = useWorkspaceStore(s => s.activeTabPath)
  const openFile = useWorkspaceStore(s => s.openFile)
  const setRoot = useWorkspaceStore(s => s.setRoot)

  // 点击外部关闭下拉
  useEffect(() => {
    if (!openMenu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    requestAnimationFrame(() => document.addEventListener('mousedown', handler))
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenu])

  // ESC 关闭下拉
  useEffect(() => {
    if (!openMenu) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openMenu])

  // ===== 文件菜单动作 =====
  const openFileDialog = () => {
    if (window.electronAPI) {
      window.electronAPI.openFileDialog().then(result => {
        if (result) openFile(result.path, result.content)
      })
    }
  }

  const openFolderDialog = () => {
    if (window.electronAPI) {
      window.electronAPI.openFolderDialog().then(result => {
        if (result) setRoot(result.path)
      })
    }
  }

  const newFile = async () => {
    const store = useWorkspaceStore.getState()
    if (store.root) {
      const path = await createNewFile(store.root)
      if (path) {
        store.openFile(path, '')
        store.triggerRefresh()
      }
    } else {
      const id = nextUntitledId()
      store.openUntitled(id)
    }
  }

  const saveFile = () => {
    const view = getActiveEditorView()
    if (view) {
      const content = view.state.doc.toString()
      const path = activeTabPath
      if (path && window.electronAPI) {
        window.electronAPI.writeFile(path, content).then(() => {
          useWorkspaceStore.getState().markClean(path)
        })
      }
    }
  }

  // ===== 编辑菜单动作 =====
  const execUndo = () => { const v = getActiveEditorView(); if (v) { v.focus(); undo(v) } }
  const execRedo = () => { const v = getActiveEditorView(); if (v) { v.focus(); redo(v) } }

  const execCut = () => {
    const v = getActiveEditorView()
    if (!v) return
    v.focus()
    const sel = v.state.selection.main
    if (sel.from === sel.to) return
    const text = v.state.sliceDoc(sel.from, sel.to)
    navigator.clipboard.writeText(text)
    v.dispatch({ changes: { from: sel.from, to: sel.to, insert: '' } })
  }

  const execCopy = () => {
    const v = getActiveEditorView()
    if (!v) return
    const sel = v.state.selection.main
    if (sel.from === sel.to) return
    const text = v.state.sliceDoc(sel.from, sel.to)
    navigator.clipboard.writeText(text)
  }

  const execPaste = async () => {
    const v = getActiveEditorView()
    if (!v) return
    v.focus()
    try {
      const text = await navigator.clipboard.readText()
      v.dispatch(v.state.replaceSelection(text))
    } catch {
      document.execCommand('paste')
    }
  }

  const execFind = () => { const v = getActiveEditorView(); if (v) { v.focus(); openSearchPanel(v) } }
  const execReplace = () => { const v = getActiveEditorView(); if (v) { v.focus(); openSearchPanel(v) } }

  const menuGroups: MenuGroup[] = [
    {
      id: 'file',
      label: t('menu.file'),
      items: [
        { id: 'new-file', label: t('menu.newFile'), shortcut: 'Ctrl+N', action: newFile },
        { id: 'sep0', divider: true },
        { id: 'open-file', label: t('menu.openFile'), shortcut: 'Ctrl+O', action: openFileDialog },
        { id: 'open-folder', label: t('menu.openFolder'), shortcut: 'Ctrl+Shift+O', action: openFolderDialog },
        { id: 'save', label: t('menu.save'), shortcut: 'Ctrl+S', action: saveFile },
        { id: 'sep1', divider: true },
        { id: 'close-tab', label: t('menu.closeTab'), shortcut: 'Ctrl+W', action: () => { if (activeTabPath) closeTab(activeTabPath) } },
        { id: 'sep2', divider: true },
        { id: 'exit', label: t('menu.exit'), action: () => window.close() },
      ],
    },
    {
      id: 'edit',
      label: t('menu.edit'),
      items: [
        { id: 'undo', label: t('menu.undo'), shortcut: 'Ctrl+Z', action: execUndo },
        { id: 'redo', label: t('menu.redo'), shortcut: 'Ctrl+Shift+Z', action: execRedo },
        { id: 'sep3', divider: true },
        { id: 'cut', label: t('menu.cut'), shortcut: 'Ctrl+X', action: execCut },
        { id: 'copy', label: t('menu.copy'), shortcut: 'Ctrl+C', action: execCopy },
        { id: 'paste', label: t('menu.paste'), shortcut: 'Ctrl+V', action: execPaste },
        { id: 'sep4', divider: true },
        { id: 'find', label: t('menu.find'), shortcut: 'Ctrl+F', action: execFind },
        { id: 'replace', label: t('menu.replace'), shortcut: 'Ctrl+H', action: execReplace },
      ],
    },
    {
      id: 'view',
      label: t('menu.view'),
      items: [
        { id: 'toggle-file-tree', label: t('menu.toggleFileTree'), action: toggleFileTree },
        { id: 'sep5', divider: true },
        { id: 'source-mode', label: t('menu.sourceMode'), action: () => setViewMode('source') },
        { id: 'preview-mode', label: t('menu.previewMode'), action: () => setViewMode('preview') },
        { id: 'split-mode', label: t('menu.splitMode'), action: () => setViewMode('split') },
        { id: 'sep6', divider: true },
        { id: 'toggle-theme', label: t('menu.toggleTheme'), action: toggleTheme },
        { id: 'sep7', divider: true },
        { id: 'command-palette', label: t('menu.commandPalette'), shortcut: 'Ctrl+Shift+P', action: () => { onOpenPalette(); setOpenMenu(null) } },
      ],
    },
    {
      id: 'help',
      label: t('menu.help'),
      items: [
        { id: 'plugin-manager', label: t('menu.pluginManager'), action: onOpenPluginManager },
        { id: 'sep8', divider: true },
        { id: 'about', label: t('menu.about'), action: () => { /* TODO */ } },
      ],
    },
  ]

  const handleMenuClick = (menuId: string) => {
    setOpenMenu(openMenu === menuId ? null : menuId)
  }

  const handleMenuHover = (menuId: string) => {
    if (openMenu) setOpenMenu(menuId)
  }

  const handleItemClick = (item: MenuItem) => {
    item.action?.()
    setOpenMenu(null)
  }

  return (
    <div
      ref={menuRef}
      className="flex items-center h-7 text-xs border-b select-none shrink-0 px-1 gap-0.5"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
    >
      {menuGroups.map(menu => {
        const isOpen = openMenu === menu.id
        return (
          <div key={menu.id} className="relative">
            <button
              onClick={() => handleMenuClick(menu.id)}
              onMouseEnter={() => handleMenuHover(menu.id)}
              className="px-3 py-1 rounded transition-all duration-100 text-xs"
              style={{
                color: isOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isOpen ? 'var(--accent-muted)' : 'transparent',
              }}
            >
              {menu.label}
            </button>

            {isOpen && (
              <div
                className="absolute top-full left-0 z-50 w-52 py-1.5 rounded-lg border shadow-lg"
                style={{
                  background: 'var(--bg-elevated)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                  minWidth: '210px',
                  transformOrigin: 'top left',
                }}
              >
                {menu.items.map((item, idx) =>
                  item.divider ? (
                    <div
                      key={item.id}
                      className="mx-2 my-1 border-t"
                      style={{ borderColor: 'var(--border)' }}
                    />
                  ) : (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-left text-xs transition-colors duration-75"
                      style={{
                        color: 'var(--text-primary)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--accent-muted)'
                        e.currentTarget.style.color = 'var(--accent)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--text-primary)'
                      }}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span style={{ color: 'var(--text-dim)', fontSize: '11px', marginLeft: '24px' }}>
                          {item.shortcut}
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        )
      })}

      <div className="ml-auto flex items-center gap-2">
        {/* Spacer */}
      </div>
    </div>
  )
}
