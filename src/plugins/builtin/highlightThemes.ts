import type { MarkEditPlugin } from '../../lib/pluginRegistry';

/** 高亮主题切换 — 命令在 CommandPalette 中通过 i18n 动态注册，插件仅作追踪 */
export function highlightThemePlugin(): MarkEditPlugin {
  return {
    id: 'core.highlight-themes',
    name: 'Highlight Themes',
    description: 'Provides commands to switch code block highlight themes',
    version: '1.0.0',
  };
}
