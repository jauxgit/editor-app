import { imageViewPlugin } from '../../components/Editor/extensions/imagePlugin';
import type { MarkEditPlugin } from '../../lib/pluginRegistry';

export function imageInlinePlugin(root: string | null): MarkEditPlugin {
  return {
    id: 'core.image-render',
    name: 'Image Inline Render',
    version: '1.0.0',
    description: 'Provides inline rendering for images in Markdown',
    extensions: imageViewPlugin(root),
  };
}
