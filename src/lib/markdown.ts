import { unified, type Plugin } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'
import { rehypeMarkExplicitLanguage, rehypeCodeLabels } from './rehype-code-labels'

// ===== URL 协议白名单 =====
// remark-rehype 会把 [x](javascript:...) 原样转成 <a href="javascript:...">，
// 预览又用 dangerouslySetInnerHTML 直出，点击即执行脚本。
// 原始 HTML 已由 allowDangerousHtml:false 转义，这里只处理链接/图片地址协议。
const LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])
const IMAGE_PROTOCOLS = new Set(['http:', 'https:', 'data:', 'blob:', 'file:', 'markedit:'])

function isAllowedUrl(raw: string, allowed: Set<string>): boolean {
  const trimmed = raw.trim()
  if (!trimmed) return false
  // 浏览器解析 URL 时会忽略控制字符/空白，这里按同样规则归一化后再判断协议
  let compact = ''
  for (const ch of trimmed) {
    const code = ch.codePointAt(0) ?? 0
    if (code > 0x20 && code !== 0x7f) compact += ch
  }
  const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(compact)
  if (!scheme) return true // 相对路径 / 锚点 / 查询串
  return allowed.has(`${scheme[1].toLowerCase()}:`)
}

interface HastNode {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

function sanitizeUrlAttributes(node: HastNode): void {
  if (node.type === 'element' && node.properties) {
    if (node.tagName === 'a') {
      const href = node.properties.href
      if (typeof href === 'string' && !isAllowedUrl(href, LINK_PROTOCOLS)) {
        delete node.properties.href
      }
    } else if (node.tagName === 'img') {
      const src = node.properties.src
      if (typeof src === 'string' && !isAllowedUrl(src, IMAGE_PROTOCOLS)) {
        delete node.properties.src
      }
    }
  }
  for (const child of node.children ?? []) sanitizeUrlAttributes(child)
}

function rehypeSafeUrls() {
  return (tree: HastNode) => sanitizeUrlAttributes(tree)
}

const defaultProcessor = (unified() as any)
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeSlug)
  .use(rehypeMarkExplicitLanguage)
  .use(rehypeHighlight)
  .use(rehypeCodeLabels)
  .use(rehypeSafeUrls)
  .use(rehypeStringify, { allowDangerousHtml: false })

/** 将单换行转换为 Markdown 软换行（`  \n` → `<br>`），保留段落分隔 `\n\n` */
function preprocessSoftBreaks(md: string): string {
  // 非代码块内的单 \n 替换为 空格+空格+\n（Markdown 软换行语法）
  return md.replace(/(?<!\n)\n(?!\n)/g, '  \n')
}

/** Markdown → HTML（remark/rehype 管线，processSync） */
export function renderMarkdown(md: string): string {
  const result = defaultProcessor.processSync(preprocessSoftBreaks(md))
  return String(result)
}

/** Markdown → HTML（接收动态插件） */
export function renderMarkdownWithPlugins(
  md: string,
  options: {
    remarkPlugins?: [Plugin, unknown?][]
    rehypePlugins?: [Plugin, unknown?][]
  }
): string {
  let processor: any = (unified() as any).use(remarkParse as any)

  for (const [plugin, opts] of options.remarkPlugins ?? []) {
    processor = processor.use(plugin as any, opts as any)
  }

  processor = processor.use(remarkRehype as any, { allowDangerousHtml: false })

  for (const [plugin, opts] of options.rehypePlugins ?? []) {
    processor = processor.use(plugin as any, opts as any)
  }

  processor = processor.use(rehypeSafeUrls)
  processor = processor.use(rehypeStringify as any, { allowDangerousHtml: false })
  const result = processor.processSync(preprocessSoftBreaks(md))
  return String(result)
}

/** 提取文档中所有图片引用 ![](path) */
export function extractImageRefs(md: string): string[] {
  const refs: string[] = []
  const re = /!\[[^\]]*\]\(([^)]+)\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(md)) !== null) {
    refs.push(m[1])
  }
  return refs
}
