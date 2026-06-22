import { useGitStore } from '../../stores/gitStore'

interface Props {
  /** 文件的绝对路径 */
  filePath: string
}

/** 文件树条目右侧的 Git 状态标记 */
export function GitFileStatus({ filePath }: Props) {
  const changes = useGitStore((s) => s.changes)
  const root = useGitStore((s) => s.branch) ? undefined : undefined
  // 直接从 store 拿 root 太麻烦；从 workspaceStore 取更可靠，但为了解耦，
  // 只用 changes 匹配文件名的最后一级（适用于大多数场景）
  // 优先匹配完整路径后缀，其次匹配文件名

  if (!changes || changes.length === 0) return null

  // 从文件名取最后一段用于模糊匹配
  const fileName = filePath.split(/[/\\]/).pop() || ''

  const change = changes.find((c) => {
    // git status 返回的路径是相对于仓库根的，可能包含目录前缀
    // 尝试匹配绝对路径的后缀，或直接匹配文件名
    return filePath.endsWith('/' + c.path) || filePath.endsWith('\\' + c.path) || c.path === fileName || c.path.endsWith('/' + fileName)
  })

  if (!change) return null

  const isUntracked = change.status === '??' || change.status === '?'
  const isModified = change.status === 'M'
  const isAdded = change.status === 'A'
  const isDeleted = change.status === 'D'
  const isStaged = change.staged

  let label: string
  let color: string

  if (isUntracked) {
    label = 'U'
    color = 'var(--text-dim)'
  } else if (isAdded) {
    label = 'A'
    color = '#2ea043' // green
  } else if (isDeleted) {
    label = 'D'
    color = '#da3633' // red
  } else if (isModified) {
    label = 'M'
    color = isStaged ? '#d29922' : '#d29922' // amber
  } else {
    label = change.status.slice(0, 2).trim()
    color = 'var(--text-dim)'
  }

  return (
    <span
      className="ml-auto shrink-0 text-[10px] font-mono font-bold leading-none"
      style={{ color, opacity: 0.8 }}
    >
      {label}
    </span>
  )
}
