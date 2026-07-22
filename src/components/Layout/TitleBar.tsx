import { redo, undo } from '@codemirror/commands';
import { openSearchPanel } from '@codemirror/search';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getActiveEditorView } from '../../lib/commands';
import { useT } from '../../lib/i18n';
import {
  createNewDocument,
  openFileFromDialog,
  openFolderFromDialog,
  saveActiveTab,
} from '../../lib/workspaceActions';
import { useEditorStore } from '../../stores/editorStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';

interface MenuItem {
  id: string;
  label: string;
  shortcut?: string;
  action?: () => void;
  divider?: boolean;
}

interface MenuGroup {
  id: string;
  label: string;
  items: MenuItem[];
}

interface Props {
  onOpenPalette: () => void;
  onOpenPluginManager: () => void;
}

export function TitleBar({ onOpenPalette, onOpenPluginManager }: Props) {
  const t = useT();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [animOpen, setAnimOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  const setViewMode = useEditorStore((s) => s.setViewMode);
  const toggleFileTree = useEditorStore((s) => s.toggleFileTree);
  const cycleTheme = useEditorStore((s) => s.cycleTheme);
  const closeTab = useWorkspaceStore((s) => s.closeTab);
  const activeTabPath = useWorkspaceStore((s) => s.activeTabPath);

  // 窗口最大化状态监听
  useEffect(() => {
    if (!window.electronAPI) return;
    window.electronAPI.isWindowMaximized().then(setIsMaximized);
    const handler = () => {
      // resize 事件中轮询最大化状态
      // 在 frameless 窗口中 Electron 不发送最大化事件到渲染进程
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // 双击标题栏最大化/还原
  const handleTitleBarDoubleClick = useCallback(() => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow();
      setIsMaximized((prev) => !prev);
    }
  }, []);

  // 窗口控制按钮
  const handleMinimize = () => window.electronAPI?.minimizeWindow();
  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow();
    setIsMaximized((prev) => !prev);
  };
  const handleClose = () => window.electronAPI?.closeWindow();

  // 下拉菜单开启动画：openMenu 变化 → 下一帧触发 visible
  useEffect(() => {
    if (openMenu) {
      setAnimOpen(null);
      requestAnimationFrame(() => setAnimOpen(openMenu));
    } else {
      setAnimOpen(null);
    }
  }, [openMenu]);

  // 点击外部关闭下拉
  useEffect(() => {
    if (!openMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    requestAnimationFrame(() => document.addEventListener('mousedown', handler));
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenu]);

  // ESC 关闭下拉
  useEffect(() => {
    if (!openMenu) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openMenu]);

  // ===== 文件菜单动作 =====
  const openFileDialog = () => {
    void openFileFromDialog();
  };

  const openFolderDialog = () => {
    void openFolderFromDialog();
  };

  const newFile = () => {
    void createNewDocument();
  };

  const saveFile = () => {
    void saveActiveTab();
  };

  // ===== 编辑菜单动作 =====
  const execUndo = () => {
    const v = getActiveEditorView();
    if (v) {
      v.focus();
      undo(v);
    }
  };
  const execRedo = () => {
    const v = getActiveEditorView();
    if (v) {
      v.focus();
      redo(v);
    }
  };

  const execCut = () => {
    const v = getActiveEditorView();
    if (!v) return;
    v.focus();
    const sel = v.state.selection.main;
    if (sel.from === sel.to) return;
    const text = v.state.sliceDoc(sel.from, sel.to);
    navigator.clipboard.writeText(text);
    v.dispatch({ changes: { from: sel.from, to: sel.to, insert: '' } });
  };

  const execCopy = () => {
    const v = getActiveEditorView();
    if (!v) return;
    const sel = v.state.selection.main;
    if (sel.from === sel.to) return;
    const text = v.state.sliceDoc(sel.from, sel.to);
    navigator.clipboard.writeText(text);
  };

  const execPaste = async () => {
    const v = getActiveEditorView();
    if (!v) return;
    v.focus();
    try {
      const text = await navigator.clipboard.readText();
      v.dispatch(v.state.replaceSelection(text));
    } catch {
      document.execCommand('paste');
    }
  };

  const execFind = () => {
    const v = getActiveEditorView();
    if (v) {
      v.focus();
      openSearchPanel(v);
    }
  };
  const execReplace = () => {
    const v = getActiveEditorView();
    if (v) {
      v.focus();
      openSearchPanel(v);
    }
  };

  const menuGroups: MenuGroup[] = [
    {
      id: 'file',
      label: t('menu.file'),
      items: [
        { id: 'new-file', label: t('menu.newFile'), shortcut: 'Ctrl+N', action: newFile },
        { id: 'sep0', divider: true, label: '' },
        { id: 'open-file', label: t('menu.openFile'), shortcut: 'Ctrl+O', action: openFileDialog },
        {
          id: 'open-folder',
          label: t('menu.openFolder'),
          shortcut: 'Ctrl+Shift+O',
          action: openFolderDialog,
        },
        { id: 'save', label: t('menu.save'), shortcut: 'Ctrl+S', action: saveFile },
        { id: 'sep1', divider: true, label: '' },
        {
          id: 'close-tab',
          label: t('menu.closeTab'),
          shortcut: 'Ctrl+W',
          action: () => {
            if (activeTabPath) closeTab(activeTabPath);
          },
        },
        { id: 'sep2', divider: true, label: '' },
        { id: 'exit', label: t('menu.exit'), action: () => window.close() },
      ],
    },
    {
      id: 'edit',
      label: t('menu.edit'),
      items: [
        { id: 'undo', label: t('menu.undo'), shortcut: 'Ctrl+Z', action: execUndo },
        { id: 'redo', label: t('menu.redo'), shortcut: 'Ctrl+Shift+Z', action: execRedo },
        { id: 'sep3', divider: true, label: '' },
        { id: 'cut', label: t('menu.cut'), shortcut: 'Ctrl+X', action: execCut },
        { id: 'copy', label: t('menu.copy'), shortcut: 'Ctrl+C', action: execCopy },
        { id: 'paste', label: t('menu.paste'), shortcut: 'Ctrl+V', action: execPaste },
        { id: 'sep4', divider: true, label: '' },
        { id: 'find', label: t('menu.find'), shortcut: 'Ctrl+F', action: execFind },
        { id: 'replace', label: t('menu.replace'), shortcut: 'Ctrl+H', action: execReplace },
      ],
    },
    {
      id: 'view',
      label: t('menu.view'),
      items: [
        { id: 'toggle-file-tree', label: t('menu.toggleFileTree'), action: toggleFileTree },
        { id: 'sep5', divider: true, label: '' },
        { id: 'source-mode', label: t('menu.sourceMode'), action: () => setViewMode('source') },
        { id: 'preview-mode', label: t('menu.previewMode'), action: () => setViewMode('preview') },
        { id: 'split-mode', label: t('menu.splitMode'), action: () => setViewMode('split') },
        { id: 'sep6', divider: true, label: '' },
        { id: 'toggle-theme', label: t('menu.toggleTheme'), action: cycleTheme },
        { id: 'sep7', divider: true, label: '' },
        {
          id: 'command-palette',
          label: t('menu.commandPalette'),
          shortcut: 'Ctrl+Shift+P',
          action: () => {
            onOpenPalette();
            setOpenMenu(null);
          },
        },
      ],
    },
    {
      id: 'help',
      label: t('menu.help'),
      items: [
        {
          id: 'settings',
          label: t('menu.settings'),
          action: () => window.dispatchEvent(new CustomEvent('open-settings')),
        },
        { id: 'sep9', divider: true, label: '' },
        { id: 'plugin-manager', label: t('menu.pluginManager'), action: onOpenPluginManager },
        { id: 'sep8', divider: true, label: '' },
        {
          id: 'about',
          label: t('menu.about'),
          action: () => window.dispatchEvent(new CustomEvent('open-about')),
        },
      ],
    },
  ];

  const handleMenuClick = (menuId: string) => {
    setOpenMenu(openMenu === menuId ? null : menuId);
  };

  const handleMenuHover = (menuId: string) => {
    if (openMenu) setOpenMenu(menuId);
  };

  const handleItemClick = (item: MenuItem) => {
    item.action?.();
    setOpenMenu(null);
  };

  const isElectron = !!window.electronAPI;

  return (
    <div
      ref={menuRef}
      className="flex items-center h-9 text-xs select-none shrink-0"
      style={{
        background: 'var(--bg-app)',
        color: 'var(--text-secondary)',
        WebkitAppRegion: 'drag',
      }}
    >
      {/* Brand mark —— 与主页一致的几何 mark */}
      <div
        className="flex items-center gap-2 pl-3 pr-1 shrink-0"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <span className="relative shrink-0" style={{ width: 18, height: 18 }}>
          <svg width="18" height="18" viewBox="0 0 46 46" fill="none">
            <path d="M7 11a6 6 0 0 1 6-6h14L39 17v18a6 6 0 0 1-6 6H13a6 6 0 0 1-6-6V11z" fill="var(--bg-elevated)" stroke="var(--border)" strokeWidth="2" />
            <path d="M27 5l12 12h-9a3 3 0 0 1-3-3V5z" fill="var(--accent)" />
            <line x1="14" y1="24" x2="32" y2="24" stroke="var(--text-dim)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="14" y1="30" x2="27" y2="30" stroke="var(--text-dim)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          </svg>
        </span>
        <span
          className="text-[13px] font-semibold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          码记
        </span>
      </div>

      {/* Menu items */}
      <div className="flex items-center h-full px-1 gap-0.5 flex-1 min-w-0">
        {menuGroups.map((menu) => {
          const isOpen = openMenu === menu.id;
          const visible = animOpen === menu.id;
          return (
            <div key={menu.id} className="relative" style={{ WebkitAppRegion: 'no-drag' }}>
              <button
                onClick={() => handleMenuClick(menu.id)}
                onMouseEnter={() => handleMenuHover(menu.id)}
                className="px-2.5 py-1 rounded-md transition-all duration-100 text-xs whitespace-nowrap"
                style={{
                  color: isOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: isOpen ? 'var(--bg-hover)' : 'transparent',
                }}
              >
                {menu.label}
              </button>

              {isOpen && (
                <div
                  className="absolute top-full left-0 z-50 w-56 py-1.5 rounded-xl border transition-all duration-150"
                  style={{
                    background: 'var(--bg-elevated)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                    minWidth: '220px',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)',
                    transformOrigin: 'top left',
                    transform: visible ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.96)',
                    opacity: visible ? 1 : 0,
                  }}
                >
                  {menu.items.map((item) =>
                    item.divider ? (
                      <div
                        key={item.id}
                        className="mx-2.5 my-1 border-t"
                        style={{ borderColor: 'var(--border-light)' }}
                      />
                    ) : (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="w-full flex items-center justify-between px-3 py-1.5 mx-0 text-left text-xs rounded-md transition-colors duration-75"
                        style={{ color: 'var(--text-primary)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--accent)';
                          e.currentTarget.style.color = 'var(--accent-contrast)';
                          const sc = e.currentTarget.querySelector('[data-sc]') as HTMLElement | null;
                          if (sc) sc.style.color = 'var(--accent-contrast)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-primary)';
                          const sc = e.currentTarget.querySelector('[data-sc]') as HTMLElement | null;
                          if (sc) sc.style.color = 'var(--text-dim)';
                        }}
                      >
                        <span>{item.label}</span>
                        {item.shortcut && (
                          <span
                            data-sc
                            style={{
                              color: 'var(--text-dim)',
                              fontSize: '11px',
                              marginLeft: '24px',
                            }}
                          >
                            {item.shortcut}
                          </span>
                        )}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Window control buttons — Electron frameless (Windows) */}
      {isElectron && (
        <div
          className="flex items-center h-full shrink-0"
          style={{ WebkitAppRegion: 'no-drag' }}
          onDoubleClick={handleTitleBarDoubleClick}
        >
          <button
            onClick={handleMinimize}
            className="flex items-center justify-center w-[46px] h-full transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            >
              <line x1="2" y1="5" x2="8" y2="5" />
            </svg>
          </button>
          <button
            onClick={handleMaximize}
            className="flex items-center justify-center w-[46px] h-full transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {isMaximized ? (
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              >
                <rect x="1.5" y="3.5" width="5" height="5" rx="1" />
                <path d="M3.5 3.5V2a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1H6.5" />
              </svg>
            ) : (
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              >
                <rect x="2" y="2" width="6" height="6" rx="1" />
              </svg>
            )}
          </button>
          <button
            onClick={handleClose}
            className="flex items-center justify-center w-[46px] h-full transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e05050';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            >
              <line x1="2" y1="2" x2="8" y2="8" />
              <line x1="8" y1="2" x2="2" y2="8" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
