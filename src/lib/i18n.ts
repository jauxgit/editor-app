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

    // Confirm dialogs
    'confirm.unsavedTitle': 'Unsaved Changes',
    'confirm.unsavedMessage': 'Save changes to "{name}" before closing?',
    'confirm.save': 'Save',
    'confirm.discard': "Don't Save",
    'confirm.cancel': 'Cancel',
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
    'menu.settings': 'Settings...',
    'menu.pluginManager': 'Plugin Manager',
    'menu.about': 'About MarkEdit · 码记',
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

    // Sidebar tabs
    'sidebar.tabFiles': 'Files',
    'sidebar.tabOutline': 'Outline',

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
    'cmd.plugins.manager': 'Plugins: Manager',

    // Command categories
    'cmd.category.view': 'View',
    'cmd.category.file': 'File',
    'cmd.category.highlight': 'Highlight Theme',
    'cmd.category.editorTheme': 'Editor Theme',
    'cmd.category.font': 'Editor Font',
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

    // Editor theme names
    'editorTheme.warm-light': 'Warm Light',
    'editorTheme.warm-dark': 'Warm Dark',
    'editorTheme.nord': 'Nord',
    'editorTheme.tokyo-night': 'Tokyo Night',
    'editorTheme.paper': 'Paper',
    // Editor Fonts
    'editorFont.default': 'Default (IBM Plex + JetBrains Mono)',
    'editorFont.fira': 'Inter + Fira Code',
    'editorFont.cascadia': 'Cascadia Code',
    'editorFont.source': 'Source Sans + Source Code Pro',
    'editorFont.system': 'System UI',
    'editorFont.legacy': 'Segoe UI + Consolas',
    // TOC / Outline
    'toc.title': 'Outline',
    'toc.empty': 'No headings found',

    // Plugin Manager
    'plugin.title': 'Plugin Manager',
    'plugin.noPlugins': 'No plugins found.',
    'plugin.help': 'Place plugins in the plugins/ directory.',
    'plugin.openDir': 'Open Plugin Directory',
    'plugin.refresh': 'Refresh',
    'plugin.pluginsCount': '{n} plugins, {m} active',

    // Settings
    'settings.title': 'Settings',
    'settings.editor': 'Editor',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.fontSize': 'Font Size',
    'settings.font': 'Font',
    'settings.highlightTheme': 'Highlight Theme',

    // Drag and drop
    'drag.trust.title': 'Trust Folder',
    'drag.trust.message': 'Do you trust this folder and allow MarkEdit to read all files within it?\n\n{folder}',

    // About
    'about.description': 'A desktop Markdown editor that blends Sublime Text\'s multi-cursor power with Obsidian\'s rich content rendering. Built for notes, code, and everything in between.',
    'about.author': 'Developer & Designer',
    'about.close': 'Close',
    'about.checkUpdate': 'Check for Updates',
    'about.checking': 'Checking...',
    'about.latest': 'Already up to date (v{version})',
    'about.updateAvailable': 'New version v{latest} available',
    'about.download': 'Download',
    'about.checkFailed': 'Check failed, please try again',
    'about.downloading': 'Downloading... {percent}%',
    'about.downloadComplete': 'Download complete',
    'about.openFile': 'Open File',
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

    // Confirm dialogs
    'confirm.unsavedTitle': '未保存的更改',
    'confirm.unsavedMessage': '关闭前是否保存 "{name}" 的更改？',
    'confirm.save': '保存',
    'confirm.discard': '不保存',
    'confirm.cancel': '取消',
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
    'menu.settings': '设置...',
    'menu.pluginManager': '插件管理',
    'menu.about': '关于 MarkEdit · 码记',
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

    // Sidebar tabs
    'sidebar.tabFiles': '文件',
    'sidebar.tabOutline': '大纲',

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
    'cmd.plugins.manager': '插件: 管理',

    'cmd.category.view': '视图',
    'cmd.category.file': '文件',
    'cmd.category.highlight': '高亮主题',
    'cmd.category.editorTheme': '编辑器主题',
    'cmd.category.font': '编辑器字体',
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

    // Editor theme names
    'editorTheme.warm-light': '暖色亮白',
    'editorTheme.warm-dark': '暖色暗黑',
    'editorTheme.nord': '北欧极光',
    'editorTheme.tokyo-night': '东京之夜',
    'editorTheme.paper': '纸色书写',
    // Editor Fonts
    'editorFont.default': '默认 (IBM Plex + JetBrains Mono)',
    'editorFont.fira': 'Inter + Fira Code',
    'editorFont.cascadia': 'Cascadia Code',
    'editorFont.source': 'Source Sans + Source Code Pro',
    'editorFont.system': '系统默认',
    'editorFont.legacy': 'Segoe UI + Consolas',
    // TOC / Outline
    'toc.title': '目录',
    'toc.empty': '未找到标题',

    // Plugin Manager
    'plugin.title': '插件管理',
    'plugin.noPlugins': '未找到插件。',
    'plugin.help': '将插件放在 plugins/ 目录下。',
    'plugin.openDir': '打开插件目录',
    'plugin.refresh': '重新扫描',
    'plugin.pluginsCount': '{n} 个插件，{m} 个已启用',

    // Settings
    'settings.title': '设置',
    'settings.editor': '编辑器',
    'settings.theme': '主题',
    'settings.language': '语言',
    'settings.fontSize': '字号',
    'settings.font': '字体',
    'settings.highlightTheme': '高亮主题',

    // Drag and drop
    'drag.trust.title': '信任文件夹',
    'drag.trust.message': '是否信任此文件夹并允许 MarkEdit 读取其中的所有文件？\n\n{folder}',

    // About
    'about.description': '一款融合 Sublime Text 多光标编辑与 Obsidian 富内容渲染的桌面 Markdown 编辑器。专为笔记、代码和混合编辑而设计。',
    'about.author': '开发者与设计师',
    'about.close': '关闭',
    'about.checkUpdate': '检查更新',
    'about.checking': '正在检查...',
    'about.latest': '已是最新版本 (v{version})',
    'about.updateAvailable': '发现新版本 v{latest}',
    'about.download': '下载',
    'about.checkFailed': '检查失败，请重试',
    'about.downloading': '正在下载... {percent}%',
    'about.downloadComplete': '下载完成',
    'about.openFile': '打开文件',
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
