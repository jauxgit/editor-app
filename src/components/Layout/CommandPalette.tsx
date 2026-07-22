import { useCallback, useEffect, useRef, useState } from 'react';
import { commands, type Command } from '../../lib/commands';
import { editorFonts } from '../../lib/editorFonts';
import { editorThemes } from '../../lib/editorThemes';
import { highlightThemes } from '../../lib/highlightThemes';
import { useT } from '../../lib/i18n';
import { usePlugins } from '../../lib/pluginRegistry';
import { activateNextTab, closeActiveTab, createNewDocument, openFileFromDialog, openFolderFromDialog, saveActiveTab } from '../../lib/workspaceActions';
import { useEditorStore } from '../../stores/editorStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT();

  const results: Command[] = commands.search(query);

  // 寮€鍚姩鐢?
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // 鎵撳紑鏃惰仛鐒﹁緭鍏ユ骞堕噸缃?
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // 键盘导航
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setIndex((i) => Math.min(i + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[index]) {
            results[index].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [results, index, onClose],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] transition-opacity duration-200"
      style={{
        background: visible ? 'rgba(10,8,5,0.5)' : 'rgba(10,8,5,0)',
      }}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg rounded-2xl border overflow-hidden transition-all duration-200 ${visible ? 'mark-ping' : ''}`}
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.12)',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(-14px) scale(0.96)',
          opacity: visible ? 1 : 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          className="flex items-center px-4 py-3.5 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            style={{ color: 'var(--accent)', marginRight: 12, flexShrink: 0 }}
          >
            <line x1="12.5" y1="12.5" x2="15" y2="15" />
            <circle cx="7" cy="7" r="5.5" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('cmdPalette.placeholder')}
            className="flex-1 outline-none text-[15px] bg-transparent"
            style={{ color: 'var(--text-primary)' }}
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setIndex(0);
              }}
              className="flex items-center justify-center w-5 h-5 rounded-md text-xs transition-colors"
              style={{ color: 'var(--text-dim)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="2" y1="2" x2="8" y2="8" />
                <line x1="8" y1="2" x2="2" y2="8" />
              </svg>
            </button>
          )}
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
              {t('cmdPalette.noResults')}
            </div>
          ) : (
            results.map((cmd, i) => (
              <div
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                onMouseEnter={() => setIndex(i)}
                className="flex items-center justify-between px-4 py-2 cursor-pointer text-[13px] transition-colors duration-75"
                style={{
                  background: i === index ? 'var(--accent)' : 'transparent',
                  color: i === index ? 'var(--accent-contrast)' : 'var(--text-primary)',
                  fontWeight: i === index ? 500 : 400,
                }}
              >
                <span>{cmd.label}</span>
                {cmd.category && (
                  <span
                    className="micro-label ml-4 shrink-0"
                    style={{
                      color: i === index ? 'var(--accent-contrast)' : 'var(--text-dim)',
                      opacity: i === index ? 0.85 : 1,
                    }}
                  >
                    {cmd.category}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div
          className="flex items-center gap-4 px-4 py-2.5 border-t"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-dim)',
            background: 'var(--bg-surface)',
          }}
        >
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
              ↑↓
            </kbd>
            <span className="micro-label">{t('cmdPalette.navigate')}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
              ↵
            </kbd>
            <span className="micro-label">{t('cmdPalette.execute')}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
              Esc
            </kbd>
            <span className="micro-label">{t('cmdPalette.close')}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * 娉ㄥ唽鎵€鏈夊彲鐢ㄥ懡浠?
 */
export function useRegisterCommands() {
  const setViewMode = useEditorStore((s) => s.setViewMode);
  const toggleFileTree = useEditorStore((s) => s.toggleFileTree);
  const setTheme = useEditorStore((s) => s.setTheme);
  const setHighlightTheme = useEditorStore((s) => s.setHighlightTheme);
  const setFont = useEditorStore((s) => s.setFont);
  const fontSize = useEditorStore((s) => s.fontSize);
  const setFontSize = useEditorStore((s) => s.setFontSize);
  const autoSave = useEditorStore((s) => s.autoSave);
  const setAutoSave = useEditorStore((s) => s.setAutoSave);
  const setLanguage = useEditorStore((s) => s.setLanguage);
  const language = useEditorStore((s) => s.language);
  const tabs = useWorkspaceStore((s) => s.openTabs);
  const activeTabPath = useWorkspaceStore((s) => s.activeTabPath);
  const t = useT();
  const registry = usePlugins();

  useEffect(() => {
    const hasActiveTab = Boolean(activeTabPath);
    const multipleTabs = tabs.length > 1;

    commands.clear();
    commands.registerAll([
      {
        id: 'plugins.manager',
        label: t('cmd.plugins.manager'),
        category: t('cmd.category.plugins'),
        keywords: ['extension', 'addon'],
        action: () => window.dispatchEvent(new CustomEvent('open-plugin-manager')),
      },
      {
        id: 'settings.open',
        label: t('cmd.settings.open'),
        category: t('cmd.category.settings'),
        keywords: ['preferences', 'options'],
        shortcut: 'Ctrl+,',
        action: () => window.dispatchEvent(new CustomEvent('open-settings')),
      },
      {
        id: 'file.new',
        label: t('cmd.file.new'),
        category: t('cmd.category.file'),
        keywords: ['create', 'document', 'untitled'],
        shortcut: 'Ctrl+N',
        action: () => createNewDocument(),
      },
      {
        id: 'file.open',
        label: t('cmd.file.open'),
        category: t('cmd.category.file'),
        keywords: ['load', 'recent'],
        shortcut: 'Ctrl+O',
        action: () => openFileFromDialog(),
      },
      {
        id: 'file.open-folder',
        label: t('cmd.file.openFolder'),
        category: t('cmd.category.file'),
        keywords: ['workspace', 'directory'],
        shortcut: 'Ctrl+Shift+O',
        action: () => openFolderFromDialog(),
      },
      {
        id: 'file.save',
        label: t('cmd.file.save'),
        category: t('cmd.category.file'),
        keywords: ['write'],
        shortcut: 'Ctrl+S',
        disabledReason: hasActiveTab ? null : t('cmd.disabled.noActiveFile'),
        action: () => saveActiveTab(),
      },
      {
        id: 'file.close-tab',
        label: t('cmd.file.closeTab'),
        category: t('cmd.category.file'),
        keywords: ['tab'],
        shortcut: 'Ctrl+W',
        disabledReason: hasActiveTab ? null : t('cmd.disabled.noActiveFile'),
        action: () => closeActiveTab(),
      },
      {
        id: 'tabs.next',
        label: t('cmd.tabs.next'),
        category: t('cmd.category.tabs'),
        keywords: ['switch'],
        shortcut: 'Ctrl+Tab',
        disabledReason: multipleTabs ? null : t('cmd.disabled.needMultipleTabs'),
        action: () => { activateNextTab(1); },
      },
      {
        id: 'tabs.previous',
        label: t('cmd.tabs.previous'),
        category: t('cmd.category.tabs'),
        keywords: ['switch'],
        shortcut: 'Ctrl+Shift+Tab',
        disabledReason: multipleTabs ? null : t('cmd.disabled.needMultipleTabs'),
        action: () => { activateNextTab(-1); },
      },
      {
        id: 'settings.toggle-auto-save',
        label: autoSave ? t('cmd.settings.autoSaveOff') : t('cmd.settings.autoSaveOn'),
        category: t('cmd.category.settings'),
        keywords: ['autosave', 'save'],
        action: () => setAutoSave(!autoSave),
      },
      {
        id: 'editor.font-size.increase',
        label: t('cmd.editor.increaseFontSize'),
        category: t('cmd.category.editor'),
        keywords: ['zoom', 'bigger'],
        shortcut: 'Ctrl++',
        action: () => setFontSize(Math.min(24, fontSize + 1)),
      },
      {
        id: 'editor.font-size.decrease',
        label: t('cmd.editor.decreaseFontSize'),
        category: t('cmd.category.editor'),
        keywords: ['zoom', 'smaller'],
        shortcut: 'Ctrl+-',
        action: () => setFontSize(Math.max(10, fontSize - 1)),
      },
      {
        id: 'editor.font-size.reset',
        label: t('cmd.editor.resetFontSize'),
        category: t('cmd.category.editor'),
        keywords: ['zoom', 'default'],
        action: () => setFontSize(14),
      },
      { id: 'view.source', label: t('cmd.view.source'), category: t('cmd.category.view'), keywords: ['edit', 'markdown'], action: () => setViewMode('source') },
      { id: 'view.preview', label: t('cmd.view.preview'), category: t('cmd.category.view'), keywords: ['render'], action: () => setViewMode('preview') },
      { id: 'view.split', label: t('cmd.view.split'), category: t('cmd.category.view'), keywords: ['side by side'], action: () => setViewMode('split') },
      { id: 'view.toggle-file-tree', label: t('cmd.view.toggleFileTree'), category: t('cmd.category.view'), keywords: ['sidebar', 'explorer'], action: toggleFileTree },
      { id: 'view.search', label: t('cmd.view.search'), category: t('cmd.category.view'), keywords: ['find', 'grep'], shortcut: 'Ctrl+Shift+F', action: () => window.dispatchEvent(new CustomEvent('toggle-search-panel')) },
      ...editorThemes.map((et) => ({ id: `theme.editor.${et.id}`, label: t(`editorTheme.${et.id}`), category: t('cmd.category.editorTheme'), keywords: ['theme', et.id], action: () => setTheme(et.id) })),
      ...editorFonts.map((f) => ({ id: `font.${f.id}`, label: t(`editorFont.${f.id}`), category: t('cmd.category.font'), keywords: ['font', f.id], action: () => setFont(f.id) })),
      ...highlightThemes.map((theme) => ({ id: `theme.highlight.${theme.id}`, label: `${t('cmd.category.highlight')}: ${t(`theme.${theme.id}`)}`, category: t('cmd.category.highlight'), keywords: ['syntax', 'highlight', theme.id], action: () => setHighlightTheme(theme.id) })),
      { id: 'language.en', label: `${t('cmd.category.language')}: ${t('language.en')}`, category: t('cmd.category.language'), keywords: ['english', 'locale'], action: () => setLanguage('en') },
      { id: 'language.zh', label: `${t('cmd.category.language')}: ${t('language.zh')}`, category: t('cmd.category.language'), keywords: ['chinese', 'locale'], action: () => setLanguage('zh') },
      ...registry.getAllCommands(),
    ]);
  }, [activeTabPath, autoSave, fontSize, language, registry.version, setAutoSave, setFont, setFontSize, setHighlightTheme, setLanguage, setTheme, setViewMode, t, tabs.length, toggleFileTree]);
}
