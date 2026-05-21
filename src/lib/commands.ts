/**
 * 命令注册表 — 所有可通过命令面板执行的操作
 */

export interface Command {
  id: string
  label: string
  category?: string
  action: () => void
}

class CommandRegistry {
  private commands: Command[] = []

  register(cmd: Command) {
    this.commands.push(cmd)
  }

  registerAll(cmds: Command[]) {
    this.commands.push(...cmds)
  }

  clear() {
    this.commands = []
  }

  /** 模糊搜索 */
  search(query: string): Command[] {
    if (!query.trim()) return [...this.commands]
    const q = query.toLowerCase()
    return this.commands.filter(c => {
      const target = `${c.label} ${c.category || ''} ${c.id}`.toLowerCase()
      // 每个查询词都必须匹配
      return q.split(/\s+/).every(part => target.includes(part))
    })
  }

  getAll(): Command[] {
    return [...this.commands]
  }
}

/** 全局命令注册表单例 */
export const commands = new CommandRegistry()

/** 当前活跃的 CM6 EditorView 引用（供菜单栏等外部调用 CM6 命令） */
let activeEditorView: import('@codemirror/view').EditorView | null = null

export function setActiveEditorView(view: import('@codemirror/view').EditorView | null) {
  activeEditorView = view
}

export function getActiveEditorView(): import('@codemirror/view').EditorView | null {
  return activeEditorView
}
