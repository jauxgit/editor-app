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

/**
 * 当前活跃的 CM6 EditorView 引用集合（供菜单栏等外部调用 CM6 命令）。
 * 使用 Set 而非单一引用以支持多实例（如分屏模式）：
 * 一个实例卸载时不会错误地清掉另一个实例的引用。
 */
const activeEditorViews = new Set<import('@codemirror/view').EditorView>()

export function setActiveEditorView(view: import('@codemirror/view').EditorView) {
  activeEditorViews.add(view)
}

export function removeActiveEditorView(view: import('@codemirror/view').EditorView) {
  activeEditorViews.delete(view)
}

export function getActiveEditorView(): import('@codemirror/view').EditorView | null {
  // 取 Set 中最后一个加入的 view（类似栈顶）
  let result: import('@codemirror/view').EditorView | null = null
  for (const v of activeEditorViews) {
    result = v
  }
  return result
}

/**
 * 在指定目录下创建一个新的 untitled MD 文件。
 * 自动递增后缀避免重名：untitled.md → untitled-2.md → untitled-3.md ...
 * 返回创建的文件路径，失败返回 null。
 */
export async function createNewFile(dir: string): Promise<string | null> {
  if (!window.electronAPI) return null
  try {
    const entries = await window.electronAPI.listDir(dir)
    const names = new Set(entries.map(e => e.name))

    let counter = 1
    while (names.has(counter === 1 ? 'untitled.md' : `untitled-${counter}.md`)) {
      counter++
    }
    const filename = counter === 1 ? 'untitled.md' : `untitled-${counter}.md`
    const filePath = dir.replace(/[\\/]$/, '') + '/' + filename

    await window.electronAPI.writeFile(filePath, '')
    return filePath
  } catch {
    return null
  }
}
