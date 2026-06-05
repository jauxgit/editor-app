import { unified, type Plugin } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'
import { rehypeMarkExplicitLanguage, rehypeCodeLabels } from './rehype-code-labels'

const defaultProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeSlug)
  .use(rehypeMarkExplicitLanguage)
  .use(rehypeHighlight)
  .use(rehypeCodeLabels)
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
  let processor = unified().use(remarkParse)

  for (const [plugin, opts] of options.remarkPlugins ?? []) {
    processor = processor.use(plugin, opts)
  }

  processor = processor.use(remarkRehype, { allowDangerousHtml: false })

  for (const [plugin, opts] of options.rehypePlugins ?? []) {
    processor = processor.use(plugin, opts)
  }

  processor = processor.use(rehypeStringify, { allowDangerousHtml: false })
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
