# MarkEdit · 码记

> 一款融合 Sublime Text 多光标编辑与 Obsidian 富内容渲染的桌面端 Markdown 编辑器。

![Electron](https://img.shields.io/badge/Electron-42-blue) ![React](https://img.shields.io/badge/React-19-61dafb) ![CodeMirror](https://img.shields.io/badge/CodeMirror-6-c27f0e) ![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6) ![License](https://img.shields.io/badge/License-MIT-green)

---

## 功能特性

### 编辑器核心

- **CodeMirror 6** 编辑器内核 — 原生多光标编辑、Widget 扩展
- **多光标编辑**：Cmd+D 选词、Alt+↑↓ 添加上/下游标、列选择模式
- **Markdown 语法高亮** — 实时编辑区高亮 + 预览区完整渲染
- **有序列表自动续写** — Enter 自动生成下一序号
- **13 种代码块语言高亮** + 30+ 种文件扩展名全文高亮
- **Markdown 软换行** — 单 Enter 换行显示（符合笔记习惯）
- **图片拖入/粘贴** — 自动写入文件系统并内联渲染

### 视图模式

| 模式 | 说明                                                  |
| ---- | ----------------------------------------------------- |
| 源码 | 纯编辑视图，专注写作                                  |
| 预览 | 渲染后的 Markdown 预览（含代码高亮 + 语言标签 + TOC） |
| 分屏 | 编辑 + 预览同步滚动                                   |

### 界面

- **5 套完整主题**：Warm Light / Warm Dark / Nord / Tokyo Night / Paper，每套含完整 CSS 变量 + 语法高亮色
- **自定义 CM6 编辑器主题** — 暖色语法高亮，CSS 变量驱动
- **8 种 highlight.js 预览高亮主题** — 与编辑器主题自动联动
- **编辑区 ↔ 预览区滚动同步** — 分屏模式下同步滚动
- **文件树** — 递归展开、懒加载、SVG 图标、双击重命名、右键删除
- **多标签页** — 打开多个文件、脏状态指示器
- **命令面板** — Cmd+Shift+P 调出，支持语言/主题/高亮切换
- **自绘标题栏** — Windows frameless 模式，自绘窗口控制按钮
- **右键菜单** — MD 语法插入 + 外置插件扩展
- **关于对话框** — 作者 / GitHub / 技术栈信息
- **中英文界面切换**
- **字号调节** — Ctrl+滚轮 / 设置滑块（10px–24px）
- **字数统计** — 状态栏实时显示行数、词数（中文按字计）、字符数
- **Markdown 格式化工具栏** — 选中文本后弹出浮动工具栏（加粗/斜体/代码/链接/标题/列表/引用/分割线）
- **自动保存** — 默认开启 2 秒防抖自动写盘，可在设置中关闭
- **全局搜索** — Cmd+Shift+F 跨文件全文搜索，点击结果跳转到指定行**

### 文件系统

- **拖拽文件/文件夹**到窗口直接打开
- **拖拽文件/文件夹**到 exe 冷/热启动
- **单实例锁** — 防重复启动，拖到 exe 的文件路由到已有窗口
- **启动记忆** — 恢复左侧目录 + 最近打开的文件
- **新建文件**（有目录直接创建 / 无目录 untitled+另存为）

### 插件系统

- **PluginRegistry 插件注册表** — 统一管理 CM6 扩展、代码语言、remark/rehype 插件
- **外置插件热加载** — 通过自定义协议 `markedit://` 加载用户数据目录下的插件
- **右键菜单扩展** — 插件可注册自定义菜单项
- **键盘快捷键扩展** — 外置插件可注册 Cmd+B/I/1-6 等快捷键

---

## 技术栈

| 层            | 技术                                                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 桌面框架      | Electron 42                                                                                                                 |
| 编辑器内核    | CodeMirror 6（原生多光标、Widget 扩展）                                                                                     |
| UI 框架       | React 19 + TypeScript                                                                                                       |
| 样式          | Tailwind CSS 4                                                                                                              |
| 状态管理      | Zustand（persist 中间件持久化设置）                                                                                         |
| Markdown 解析 | remark/rehype 管线（`unified` + `remark-parse` + `remark-gfm` + `remark-rehype` + `rehype-highlight` + `rehype-stringify`） |
| 语法高亮      | CM6 Lezer（10+ 语言包）+ highlight.js（预览区）                                                                             |
| 国际化        | 自定义轻量 i18n 模块                                                                                                        |
| 打包          | Vite 8 + electron-builder 26                                                                                                |
| 字体          | IBM Plex Sans（UI）+ JetBrains Mono（代码）                                                                                 |

---

## 目录结构

```
editor-app/
├── build/                # 应用图标
├── plugins/              # 外置插件（开发时）/ 参考示例
├── electron/
│   ├── main.js            # Electron 主进程
│   └── preload.cjs        # preload 脚本（CommonJS）
├── src/
│   ├── main.tsx           # React 入口
│   ├── App.tsx
│   ├── index.css          # Tailwind + 设计系统（CSS 变量、噪声纹理）
│   ├── components/
│   │   ├── Editor/        # 编辑器组件（CM6 封装、图片处理、扩展）
│   │   ├── Preview/       # Markdown 预览组件
│   │   ├── FileTree/      # 文件树侧边栏
│   │   ├── Layout/        # AppLayout、TitleBar、CommandPalette
│   │   ├── Settings/      # 插件管理、关于对话框
│   │   └── ContextMenu/   # 通用右键菜单
│   ├── stores/            # Zustand 状态管理
│   ├── lib/               # 工具库（CM6 主题、Markdown 管线、i18n、插件注册表）
│   ├── plugins/           # 内置插件注册入口
│   └── types/             # TypeScript 类型声明
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

---

## 开始使用

### 开发模式

```bash
# 安装依赖
npm install

# 启动开发模式（Vite + Electron 并行启动）
npm run dev

# 仅构建前端
npm run build

# 打包为安装程序（完整构建 exe + asar + NSIS 安装包）
npm run dist
```

### 产物

```
release/
├── win-unpacked/                  # 免安装目录
├── MarkEdit.码记 0.1.0.exe        # 免安装便携版
└── MarkEdit.码记 Setup 0.1.0.exe  # NSIS 安装程序
```

---

## 开发说明

### 关键设计决策

- **自定义协议 `markedit://`** — 解决 Vite ESM + `file://` 协议的 CORS 和 MIME 问题
- **Preload 使用 CommonJS** — `electron/preload.cjs` 使用 `require`，避免 ESM 在 sandbox 环境中不稳定
- **Windows 自绘标题栏** — `frame: false` + `roundedCorners: true`，由 React 组件自绘控制按钮
- **Zustand persist** — `partialize` 持久化主题、语言等用户设置，`viewMode` 不持久化（默认源码模式）
- **滚动同步** — 使用 `requestAnimationFrame` 轮询而非 `scroll` 事件监听，避免 StrictMode 下 DOM 重建导致的事件丢失
- **插件系统** — `PluginRegistry` 单例模式，与 `CommandRegistry` 一致的全局单例

---

## License

MIT
