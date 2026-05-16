/**
 * 简易 Markdown → HTML 渲染器
 * 在生产环境中可替换为 remark/rehype 管线
 */

export function renderMarkdown(md: string): string {
  let html = md

  // 转义 HTML
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // 还原代码块中内容
  html = html.replace(/&lt;pre&gt;|&lt;code&gt;/g, '<pre><code>')
  html = html.replace(/&lt;\/code&gt;|&lt;\/pre&gt;/g, '</code></pre>')

  // 图片 ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')

  // 链接 [text](url)
  html = html.replace(/(?<!!)\[([^\]]*)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // 标题 (# → h1-h6)
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>')
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>')
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // 粗体 **text** / 斜体 *text*
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')

  // 行内代码 `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // 代码块 ```lang ... ```
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')

  // 水平线 --- ***
  html = html.replace(/^(---|\*\*\*)$/gm, '<hr />')

  // 引用 >
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')

  // 无序列表 - / *
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)\n(?!<li>)/g, '$1\n</ul>\n')
  html = html.replace(/(?<!<\/li>\n)(<li>)/g, '<ul>\n$1')

  // 有序列表 1.
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)\n(?!<li>)/g, '$1\n</ol>\n')

  // 段落（连续两行）
  html = html.replace(/\n\n+/g, '</p><p>')
  html = '<p>' + html + '</p>'

  // 清理空标签
  html = html.replace(/<p>\s*<\/p>/g, '')
  html = html.replace(/<p>(<h[1-6]>.+<\/h[1-6]>)<\/p>/g, '$1')
  html = html.replace(/<p>(<pre>.+<\/pre>)<\/p>/g, '$1')
  html = html.replace(/<p>(<ul>[\s\S]*?<\/ul>)<\/p>/g, '$1')
  html = html.replace(/<p>(<ol>[\s\S]*?<\/ol>)<\/p>/g, '$1')
  html = html.replace(/<p>(<blockquote>[\s\S]*?<\/blockquote>)<\/p>/g, '$1')
  html = html.replace(/<p>(<hr \/>)<\/p>/g, '$1')

  return html
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
