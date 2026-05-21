import type { MarkEditPlugin } from '../../lib/pluginRegistry'
import { imageViewPlugin } from '../../components/Editor/extensions/imagePlugin'

export function imageInlinePlugin(root: string | null): MarkEditPlugin {
  return {
    id: 'core.image-render',
    name: 'Image Inline Render',
    version: '1.0.0',
    extensions: imageViewPlugin(root),
  }
}
