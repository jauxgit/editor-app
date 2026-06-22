import { create } from 'zustand'
import type { DiffLine, GitChange, GitLogEntry, GitResult } from '../types/electron'

export interface GitState {
  branch: string | null
  changes: GitChange[]
  log: GitLogEntry[]
  loading: boolean
  /** 当前根目录是否为 git 仓库 */
  isGitRepo: boolean
  /** 错误信息（非 git 仓库时置为 'not-a-repo'） */
  error: string | null

  /** 刷新当前根目录的 git 状态 */
  refreshStatus: (root: string) => Promise<void>
  /** 执行 commit */
  commit: (root: string, message: string) => Promise<boolean>
  /** git pull */
  pull: (root: string) => Promise<string>
  /** git push */
  push: (root: string) => Promise<string>
  /** 获取最近提交日志 */
  refreshLog: (root: string) => Promise<void>
  /** 获取某个文件的 unified diff */
  getDiff: (root: string, filePath: string, changeStatus: string) => Promise<DiffLine[]>
  /** 重置状态（例如根目录变化时） */
  reset: () => void
}

/** 解析 `git status --porcelain` 输出为 GitChange[] */
function parseStatusPorcelain(stdout: string): GitChange[] {
  const lines = stdout.split('\n').filter(Boolean)
  return lines.map((line) => {
    const staged = line[0] !== ' ' && line[0] !== '?'
    const status = line.substring(0, 2).trim() || '??'
    const path = line.substring(3).trim()
    return { path, status, staged }
  })
}

/** 解析 `git log --oneline --pretty=format:...` 输出 */
function parseLog(stdout: string): GitLogEntry[] {
  const lines = stdout.split('\n').filter(Boolean)
  return lines.map((line) => {
    const parts = line.split('\t')
    // format: hash\tauthor\tdate\tmessage
    if (parts.length >= 2) {
      return {
        hash: parts[0] || '',
        message: parts[parts.length - 1] || '',
        author: parts[1] || '',
        date: parts[2] || '',
      }
    }
    return { hash: line, message: line, author: '', date: '' }
  })
}

/** 解析 `git diff` unified diff 输出为 DiffLine[] */
function parseUnifiedDiff(stdout: string): DiffLine[] {
  const result: DiffLine[] = []
  const lines = stdout.split('\n')
  for (const rawLine of lines) {
    if (rawLine.startsWith('@@')) {
      result.push({ type: 'header', text: rawLine })
    } else if (rawLine.startsWith('---') || rawLine.startsWith('+++')) {
      result.push({ type: 'header', text: rawLine })
    } else if (rawLine.startsWith('+')) {
      result.push({ type: 'add', text: rawLine.slice(1) })
    } else if (rawLine.startsWith('-')) {
      result.push({ type: 'remove', text: rawLine.slice(1) })
    } else if (rawLine.startsWith(' ')) {
      result.push({ type: 'context', text: rawLine.slice(1) })
    }
  }
  return result
}

export const useGitStore = create<GitState>((set, get) => ({
  branch: null,
  changes: [],
  log: [],
  loading: false,
  isGitRepo: false,
  error: null,

  reset: () => {
    set({ branch: null, changes: [], log: [], loading: false, isGitRepo: false, error: null })
  },

  refreshStatus: async (root: string) => {
    const api = window.electronAPI
    if (!api) return

    set({ loading: true, error: null })

    // 先检查是否是 git 仓库
    const revParse: GitResult = await api.execGit(root, ['rev-parse', '--git-dir'])
    if (revParse.code !== 0) {
      set({ isGitRepo: false, branch: null, changes: [], loading: false, error: 'not-a-repo' })
      return
    }

    try {
      // 获取当前分支名
      const branchResult: GitResult = await api.execGit(root, ['branch', '--show-current'])
      const branch = branchResult.code === 0 ? branchResult.stdout.trim() : null

      // 获取变更状态
      const statusResult: GitResult = await api.execGit(root, ['status', '--porcelain'])
      const changes = statusResult.code === 0 ? parseStatusPorcelain(statusResult.stdout) : []

      set({ branch, changes, isGitRepo: true, loading: false, error: null })
    } catch {
      set({ isGitRepo: false, branch: null, changes: [], loading: false, error: 'error' })
    }
  },

  refreshLog: async (root: string) => {
    const api = window.electronAPI
    if (!api) return

    const result: GitResult = await api.execGit(root, [
      'log', '--oneline', '--pretty=format:%H\t%an\t%ai\t%s', '-n', '20',
    ])
    if (result.code === 0) {
      set({ log: parseLog(result.stdout) })
    }
  },

  getDiff: async (root: string, filePath: string, changeStatus: string): Promise<DiffLine[]> => {
    const api = window.electronAPI
    if (!api) return []

    // 未跟踪文件（??）— 全量新增
    if (changeStatus === '??' || changeStatus === '?') {
      try {
        const fileResult = await api.readFile(filePath)
        const lines = fileResult.content.split('\n')
        return [
          { type: 'header', text: '--- /dev/null' },
          { type: 'header', text: `+++ ${filePath.split('/').pop() || 'file'}` },
          { type: 'header', text: '@@ -0,0 +1,' + lines.length + ' @@' },
          ...lines.map((line) => ({ type: 'add' as const, text: line })),
        ]
      } catch {
        return [{ type: 'header', text: 'Error: Could not read file' }]
      }
    }

    // 已删除文件（D）— 从 HEAD 读原内容，全量删除
    if (changeStatus === 'D') {
      const repoRelative = filePath.replace(root, '').replace(/^[/\\]/, '')
      const result: GitResult = await api.execGit(root, ['show', `HEAD:${repoRelative}`])
      if (result.code === 0) {
        const lines = result.stdout.split('\n')
        return [
          { type: 'header', text: `--- ${filePath.split('/').pop() || 'file'}` },
          { type: 'header', text: '+++ /dev/null' },
          { type: 'header', text: '@@ -1,' + lines.length + ' +0,0 @@' },
          ...lines.map((line) => ({ type: 'remove' as const, text: line })),
        ]
      }
      return [{ type: 'header', text: 'Error: File no longer in HEAD' }]
    }

    // 普通 diff：三级回退
    // 1. git diff HEAD -- <file>    （工作区 vs HEAD）
    // 2. git diff --cached -- <file> （暂存区 vs HEAD）
    // 3. git diff -- <file>         （工作区 vs 暂存区）
    const repoRelative = filePath.replace(root, '').replace(/^[/\\]/, '')
    const r1: GitResult = await api.execGit(root, ['diff', 'HEAD', '--', repoRelative])
    if (r1.code === 0 && r1.stdout.trim()) return parseUnifiedDiff(r1.stdout)
    const r2: GitResult = await api.execGit(root, ['diff', '--cached', '--', repoRelative])
    if (r2.code === 0 && r2.stdout.trim()) return parseUnifiedDiff(r2.stdout)
    const r3: GitResult = await api.execGit(root, ['diff', '--', repoRelative])
    if (r3.code === 0 && r3.stdout.trim()) return parseUnifiedDiff(r3.stdout)

    return [{ type: 'header', text: 'No diff output available' }]
  },

  commit: async (root: string, message: string): Promise<boolean> => {
    const api = window.electronAPI
    if (!api) return false

    // stage all changes first
    const addResult: GitResult = await api.execGit(root, ['add', '-A'])
    if (addResult.code !== 0) return false

    // commit
    const commitResult: GitResult = await api.execGit(root, ['commit', '-m', message])
    if (commitResult.code !== 0) return false

    // 刷新状态
    await get().refreshStatus(root)
    return true
  },

  pull: async (root: string): Promise<string> => {
    const api = window.electronAPI
    if (!api) return ''
    const result: GitResult = await api.execGit(root, ['pull'])
    await get().refreshStatus(root)
    return result.stdout || result.stderr
  },

  push: async (root: string): Promise<string> => {
    const api = window.electronAPI
    if (!api) return ''
    const result: GitResult = await api.execGit(root, ['push'])
    return result.stdout || result.stderr
  },
}))
