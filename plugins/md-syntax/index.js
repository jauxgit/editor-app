// MarkEdit 外置插件：MD 语法快捷插入
// 在编辑区右键菜单中添加 Heading、Bold、Code Block 等基础语法插入
// 需要 CM6, 通过 window.markeditAPI.getActiveEditorView() 访问编辑器

function getView() {
  return window.markeditAPI?.getActiveEditorView?.()
}

function insertAtCursor(text) {
  const view = getView()
  if (!view) return
  const { from, to } = view.state.selection.main
  view.dispatch(view.state.replaceSelection(text))
  view.focus()
}

function wrapSelection(before, after) {
  const view = getView()
  if (!view) return
  const { from, to } = view.state.selection.main
  const selected = view.state.sliceDoc(from, to)
  view.dispatch({
    changes: { from, to, insert: before + selected + after },
    selection: { anchor: from + before.length, head: from + before.length + selected.length },
  })
  view.focus()
}

function insertAtLineStart(prefix) {
  const view = getView()
  if (!view) return
  const { from } = view.state.selection.main
  const line = view.state.doc.lineAt(from)
  view.dispatch({
    changes: { from: line.from, to: line.from, insert: prefix },
  })
  view.focus()
}

export default {
  id: 'md-syntax',
  name: 'Markdown Syntax',
  version: '1.0.0',
  description: '编辑区右键菜单：插入 MD 基础语法',

  contextMenuItems: [
    // ── 标题 ──
    { id: 'md-syntax.h1', label: 'Heading 1', shortcut: '# ', action: () => insertAtLineStart('# ') },
    { id: 'md-syntax.h2', label: 'Heading 2', shortcut: '## ', action: () => insertAtLineStart('## ') },
    { id: 'md-syntax.h3', label: 'Heading 3', shortcut: '### ', action: () => insertAtLineStart('### ') },
    { id: 'md-syntax.h4', label: 'Heading 4', shortcut: '#### ', action: () => insertAtLineStart('#### ') },
    { id: 'md-syntax.h5', label: 'Heading 5', shortcut: '##### ', action: () => insertAtLineStart('##### ') },
    { id: 'md-syntax.h6', label: 'Heading 6', shortcut: '###### ', action: () => insertAtLineStart('###### ') },

    { id: 'md-syntax.div1', divider: true },

    // ── 行内样式 ──
    { id: 'md-syntax.bold', label: 'Bold', shortcut: '**B**', action: () => wrapSelection('**', '**') },
    { id: 'md-syntax.italic', label: 'Italic', shortcut: '*I*', action: () => wrapSelection('*', '*') },
    { id: 'md-syntax.code', label: 'Inline Code', shortcut: '`c`', action: () => wrapSelection('`', '`') },

    { id: 'md-syntax.div2', divider: true },

    // ── 块级 ──
    { id: 'md-syntax.code-block', label: 'Code Block', shortcut: '```', action: () => insertAtCursor('\n```\n\n```\n') },
    { id: 'md-syntax.link', label: 'Link', shortcut: '[]()', action: () => insertAtCursor('[](url)') },
    { id: 'md-syntax.image', label: 'Image', shortcut: '![]()', action: () => insertAtCursor('![](url)') },

    { id: 'md-syntax.div3', divider: true },

    // ── 列表 / 引用 / 分隔线 ──
    { id: 'md-syntax.ul', label: 'Bullet List', shortcut: '- ', action: () => insertAtLineStart('- ') },
    { id: 'md-syntax.ol', label: 'Numbered List', shortcut: '1. ', action: () => insertAtLineStart('1. ') },
    { id: 'md-syntax.quote', label: 'Blockquote', shortcut: '> ', action: () => insertAtLineStart('> ') },
    { id: 'md-syntax.hr', label: 'Horizontal Rule', shortcut: '---', action: () => insertAtLineStart('\n---\n') },
  ],
}
