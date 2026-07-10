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

function QuickButton({ title, description, onClick, children }: { title: string; description: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="group rounded-xl border p-4 text-left transition-all"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent)'
        e.currentTarget.style.background = 'var(--bg-elevated)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.background = 'var(--bg-surface)'
      }}
    >
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
        {children}
      </div>
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 text-xs leading-4" style={{ color: 'var(--text-dim)' }}>{description}</div>
    </button>
  )
}

function RecentList({ title, items, emptyText, onOpen }: { title: string; items: string[]; emptyText: string; onOpen: (path: string) => void }) {
  return (
    <section className="min-w-0">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>{title}</h3>
      <div className="space-y-1.5">
        {items.length === 0 ? (
          <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>{emptyText}</div>
        ) : items.map((path) => (
          <button
            key={path}
            onClick={() => onOpen(path)}
            className="block w-full rounded-lg border px-3 py-2 text-left transition-colors"
            style={{ borderColor: 'var(--border)', background: 'transparent' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="truncate text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{basename(path)}</div>
            <div className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--text-dim)' }}>{path}</div>
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
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex min-h-full max-w-5xl flex-col justify-center px-8 py-10">
        <div className="mb-8">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
            <svg width="30" height="30" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 6H8a2 2 0 0 0-2 2v32a2 2 0 0 0 2 2h32a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-6" />
              <polyline points="14,6 14,12 24,12 34,12 34,6" />
              <line x1="16" y1="22" x2="32" y2="22" />
              <line x1="16" y1="28" x2="28" y2="28" />
              <line x1="16" y1="34" x2="24" y2="34" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{t('home.title')}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{t('home.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <QuickButton title={t('home.openFolder')} description={t('home.openFolderDesc')} onClick={() => { void openFolderFromDialog() }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2l1.5 2h5.5A1.5 1.5 0 0 1 14 6.5v5A1.5 1.5 0 0 1 12.5 13h-9A1.5 1.5 0 0 1 2 11.5z" /></svg>
          </QuickButton>
          <QuickButton title={t('home.openFile')} description={t('home.openFileDesc')} onClick={() => { void openFileFromDialog() }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2.5A1.5 1.5 0 0 1 4.5 1h5l4 4v8.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 3 14.5z" /><polyline points="9.5,1 9.5,5 13.5,5" /></svg>
          </QuickButton>
          <QuickButton title={t('home.newDocument')} description={t('home.newDocumentDesc')} onClick={() => { void createNewDocument() }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 2.5A1.5 1.5 0 0 1 4.5 1h7A1.5 1.5 0 0 1 13 2.5v11a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 13.5z" /><line x1="8" y1="5" x2="8" y2="11" /><line x1="5" y1="8" x2="11" y2="8" /></svg>
          </QuickButton>
          <QuickButton title={t('home.commandPalette')} description={t('home.commandPaletteDesc')} onClick={onOpenCommandPalette}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2.5 4.5 6 8l-3.5 3.5" /><line x1="7.5" y1="11.5" x2="13.5" y2="11.5" /></svg>
          </QuickButton>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          <RecentList title={t('home.recentFiles')} emptyText={t('home.noRecentFiles')} items={recentFiles.slice(0, 5)} onOpen={(path) => { void openRecentFile(path) }} />
          <RecentList title={t('home.recentFolders')} emptyText={t('home.noRecentFolders')} items={recentFolders.slice(0, 5)} onOpen={openRecentFolder} />
        </div>
      </div>
    </div>
  )
}

