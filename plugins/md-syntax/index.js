// MarkEdit 外置插件：MD 语法快捷插入
// 在编辑区右键菜单中添加 Heading、Bold、Code Block 等基础语法插入
// 快捷键通过 window.markeditAPI.keymapOf() 注册为 CM6 扩展

function getView() {
  return window.markeditAPI?.getActiveEditorView?.()
}

function insertAtCursor(text) {
  const view = getView()
  if (!view) return false
  const { from, to } = view.state.selection.main
  view.dispatch(view.state.replaceSelection(text))
  view.focus()
  return true
}

function wrapSelection(before, after) {
  const view = getView()
  if (!view) return false
  const { from, to } = view.state.selection.main
  const selected = view.state.sliceDoc(from, to)
  view.dispatch({
    changes: { from, to, insert: before + selected + after },
    selection: { anchor: from + before.length, head: from + before.length + selected.length },
  })
  view.focus()
  return true
}

function insertAtLineStart(prefix) {
  const view = getView()
  if (!view) return false
  const { from } = view.state.selection.main
  const line = view.state.doc.lineAt(from)
  view.dispatch({
    changes: { from: line.from, to: line.from, insert: prefix },
    selection: { anchor: line.from + prefix.length },
  })
  view.focus()
  return true
}

const keyboardBindings = [
  // ── 行内样式 ──
  { key: 'Mod-b', run: () => wrapSelection('**', '**') },
  { key: 'Mod-i', run: () => wrapSelection('*', '*') },
  { key: 'Mod-`', run: () => wrapSelection('`', '`') },

  // ── 标题 ──
  { key: 'Mod-1', run: () => insertAtLineStart('# ') },
  { key: 'Mod-2', run: () => insertAtLineStart('## ') },
  { key: 'Mod-3', run: () => insertAtLineStart('### ') },
  { key: 'Mod-4', run: () => insertAtLineStart('#### ') },
  { key: 'Mod-5', run: () => insertAtLineStart('##### ') },
  { key: 'Mod-6', run: () => insertAtLineStart('###### ') },

  // ── 块级 ──
  { key: 'Mod-Shift-c', run: () => insertAtCursor('\n```\n\n```\n') },
  { key: 'Mod-Shift-l', run: () => insertAtCursor('[](url)') },
  { key: 'Mod-Shift-i', run: () => insertAtCursor('![](url)') },

  // ── 列表 / 引用 / 分隔线 ──
  { key: 'Mod-Shift--', run: () => insertAtLineStart('- ') },
  { key: 'Mod-Shift-1', run: () => insertAtLineStart('1. ') },
  { key: 'Mod->', run: () => insertAtLineStart('> ') },
  { key: 'Mod-Shift-x', run: () => insertAtLineStart('\n---\n') },
]

export default {
  id: 'md-syntax',
  name: 'Markdown Syntax',
  version: '1.0.0',
  description: '编辑区右键菜单：插入 MD 基础语法',

  // 注册 CM6 键盘快捷键扩展
  extensions: window.markeditAPI?.keymapOf(keyboardBindings),

  contextMenuItems: [
    // ── 标题 ──
    { id: 'md-syntax.h1', label: 'Heading 1', shortcut: 'Cmd+1', action: () => insertAtLineStart('# ') },
    { id: 'md-syntax.h2', label: 'Heading 2', shortcut: 'Cmd+2', action: () => insertAtLineStart('## ') },
    { id: 'md-syntax.h3', label: 'Heading 3', shortcut: 'Cmd+3', action: () => insertAtLineStart('### ') },
    { id: 'md-syntax.h4', label: 'Heading 4', shortcut: 'Cmd+4', action: () => insertAtLineStart('#### ') },
    { id: 'md-syntax.h5', label: 'Heading 5', shortcut: 'Cmd+5', action: () => insertAtLineStart('##### ') },
    { id: 'md-syntax.h6', label: 'Heading 6', shortcut: 'Cmd+6', action: () => insertAtLineStart('###### ') },

    { id: 'md-syntax.div1', divider: true },

    // ── 行内样式 ──
    { id: 'md-syntax.bold', label: 'Bold', shortcut: 'Cmd+B', action: () => wrapSelection('**', '**') },
    { id: 'md-syntax.italic', label: 'Italic', shortcut: 'Cmd+I', action: () => wrapSelection('*', '*') },
    { id: 'md-syntax.code', label: 'Inline Code', shortcut: 'Cmd+`', action: () => wrapSelection('`', '`') },

    { id: 'md-syntax.div2', divider: true },

    // ── 块级 ──
    { id: 'md-syntax.code-block', label: 'Code Block', shortcut: 'Cmd+Shift+C', action: () => insertAtCursor('\n```\n\n```\n') },
    { id: 'md-syntax.link', label: 'Link', shortcut: 'Cmd+Shift+L', action: () => insertAtCursor('[](url)') },
    { id: 'md-syntax.image', label: 'Image', shortcut: 'Cmd+Shift+I', action: () => insertAtCursor('![](url)') },

    { id: 'md-syntax.div3', divider: true },

    // ── 列表 / 引用 / 分隔线 ──
    { id: 'md-syntax.ul', label: 'Bullet List', shortcut: 'Cmd+Shift+-', action: () => insertAtLineStart('- ') },
    { id: 'md-syntax.ol', label: 'Numbered List', shortcut: 'Cmd+Shift+1', action: () => insertAtLineStart('1. ') },
    { id: 'md-syntax.quote', label: 'Blockquote', shortcut: 'Cmd+>', action: () => insertAtLineStart('> ') },
    { id: 'md-syntax.hr', label: 'Horizontal Rule', shortcut: 'Cmd+Shift+X', action: () => insertAtLineStart('\n---\n') },
  ],
}
