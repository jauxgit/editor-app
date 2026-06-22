import { create } from 'zustand'
import type { GitChange, GitLogEntry, GitResult } from '../types/electron'

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
