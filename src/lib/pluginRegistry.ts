import { useEffect, useReducer } from 'react'
import type { Extension } from '@codemirror/state'
import type { LanguageSupport, Language } from '@codemirror/language'
import type { Plugin } from 'unified'
import type { Command } from './commands'

export interface MarkEditPlugin {
  id: string
  name: string
  description?: string
  version: string

  /** CM6 扩展 */
  extensions?: Extension | Extension[]

  /** 命令面板命令 */
  commands?: Command[]

  /** 代码块语言支持 */
  codeLanguages?: Record<string, LanguageSupport>

  /** 文件扩展名 → 全文件语言支持（如 .java → java()） */
  fileExtensions?: Record<string, LanguageSupport>

  /** remark/rehype 管线插件 */
  remarkPlugins?: [Plugin, unknown?][]
  rehypePlugins?: [Plugin, unknown?][]

  /** 生命周期 */
  activate?: () => void | Promise<void>
  deactivate?: () => void | Promise<void>
}

class PluginRegistry {
  private plugins = new Map<string, MarkEditPlugin>()
  private activeIds = new Set<string>()
  private listeners = new Set<() => void>()
  private _version = 0

  get version() { return this._version }

  private notify() {
    for (const fn of this.listeners) fn()
  }

  private changed() {
    this._version++
    this.notify()
  }

  register(plugin: MarkEditPlugin) {
    this.plugins.set(plugin.id, plugin)
    this.activeIds.add(plugin.id)
    this.changed()
  }

  unregister(id: string) {
    this.plugins.delete(id)
    this.activeIds.delete(id)
    this.changed()
  }

  get(id: string): MarkEditPlugin | undefined {
    return this.plugins.get(id)
  }

  has(id: string): boolean {
    return this.plugins.has(id)
  }

  async activate(id: string) {
    const p = this.plugins.get(id)
    if (!p || this.activeIds.has(id)) return
    await p.activate?.()
    this.activeIds.add(id)
    this.changed()
  }

  async deactivate(id: string) {
    const p = this.plugins.get(id)
    if (!p || !this.activeIds.has(id)) return
    await p.deactivate?.()
    this.activeIds.delete(id)
    this.changed()
  }

  isActive(id: string): boolean {
    return this.activeIds.has(id)
  }

  /** 收集所有激活插件的 CM6 扩展（扁平化） */
  getAllExtensions(): Extension[] {
    const result: Extension[] = []
    for (const id of this.activeIds) {
      const p = this.plugins.get(id)
      if (p?.extensions) {
        const exts = Array.isArray(p.extensions) ? p.extensions : [p.extensions]
        result.push(...exts)
      }
    }
    return result
  }

  /** 收集所有激活插件的命令 */
  getAllCommands(): Command[] {
    const result: Command[] = []
    for (const id of this.activeIds) {
      const p = this.plugins.get(id)
      if (p?.commands) result.push(...p.commands)
    }
    return result
  }

  /** 合并所有激活插件的 codeLanguages（后者覆盖前者） */
  getCodeLanguages(): Record<string, LanguageSupport> {
    const result: Record<string, LanguageSupport> = {}
    for (const id of this.activeIds) {
      const p = this.plugins.get(id)
      if (p?.codeLanguages) Object.assign(result, p.codeLanguages)
    }
    return result
  }

  /** 构建 getCodeParser 函数供 @codemirror/lang-markdown 使用 */
  getCodeParser(): (info: string) => Language | null {
    const langs = this.getCodeLanguages()
    return (info: string): Language | null => {
      const lang = langs[info]
      return lang?.language ?? null
    }
  }

  /** 合并所有激活插件的 fileExtensions（后者覆盖前者） */
  getFileExtensions(): Record<string, LanguageSupport> {
    const result: Record<string, LanguageSupport> = {}
    for (const id of this.activeIds) {
      const p = this.plugins.get(id)
      if (p?.fileExtensions) Object.assign(result, p.fileExtensions)
    }
    return result
  }

  /** 根据文件路径查找对应的全文件 LanguageSupport，无匹配返回 null */
  getFileLanguage(path: string): LanguageSupport | null {
    const ext = '.' + path.split('.').pop()?.toLowerCase()
    if (!ext || ext === '.') return null
    const map = this.getFileExtensions()
    return map[ext] ?? null
  }

  /** 收集所有激活插件的 remark 插件 */
  getRemarkPlugins(): [Plugin, unknown?][] {
    const result: [Plugin, unknown?][] = []
    for (const id of this.activeIds) {
      const p = this.plugins.get(id)
      if (p?.remarkPlugins) result.push(...p.remarkPlugins)
    }
    return result
  }

  /** 收集所有激活插件的 rehype 插件 */
  getRehypePlugins(): [Plugin, unknown?][] {
    const result: [Plugin, unknown?][] = []
    for (const id of this.activeIds) {
      const p = this.plugins.get(id)
      if (p?.rehypePlugins) result.push(...p.rehypePlugins)
    }
    return result
  }

  /** React 订阅：注册表变更时通知组件重渲染。返回取消订阅函数 */
  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => { this.listeners.delete(fn) }
  }
}

export const pluginRegistry = new PluginRegistry()

/** React hook：订阅插件注册表变更 */
export function usePlugins(): PluginRegistry {
  const [, forceUpdate] = useReducer(x => x + 1, 0)
  useEffect(() => pluginRegistry.subscribe(forceUpdate), [])
  return pluginRegistry
}
