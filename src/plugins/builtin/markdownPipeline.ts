import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import type { MarkEditPlugin } from '../../lib/pluginRegistry';
import { rehypeCodeLabels, rehypeMarkExplicitLanguage } from '../../lib/rehype-code-labels';
import { rehypeToc } from '../../lib/rehype-toc';

export function markdownPipelinePlugin(): MarkEditPlugin {
  return {
    id: 'core.markdown-pipeline',
    name: 'Markdown Pipeline',
    description: 'Provides a default remark/rehype pipeline for Markdown processing',
    version: '1.0.0',
    remarkPlugins: [[remarkGfm as any]],
    rehypePlugins: [
      [rehypeSlug as any],
      [rehypeToc as any],
      [rehypeMarkExplicitLanguage as any],
      [rehypeHighlight as any],
      [rehypeCodeLabels as any],
    ],
  };
}
