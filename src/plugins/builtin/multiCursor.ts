import { multiCursorKeymap } from '../../components/Editor/extensions/multiCursor';
import type { MarkEditPlugin } from '../../lib/pluginRegistry';

export function multiCursorPlugin(): MarkEditPlugin {
  return {
    id: 'core.multi-cursor',
    name: 'Multi Cursor',
    version: '1.0.0',
    description: 'Provides multi-cursor editing capabilities',
    extensions: multiCursorKeymap,
  };
}
