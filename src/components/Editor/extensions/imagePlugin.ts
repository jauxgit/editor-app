import { ViewPlugin, Decoration, WidgetType, type DecorationSet, type EditorView } from '@codemirror/view'
import { type RangeSetBuilder } from '@codemirror/state'
import { syntaxTree } from '@codemirror/language'

/**
 * 图片 Widget — 在编辑器中内联渲染图片
 * 替换 Markdown 的 ![](path) 语法节点为可交互的图片组件
 */
class ImageWidget extends WidgetType {
  private src: string
  private alt: string
  private workspaceRoot: string | null

  constructor(src: string, alt: string, workspaceRoot: string | null) {
    super()
    this.src = src
    this.alt = alt
    this.workspaceRoot = workspaceRoot
  }

  eq(other: ImageWidget): boolean {
    return this.src === other.src
  }

  toDOM(): HTMLElement {
    const wrapper = document.createElement('span')
    wrapper.className = 'cm-image-widget'
    wrapper.setAttribute('draggable', 'false')

    const img = document.createElement('img')
    img.alt = this.alt || 'image'
    img.loading = 'lazy'
    img.draggable = false

    // 路径解析：workspace 相对路径 → file:// 绝对路径
    if (this.src.startsWith('http://') || this.src.startsWith('https://') || this.src.startsWith('file://')) {
      img.src = this.src
    } else if (this.src.startsWith('data:')) {
      img.src = this.src
    } else if (this.workspaceRoot) {
      // 优先使用缩略图（assets/images/foo.png → assets/images/thumb/foo.png）
      const thumbSrc = this.src.replace(/^assets\/images\//, 'assets/images/thumb/')
      const absPath = this.workspaceRoot.replace(/\\/g, '/') + '/' + thumbSrc.replace(/\\/g, '/')
      img.src = 'file:///' + absPath.replace(/^\/+/, '')

      // 缩略图加载失败时回退到原图
      img.onerror = () => {
        if (img.src.includes('/thumb/')) {
          const fallbackPath = this.workspaceRoot!.replace(/\\/g, '/') + '/' + this.src.replace(/\\/g, '/')
          img.src = 'file:///' + fallbackPath.replace(/^\/+/, '')
          img.onerror = () => showPlaceholder()
        } else {
          showPlaceholder()
        }
      }

      const showPlaceholder = () => {
        wrapper.innerHTML = ''
        const placeholder = document.createElement('span')
        placeholder.style.cssText = `
          display: inline-block; padding: 8px 12px; border: 1px dashed #ef4444;
          border-radius: 6px; color: #ef4444; font-size: 13px;
        `
        placeholder.textContent = `\u{1F5BC} ${this.alt || this.src}`
        wrapper.appendChild(placeholder)
      }
    } else {
      // 无 workspace root：尝试直接作为相对 URL 加载
      img.src = this.src
    }

    wrapper.appendChild(img)

    // 点击选中 → 将光标定位到该图片的 Markdown 节点
    wrapper.addEventListener('click', (e) => {
      e.stopPropagation()
      // 切换选中状态
      const vm = (wrapper.closest('.cm-editor') as any)?.cmView?.view
      if (vm) {
        const isSelected = wrapper.classList.toggle('selected')
        if (!isSelected) {
          wrapper.classList.remove('selected')
        }
      }
    })

    // 双击 → 在系统查看器中打开原图（仅 Electron 环境）
    wrapper.addEventListener('dblclick', (e) => {
      e.stopPropagation()
      if (!this.workspaceRoot) return
      const absPath = this.workspaceRoot + '/' + this.src
      // 触发自定义事件，由上层处理
      window.dispatchEvent(new CustomEvent('image:dblclick', { detail: { path: absPath } }))
    })

    return wrapper
  }
}

/**
 * CodeMirror ViewPlugin：查找 Markdown 图片语法并替换为图片 Widget
 */
export function imageViewPlugin(workspaceRoot: string | null) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet
      root: string | null

      constructor(view: EditorView) {
        this.root = workspaceRoot
        this.decorations = this.buildDecorations(view)
      }

      update(update: any) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view)
        }
      }

      buildDecorations(view: EditorView): DecorationSet {
        const builder = new DecorationBuilder<Decoration>();
        const { from, to } = view.viewport
        const tree = syntaxTree(view.state)

        // 遍历可见范围内的语法树
        tree.iterate({
          from,
          to,
          enter: (node) => {
            // Markdown 图片语法在 CM6 的 markdown language 中对应 Image 节点
            if (node.name === 'Image') {
              // 提取 src 和 alt
              const text = view.state.doc.sliceString(node.from, node.to)
              const match = text.match(/^!\[([^\]]*)\]\(([^)]+)\)/)
              if (match) {
                const alt = match[1]
                const src = match[2]

                const widget = new ImageWidget(src, alt, this.root)
                // 用 widget 替换整个 ![](path) 节点，同时保留文本在 DOM 中不可见
                builder.add(
                  node.from,
                  node.to,
                  Decoration.replace({ widget, inclusive: false })
                )
              }
            }
          },
        })

        return builder.finish()
      }
    },
    {
      decorations: (v: any) => v.decorations,
    }
  )
}

/**
 * 简易 Decoration set builder（避免依赖 @codemirror/state 的内部 API）
 */
class DecorationBuilder<T extends Decoration> {
  private parts: { from: number; to: number; deco: T }[] = []

  add(from: number, to: number, deco: T) {
    this.parts.push({ from, to, deco })
    return this
  }

  finish(): DecorationSet {
    return Decoration.set(
      this.parts.map(p => p.deco.range(p.from, p.to)),
      true
    )
  }
}

/**
 * Markdown Image 语法树节点查找辅助
 */
export function findImageAtPos(view: EditorView, pos: number): { from: number; to: number; src: string; alt: string } | null {
  const tree = syntaxTree(view.state)
  let result: { from: number; to: number; src: string; alt: string } | null = null

  tree.iterate({
    from: pos,
    to: pos,
    enter: (node) => {
      if (node.name === 'Image' && pos >= node.from && pos <= node.to) {
        const text = view.state.doc.sliceString(node.from, node.to)
        const match = text.match(/^!\[([^\]]*)\]\(([^)]+)\)/)
        if (match) {
          result = { from: node.from, to: node.to, alt: match[1], src: match[2] }
        }
        return false
      }
    },
  })

  return result
}
