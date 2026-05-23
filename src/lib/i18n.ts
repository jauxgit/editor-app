export type Lang = 'en' | 'zh'

type Params = Record<string, string | number>

const messages: Record<Lang, Record<string, string>> = {
  en: {
    // Menu
    'menu.file': 'File',
    'menu.edit': 'Edit',
    'menu.view': 'View',
    'menu.newFile': 'New File',
    'menu.openFile': 'Open File...',
    'menu.openFolder': 'Open Folder...',
    'menu.save': 'Save',
    'menu.closeTab': 'Close Tab',
    'menu.exit': 'Exit',
    'menu.undo': 'Undo',
    'menu.redo': 'Redo',
    'menu.cut': 'Cut',
    'menu.copy': 'Copy',
    'menu.paste': 'Paste',
    'menu.selectAll': 'Select All',
    'menu.find': 'Find',
    'menu.replace': 'Replace',
    'menu.toggleFileTree': 'Toggle File Tree',
    'menu.sourceMode': 'Source Mode',
    'menu.previewMode': 'Preview Mode',
    'menu.splitMode': 'Split Mode',
    'menu.toggleTheme': 'Toggle Theme',
    'menu.commandPalette': 'Command Palette',
    'menu.help': 'Help',
    'menu.about': 'About MarkEdit',
    'menu.toggleDevTools': 'Toggle DevTools',
    'menu.zoomIn': 'Zoom In',
    'menu.zoomOut': 'Zoom Out',
    'menu.resetZoom': 'Reset Zoom',
    'menu.quit': 'Quit',

    // File dialog filters
    'dialog.markdown': 'Markdown',
    'dialog.allFiles': 'All Files',

    // Toolbar
    'toolbar.toggleFileTree': 'Toggle File Tree',
    'toolbar.source': 'Source',
    'toolbar.preview': 'Preview',
    'toolbar.split': 'Split',
    'toolbar.noFolderOpen': 'No folder open',

    // Status bar
    'status.lines': '{n} lines',
    'status.noFile': '—',
    'status.utf8': 'UTF-8',
    'status.markdown': 'Markdown',

    // Empty state
    'empty.title': 'Open a file to start',
    'empty.hint': 'Cmd+O Open File  |  Cmd+Shift+O Open Folder',

    // File tree
    'fileTree.title': 'Files',
    'fileTree.empty': 'Empty folder',
    'fileTree.hint': 'Open a folder to start',
    'fileTree.addFile': 'New File',

    // Command palette
    'cmdPalette.placeholder': 'Type a command...',
    'cmdPalette.noResults': 'No matching commands',
    'cmdPalette.navigate': '↑↓ Navigate',
    'cmdPalette.execute': '↵ Execute',
    'cmdPalette.close': 'Esc Close',

    // Command labels
    'cmd.view.source': 'View: Source Mode',
    'cmd.view.preview': 'View: Preview Mode',
    'cmd.view.split': 'View: Split Mode',
    'cmd.view.toggleFileTree': 'View: Toggle File Tree',
    'cmd.view.toggleTheme': 'View: Toggle Dark/Light Theme',
    'cmd.file.new': 'File: New File',
    'cmd.file.open': 'File: Open File',
    'cmd.file.openFolder': 'File: Open Folder',
    'cmd.file.save': 'File: Save',

    // Command categories
    'cmd.category.view': 'View',
    'cmd.category.file': 'File',
    'cmd.category.theme': 'Theme',
    'cmd.category.language': 'Language',

    // Language names
    'language.en': 'English',
    'language.zh': '中文',

    // Highlight themes (display names stay English — proper nouns)
    'theme.github-dark': 'GitHub Dark',
    'theme.github': 'GitHub',
    'theme.atom-one-dark': 'Atom One Dark',
    'theme.atom-one-light': 'Atom One Light',
    'theme.monokai': 'Monokai',
    'theme.night-owl': 'Night Owl',
    'theme.github-dark-dimmed': 'GitHub Dark Dimmed',
    'theme.a11y-light': 'A11y Light',

    // TOC / Outline
    'toc.title': 'Outline',

    // Drag and drop
    'drag.trust.title': 'Trust Folder',
    'drag.trust.message': 'Do you trust this folder and allow MarkEdit to read all files within it?\n\n{folder}',
  },
  zh: {
    'menu.file': '文件',
    'menu.edit': '编辑',
    'menu.view': '查看',
    'menu.newFile': '新建文件',
    'menu.openFile': '打开文件...',
    'menu.openFolder': '打开文件夹...',
    'menu.save': '保存',
    'menu.closeTab': '关闭标签',
    'menu.exit': '退出',
    'menu.undo': '撤销',
    'menu.redo': '重做',
    'menu.cut': '剪切',
    'menu.copy': '复制',
    'menu.paste': '粘贴',
    'menu.selectAll': '全选',
    'menu.find': '查找',
    'menu.replace': '替换',
    'menu.toggleFileTree': '切换文件树',
    'menu.sourceMode': '源码模式',
    'menu.previewMode': '预览模式',
    'menu.splitMode': '分屏模式',
    'menu.toggleTheme': '切换主题',
    'menu.commandPalette': '命令面板',
    'menu.help': '帮助',
    'menu.about': '关于 MarkEdit',
    'menu.toggleDevTools': '开发者工具',
    'menu.zoomIn': '放大',
    'menu.zoomOut': '缩小',
    'menu.resetZoom': '重置缩放',
    'menu.quit': '退出',

    'dialog.markdown': 'Markdown',
    'dialog.allFiles': '所有文件',

    'toolbar.toggleFileTree': '切换文件树',
    'toolbar.source': '源码',
    'toolbar.preview': '预览',
    'toolbar.split': '分屏',
    'toolbar.noFolderOpen': '未打开文件夹',

    'status.lines': '{n} 行',
    'status.noFile': '—',
    'status.utf8': 'UTF-8',
    'status.markdown': 'Markdown',

    'empty.title': '打开文件开始编辑',
    'empty.hint': 'Cmd+O 打开文件  |  Cmd+Shift+O 打开文件夹',

    'fileTree.title': '文件',
    'fileTree.empty': '空文件夹',
    'fileTree.hint': '打开文件夹开始',
    'fileTree.addFile': '新建文件',

    'cmdPalette.placeholder': '输入命令...',
    'cmdPalette.noResults': '无匹配命令',
    'cmdPalette.navigate': '↑↓ 导航',
    'cmdPalette.execute': '↵ 执行',
    'cmdPalette.close': 'Esc 关闭',

    'cmd.view.source': '视图: 源码模式',
    'cmd.view.preview': '视图: 预览模式',
    'cmd.view.split': '视图: 分屏模式',
    'cmd.view.toggleFileTree': '视图: 切换文件树',
    'cmd.view.toggleTheme': '视图: 切换明暗主题',
    'cmd.file.new': '文件: 新建文件',
    'cmd.file.open': '文件: 打开文件',
    'cmd.file.openFolder': '文件: 打开文件夹',
    'cmd.file.save': '文件: 保存',

    'cmd.category.view': '视图',
    'cmd.category.file': '文件',
    'cmd.category.theme': '主题',
    'cmd.category.language': '语言',

    'language.en': 'English',
    'language.zh': '中文',

    'theme.github-dark': 'GitHub Dark',
    'theme.github': 'GitHub',
    'theme.atom-one-dark': 'Atom One Dark',
    'theme.atom-one-light': 'Atom One Light',
    'theme.monokai': 'Monokai',
    'theme.night-owl': 'Night Owl',
    'theme.github-dark-dimmed': 'GitHub Dark Dimmed',
    'theme.a11y-light': 'A11y Light',

    // TOC / Outline
    'toc.title': '目录',

    // Drag and drop
    'drag.trust.title': '信任文件夹',
    'drag.trust.message': '是否信任此文件夹并允许 MarkEdit 读取其中的所有文件？\n\n{folder}',
  },
}

/** Direct lookup (for non-React contexts like Electron main process) */
export function translate(lang: Lang, key: string, params?: Params): string {
  let text = messages[lang]?.[key] ?? key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v))
    }
  }
  return text
}

/** Export for Electron main process — a plain object it can import */
export { messages }

/** React hook: returns a t() function bound to the current language */
import { useEditorStore } from '../stores/editorStore'

export function useT() {
  const lang = useEditorStore(s => s.language)
  return (key: string, params?: Params) => translate(lang, key, params)
}
