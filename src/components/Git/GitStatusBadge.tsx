import { useGitStore } from '../../stores/gitStore'

/**
 * 状态栏 Git 分支 + 变更数指示器。
 * 当当前工作区不是 git 仓库时返回 null。
 */
export function GitStatusBadge() {
  const branch = useGitStore((s) => s.branch)
  const changes = useGitStore((s) => s.changes)
  const isGitRepo = useGitStore((s) => s.isGitRepo)

  if (!isGitRepo || !branch) return null

  const changeCount = changes.length

  return (
    <span className="flex items-center gap-1.5">
      <svg
        width="12"
        height="12"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      >
        <circle cx="5" cy="5" r="2" />
        <circle cx="11" cy="13" r="2" />
        <line x1="7" y1="6" x2="10" y2="12" />
        <polyline points="11,5 14,5 14,8" />
        <line x1="14" y1="5" x2="9" y2="10" />
      </svg>
      <span>{branch}</span>
      {changeCount > 0 && (
        <span
          className="rounded px-1 py-0.5 font-medium"
          style={{
            background: 'var(--accent-muted)',
            color: 'var(--accent)',
            fontSize: '10px',
            lineHeight: '1.1',
          }}
        >
          +{changeCount}
        </span>
      )}
    </span>
  )
}
