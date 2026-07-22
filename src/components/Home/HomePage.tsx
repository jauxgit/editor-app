import type { ReactNode } from 'react'
import { createNewDocument, openFileFromDialog, openFolderFromDialog, openRecentFile, openRecentFolder } from '../../lib/workspaceActions'
import { useT } from '../../lib/i18n'
import { useEditorStore } from '../../stores/editorStore'

interface Props {
  onOpenCommandPalette: () => void
}

function basename(path: string) {
  return path.split(/[/\\]/).filter(Boolean).pop() || path
}

function QuickAction({ title, description, shortcut, onClick, children }: { title: string; description: string; shortcut?: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 rounded-lg px-4 py-3 text-left transition-all duration-150 w-full"
      style={{ color: 'var(--text-primary)' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors duration-150"
        style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
      >
        {children}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold leading-5">{title}</span>
        <span className="mt-0.5 block text-xs leading-4" style={{ color: 'var(--text-dim)' }}>{description}</span>
      </span>
      {shortcut && (
        <kbd
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-dim)', border: '1px solid var(--border-light)' }}
        >
          {shortcut}
        </kbd>
      )}
    </button>
  )
}

function RecentList({ title, items, emptyText, onOpen }: { title: string; items: string[]; emptyText: string; onOpen: (path: string) => void }) {
  return (
    <section className="min-w-0">
      <h3 className="micro-label mb-2 px-1">{title}</h3>
      <div className="space-y-px">
        {items.length === 0 ? (
          <div className="px-3 py-2.5 text-xs" style={{ color: 'var(--text-dim)' }}>{emptyText}</div>
        ) : items.map((path) => (
          <button
            key={path}
            onClick={() => onOpen(path)}
            className="group block w-full rounded-md px-3 py-2 text-left transition-colors duration-100"
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="truncate text-[13px] font-medium leading-5 transition-colors" style={{ color: 'var(--text-primary)' }}>
              {basename(path)}
            </div>
            <div className="truncate text-[11px] leading-4" style={{ color: 'var(--text-dim)' }}>{path}</div>
          </button>
        ))}
      </div>
    </section>
  )
}

export function HomePage({ onOpenCommandPalette }: Props) {
  const t = useT()
  const recentFiles = useEditorStore((s) => s.recentFiles)
  const recentFolders = useEditorStore((s) => s.recentFolders)

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-elevated)' }}>
      <div className="mx-auto grid min-h-full max-w-5xl grid-cols-1 gap-12 px-10 py-14 md:grid-cols-[1.15fr_1fr] md:gap-16">
        {/* ——— 左列：品牌字标 + 快速操作 ——— */}
        <div className="flex flex-col justify-center">
          <div className="mb-3 flex items-center gap-4">
            {/* 几何 mark：折页文档 + 焦橙书签 */}
            <span className="relative shrink-0" style={{ width: 46, height: 46 }}>
              <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
                <rect x="7" y="5" width="32" height="36" rx="6" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                <path d="M7 11a6 6 0 0 1 6-6h14L39 17v18a6 6 0 0 1-6 6H13a6 6 0 0 1-6-6V11z" fill="var(--bg-elevated)" stroke="var(--border)" strokeWidth="1.5" />
                <path d="M27 5l12 12h-9a3 3 0 0 1-3-3V5z" fill="var(--accent)" />
                <line x1="14" y1="24" x2="32" y2="24" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" />
                <line x1="14" y1="30" x2="27" y2="30" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              </svg>
            </span>
            {/* 字标：中文 + 英文上下组合 */}
            <span className="flex flex-col leading-none">
              <span
                className="font-extrabold tracking-tight"
                style={{ color: 'var(--text-primary)', fontSize: 40, letterSpacing: '-0.02em', lineHeight: 1 }}
              >
                码记
              </span>
              <span
                className="mt-1.5 font-semibold"
                style={{ color: 'var(--accent)', fontSize: 13, letterSpacing: '0.34em' }}
              >
                MARKEDIT
              </span>
            </span>
          </div>
          <p className="mb-10 mt-4 max-w-md text-[15px] leading-7" style={{ color: 'var(--text-secondary)' }}>
            {t('home.subtitle')}
          </p>

          <div className="space-y-1">
            <QuickAction
              title={t('home.openFolder')}
              description={t('home.openFolderDesc')}
              shortcut="Ctrl+Shift+O"
              onClick={() => { void openFolderFromDialog() }}
            >
              <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2l1.5 2h5.5A1.5 1.5 0 0 1 14 6.5v5A1.5 1.5 0 0 1 12.5 13h-9A1.5 1.5 0 0 1 2 11.5z" /></svg>
            </QuickAction>
            <QuickAction
              title={t('home.openFile')}
              description={t('home.openFileDesc')}
              shortcut="Ctrl+O"
              onClick={() => { void openFileFromDialog() }}
            >
              <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2.5A1.5 1.5 0 0 1 4.5 1h5l4 4v8.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 3 14.5z" /><polyline points="9.5,1 9.5,5 13.5,5" /></svg>
            </QuickAction>
            <QuickAction
              title={t('home.newDocument')}
              description={t('home.newDocumentDesc')}
              shortcut="Ctrl+N"
              onClick={() => { void createNewDocument() }}
            >
              <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 2.5A1.5 1.5 0 0 1 4.5 1h7A1.5 1.5 0 0 1 13 2.5v11a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 13.5z" /><line x1="8" y1="5" x2="8" y2="11" /><line x1="5" y1="8" x2="11" y2="8" /></svg>
            </QuickAction>
            <QuickAction
              title={t('home.commandPalette')}
              description={t('home.commandPaletteDesc')}
              shortcut="Ctrl+Shift+P"
              onClick={onOpenCommandPalette}
            >
              <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2.5 4.5 6 8l-3.5 3.5" /><line x1="7.5" y1="11.5" x2="13.5" y2="11.5" /></svg>
            </QuickAction>
          </div>
        </div>

        {/* ——— 右列：最近记录 ——— */}
        <div className="flex flex-col justify-center border-l pl-10" style={{ borderColor: 'var(--border-light)' }}>
          <div className="space-y-8">
            <RecentList title={t('home.recentFiles')} emptyText={t('home.noRecentFiles')} items={recentFiles.slice(0, 5)} onOpen={(path) => { void openRecentFile(path) }} />
            <RecentList title={t('home.recentFolders')} emptyText={t('home.noRecentFolders')} items={recentFolders.slice(0, 5)} onOpen={openRecentFolder} />
          </div>
        </div>
      </div>
    </div>
  )
}
