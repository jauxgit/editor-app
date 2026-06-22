import { useCallback } from 'react'
import { useT } from '../../lib/i18n'
import { useEditorStore } from '../../stores/editorStore'
import { useGitStore } from '../../stores/gitStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'

/**
 * 右侧 Git 变更面板 — 显示未提交文件列表，点击打开 diff 视图。
 * 视觉风格与左侧文件树保持一致。
 * 注意：显隐动画由父级 AppLayout 控制（width transition），
 * 此组件只负责渲染内容，不负责自己的显示/隐藏。
 */
export function ChangesPanel() {
  const t = useT()
  const changes = useGitStore((s) => s.changes)
  const isGitRepo = useGitStore((s) => s.isGitRepo)
  const branch = useGitStore((s) => s.branch)
  const toggleChangesPanel = useEditorStore((s) => s.toggleChangesPanel)
  const root = useWorkspaceStore((s) => s.root)

  const handleFileClick = useCallback((filePath: string, status: string) => {
    // 将相对路径转为绝对路径
    const absolutePath = root ? root.replace(/[\\/]$/, '') + '/' + filePath : filePath
    window.dispatchEvent(new CustomEvent('open-git-diff', {
      detail: { filePath: absolutePath, changeStatus: status },
    }))
  }, [root])

  return (
    <div
      className="shrink-0 border-l overflow-hidden flex flex-col"
      style={{
        width: '260px',
        borderColor: 'var(--border)',
        background: 'var(--bg-surface)',
        color: 'var(--text-secondary)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--accent)', opacity: 0.7 }}
          >
            <circle cx="5" cy="5" r="2" />
            <circle cx="11" cy="13" r="2" />
            <line x1="7" y1="6" x2="10" y2="12" />
            <polyline points="11,5 14,5 14,8" />
            <line x1="14" y1="5" x2="9" y2="10" />
          </svg>
          <span className="font-medium text-xs uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
            {t('changesPanel.title')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {branch && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
            >
              {branch}
            </span>
          )}
          <button
            onClick={toggleChangesPanel}
            className="flex items-center justify-center w-5 h-5 rounded transition-colors"
            style={{ color: 'var(--text-dim)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="2" y1="2" x2="8" y2="8" />
              <line x1="8" y1="2" x2="2" y2="8" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-0.5">
        {!isGitRepo ? (
          <div className="px-4 py-10 text-center text-xs" style={{ color: 'var(--text-dim)' }}>
            {t('changesPanel.notRepo')}
          </div>
        ) : changes.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs" style={{ color: 'var(--text-dim)' }}>
            <svg
              width="20" height="20" viewBox="0 0 16 16" fill="none"
              stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
              className="mx-auto mb-2" style={{ opacity: 0.3 }}
            >
              <polyline points="4,5 1,8 4,11" />
              <polyline points="12,5 15,8 12,11" />
              <line x1="9" y1="4" x2="7" y2="12" />
            </svg>
            <div>{t('changesPanel.empty')}</div>
          </div>
        ) : (
          <div>
            {changes.map((change, i) => {
              const isUntracked = change.status === '??' || change.status === '?'
              const isModified = change.status === 'M'
              const isAdded = change.status === 'A'
              const isDeleted = change.status === 'D'
              return (
                <div
                  key={i}
                  className="group flex items-center gap-2 px-4 py-1.5 cursor-pointer select-none transition-all duration-100 text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={() => handleFileClick(change.path, change.status)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  {/* Status letter */}
                  <span
                    className="shrink-0 font-mono font-bold w-5 text-center text-[10px]"
                    style={{
                      color: isUntracked ? 'var(--text-dim)' :
                             isModified ? '#d29922' :
                             isAdded ? '#2ea043' :
                             isDeleted ? '#da3633' :
                             'var(--text-dim)',
                    }}
                  >
                    {isUntracked ? 'U' : change.status}
                  </span>
                  {/* File path */}
                  <span className="truncate flex-1 min-w-0">
                    {change.path}
                  </span>
                  {/* Staged badge */}
                  {change.staged && (
                    <span
                      className="text-[9px] px-1 rounded shrink-0"
                      style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                    >
                      {t('git.staged')}
                    </span>
                  )}
                  {/* Diff icon on hover */}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    className="shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    <path d="M12 3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h1" />
                    <polyline points="11,1 8,4 5,1" />
                    <line x1="8" y1="4" x2="8" y2="11" />
                    <line x1="5" y1="8" x2="11" y2="8" />
                  </svg>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
