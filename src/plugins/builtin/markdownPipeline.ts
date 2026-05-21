import type { MarkEditPlugin } from '../../lib/pluginRegistry'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeHighlight from 'rehype-highlight'
import { rehypeMarkExplicitLanguage, rehypeCodeLabels } from '../../lib/rehype-code-labels'

export function markdownPipelinePlugin(): MarkEditPlugin {
  return {
    id: 'core.markdown-pipeline',
    name: 'Markdown Pipeline',
    version: '1.0.0',
    remarkPlugins: [[remarkGfm]],
    rehypePlugins: [
      [rehypeSlug],
      [rehypeMarkExplicitLanguage],
      [rehypeHighlight],
      [rehypeCodeLabels],
    ],
  }
}
