import { keymap, EditorView } from '@codemirror/view'
import { EditorSelection, type SelectionRange } from '@codemirror/state'

/**
 * 在当前文档中查找下一个匹配项（从 pos 之后开始）
 */
function findNextMatch(
  view: EditorView,
  query: string,
  from: number
): { from: number; to: number } | null {
  const doc = view.state.doc.toString()
  // 大小写敏感搜索
  const idx = doc.indexOf(query, from + 1)
  if (idx === -1) return null
  return { from: idx, to: idx + query.length }
}

/**
 * Ctrl+D: 选中下一个与当前光标所在词匹配的文本
 * 如果已有选区，用选区内容搜索
 */
function selectNextOccurrence(view: EditorView): boolean {
  const { state } = view
  const ranges = state.selection.ranges

  // 获取当前选中的词（最后一个选区的内容）
  const lastRange = ranges[ranges.length - 1]
  let query: string

  if (lastRange.empty) {
    // 光标落在词上 → 选中整个词
    const wordRange = state.wordAt(lastRange.head)
    if (!wordRange) return false
    query = state.doc.sliceString(wordRange.from, wordRange.to)
    // 先选中当前词
    const newRanges = ranges.map((r, i) =>
      i === ranges.length - 1
        ? EditorSelection.range(wordRange.from, wordRange.to)
        : r
    )
    view.dispatch({ selection: EditorSelection.create(newRanges) })
    return true
  } else {
    query = state.doc.sliceString(lastRange.from, lastRange.to)
  }

  // 查找所有匹配项，添加新选区
  const lastTo = lastRange.to
  const match = findNextMatch(view, query, lastTo)
  if (!match) {
    // 循环回到开头
    const firstMatch = findNextMatch(view, query, -1)
    if (!firstMatch || firstMatch.from >= lastRange.from) return false
    view.dispatch({
      selection: state.selection.addRange(
        EditorSelection.range(firstMatch.from, firstMatch.to)
      ),
    })
    return true
  }

  view.dispatch({
    selection: state.selection.addRange(
      EditorSelection.range(match.from, match.to)
    ),
  })
  return true
}

/**
 * Esc: 清除所有选区，只保留主光标
 */
function clearMultipleSelections(view: EditorView): boolean {
  const { state } = view
  if (state.selection.ranges.length <= 1) return false

  view.dispatch({
    selection: EditorSelection.create([
      EditorSelection.cursor(state.selection.main.head),
    ]),
  })
  return true
}

/**
 * Alt+Down: 向下添加一个光标
 */
function addCursorBelow(view: EditorView): boolean {
  const range = view.state.selection.main
  const line = view.state.doc.lineAt(range.head)
  if (line.number >= view.state.doc.lines) return false

  const nextLine = view.state.doc.line(line.number + 1)
  const col = range.head - line.from
  const pos = Math.min(nextLine.from + col, nextLine.to)

  view.dispatch({
    selection: view.state.selection.addRange(EditorSelection.cursor(pos)),
  })
  return true
}

/**
 * Alt+Up: 向上添加一个光标
 */
function addCursorAbove(view: EditorView): boolean {
  const range = view.state.selection.main
  const line = view.state.doc.lineAt(range.head)
  if (line.number <= 1) return false

  const prevLine = view.state.doc.line(line.number - 1)
  const col = range.head - line.from
  const pos = Math.min(prevLine.from + col, prevLine.to)

  view.dispatch({
    selection: view.state.selection.addRange(EditorSelection.cursor(pos)),
  })
  return true
}

/**
 * Ctrl+Shift+K: 跳过当前主选区，将下一个设为主选区
 */
function skipCurrentSelection(view: EditorView): boolean {
  const { state } = view
  const ranges = state.selection.ranges
  if (ranges.length <= 1) return false

  const mainIdx = ranges.indexOf(state.selection.main)
  const nextIdx = (mainIdx + 1) % ranges.length

  view.dispatch({
    selection: EditorSelection.create(ranges, nextIdx),
  })
  return true
}

/**
 * 多光标增强键绑定
 */
export const multiCursorKeymap = keymap.of([
  {
    key: 'Ctrl-d',
    mac: 'Cmd-d',
    run: selectNextOccurrence,
    preventDefault: true,
  },
  {
    key: 'Escape',
    run: clearMultipleSelections,
  },
  {
    key: 'Alt-ArrowDown',
    run: addCursorBelow,
    preventDefault: true,
  },
  {
    key: 'Alt-ArrowUp',
    run: addCursorAbove,
    preventDefault: true,
  },
  {
    key: 'Ctrl-Shift-k',
    mac: 'Cmd-Shift-k',
    run: skipCurrentSelection,
    preventDefault: true,
  },
])
