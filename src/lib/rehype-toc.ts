import type { Root, Element, Text } from 'hast'

interface TocEntry {
  id: string
  text: string
  level: number
  children: TocEntry[]
}

/** 递归提取元素内的纯文本内容 */
function extractText(node: Element): string {
  let result = ''
  for (const child of node.children) {
    if (child.type === 'text') {
      result += (child as Text).value
    } else if (child.type === 'element') {
      result += extractText(child as Element)
    }
  }
  return result
}

/**
 * 将扁平的标题列表按等级构建为嵌套树。
 * 等级跳跃时自动归入最近的高等级父节点。
 */
function buildTocTree(headings: { id: string; text: string; level: number }[]): TocEntry[] {
  const root: TocEntry[] = []
  const stack: TocEntry[] = []

  for (const h of headings) {
    const entry: TocEntry = { id: h.id, text: h.text, level: h.level, children: [] }

    // 弹出所有不低于当前等级的栈顶元素
    while (stack.length > 0 && stack[stack.length - 1].level >= h.level) {
      stack.pop()
    }

    if (stack.length === 0) {
      root.push(entry)
    } else {
      stack[stack.length - 1].children.push(entry)
    }
    stack.push(entry)
  }

  return root
}

/** 构建一级 <ul> 列表 */
function buildTocList(entries: TocEntry[]): Element {
  const items: Element[] = entries.map(entry => {
    const link: Element = {
      type: 'element',
      tagName: 'a',
      properties: { href: `#${entry.id}` },
      children: [{ type: 'text', value: entry.text }],
    }

    const children: Element[] = [link]
    if (entry.children.length > 0) {
      children.push(buildTocList(entry.children))
    }

    return {
      type: 'element',
      tagName: 'li',
      properties: { className: [`toc-level-h${entry.level}`] },
      children,
    } as Element
  })

  return {
    type: 'element',
    tagName: 'ul',
    properties: {},
    children: items,
  } as Element
}

/** 创建完整的 TOC <nav> 元素（每次调用返回新实例，支持多个 [TOC] 共存） */
function createTocElement(entries: TocEntry[]): Element {
  return {
    type: 'element',
    tagName: 'nav',
    properties: { className: ['toc-inline'] },
    children: [buildTocList(entries)],
  } as Element
}

/** 遍历 hast 树（替代 unist-util-visit，减少依赖） */
function visitElement(tree: Element, fn: (node: Element, index: number, parent: Element) => void): void {
  const children = tree.children
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (child.type === 'element') {
      fn(child as Element, i, tree)
      visitElement(child as Element, fn)
    }
  }
}

/**
 * rehype 插件：将 `[TOC]` 标记段落替换为文档标题的嵌套目录。
 * 依赖 rehype-slug 注入的 id 属性，必须置于 rehype-slug 之后。
 *
 * 行为：
 * - 无标题时 [TOC] 段落保留原样
 * - 多个 [TOC] 各自替换为完整目录
 * - 代码块内的 [TOC] 不受影响
 */
export function rehypeToc() {
  return function (tree: Root): void {
    // Step 1: 收集所有标题
    const headings: { id: string; text: string; level: number }[] = []
    visitElement(tree as unknown as Element, (node: Element) => {
      const match = node.tagName?.match(/^h([1-6])$/)
      if (!match) return
      const id = (node.properties?.id as string) || ''
      if (!id) return
      headings.push({ id, text: extractText(node), level: parseInt(match[1], 10) })
    })

    if (headings.length === 0) return

    // 构建嵌套树（只做一次）
    const tocTree = buildTocTree(headings)

    // Step 2: 替换所有 [TOC] 段落
    visitElement(tree as unknown as Element, (node: Element, index: number, parent: Element) => {
      if (node.tagName !== 'p') return
      const text = extractText(node).trim()
      if (text !== '[TOC]') return

      // 替换为 TOC（每次生成新实例）
      parent.children[index] = createTocElement(tocTree)
    })
  }
}
