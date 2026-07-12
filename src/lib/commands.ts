/** Command registry — actions available through the command palette. */
export interface Command {
  id: string
  label: string
  category?: string
  keywords?: string[]
  shortcut?: string
  disabledReason?: string | null
  action: () => unknown | Promise<unknown>
}

class CommandRegistry {
  private commands: Command[] = []

  register(cmd: Command) { this.commands.push(cmd) }
  registerAll(cmds: Command[]) { this.commands.push(...cmds) }
  clear() { this.commands = [] }

  search(query: string): Command[] {
    if (!query.trim()) return [...this.commands]
    const parts = query.toLowerCase().split(/\s+/).filter(Boolean)
    return this.commands.filter(c => {
      const target = `${c.label} ${c.category || ''} ${c.id} ${(c.keywords || []).join(' ')}`.toLowerCase()
      return parts.every(part => target.includes(part))
    })
  }

  getAll(): Command[] { return [...this.commands] }
}

export const commands = new CommandRegistry()

const activeEditorViews = new Set<import('@codemirror/view').EditorView>()

export function setActiveEditorView(view: import('@codemirror/view').EditorView) { activeEditorViews.add(view) }
export function removeActiveEditorView(view: import('@codemirror/view').EditorView) { activeEditorViews.delete(view) }
export function getActiveEditorView(): import('@codemirror/view').EditorView | null {
  let result: import('@codemirror/view').EditorView | null = null
  for (const v of activeEditorViews) result = v
  return result
}

/** Join dir + name with a single separator (Windows-safe for our listDir paths). */
export function joinPath(dir: string, name: string): string {
  return dir.replace(/[\\/]$/, '') + '/' + name
}

/**
 * Write a brand-new empty file under dir with the given name.
 * Returns the full path, or null on failure / name conflict.
 * Callers must provide the final filename (no auto "untitled.md").
 */
export async function writeNamedFile(dir: string, fileName: string): Promise<string | null> {
  if (!window.electronAPI) return null
  try {
    const entries = await window.electronAPI.listDir(dir)
    if (entries.some(e => e.name === fileName)) return null
    const filePath = joinPath(dir, fileName)
    await window.electronAPI.writeFile(filePath, '')
    return filePath
  } catch {
    return null
  }
}
