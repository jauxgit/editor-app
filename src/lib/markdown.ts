import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeStringify, { allowDangerousHtml: false })

/** Markdown → HTML（remark/rehype 管线，processSync） */
export function renderMarkdown(md: string): string {
  const result = processor.processSync(md)
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
