import type { MarkEditPlugin } from '../../lib/pluginRegistry'
import { multiCursorKeymap } from '../../components/Editor/extensions/multiCursor'

export function multiCursorPlugin(): MarkEditPlugin {
  return {
    id: 'core.multi-cursor',
    name: 'Multi Cursor',
    version: '1.0.0',
    extensions: multiCursorKeymap,
  }
}
