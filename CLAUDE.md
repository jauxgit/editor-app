# MarkEdit — 混合笔记编辑器

## 项目概述

桌面端 Markdown 编辑器，融合 Sublime Text 的多光标能力和 Obsidian 的富内容渲染。
- **应用形态**：Electron 桌面应用（Windows/macOS/Linux）
- **编辑器定位**：笔记 + 代码混合编辑，Markdown 为主格式
- **核心差异化**：多光标编辑、图片内联渲染、源码↔预览即时切换

## 技术栈

| 层 | 技术 |
|---|------|
| 桌面框架 | Electron 42 |
| 编辑器内核 | CodeMirror 6（原生多光标、Widget 扩展机制） |
| UI 框架 | React 19 + TypeScript |
| 样式 | Tailwind CSS 4 |
| 状态管理 | Zustand |
| Markdown 解析 | 自研简易渲染器 `src/lib/markdown.ts`（可升级为 remark/rehype） |
| 语法高亮 | CM6 Lezer + `@codemirror/lang-*` |
| 打包 | Vite 8 + electron-builder 26 |

## 目录结构

```
editor-app/
├── electron/
│   ├── main.js           # Electron 主进程（窗口/菜单/IPC/自定义协议）⚠️ JS文件，不能写TS类型
│   ├── preload.cjs       # ⚠️ 必须是 CommonJS！ESM 在 sandbox preload 中不稳定
│   └── preload.js        # 旧版（已废弃，保留作参考）
├── src/
│   ├── main.tsx           # React 入口
│   ├── App.tsx
│   ├── index.css          # Tailwind + 全局样式（CM6/预览/滚动条/图片Widget）
│   ├── components/
│   │   ├── Editor/
│   │   │   ├── EditorWrapper.tsx       # CM6 React 封装（核心组件）
│   │   │   ├── ImageDropHandler.tsx    # 图片拖入/粘贴 → IPC 写文件
│   │   │   └── extensions/
│   │   │       ├── imagePlugin.ts      # CM6 ViewPlugin：内联渲染图片 Widget
│   │   │       └── multiCursor.ts      # 多光标增强键绑定
│   │   ├── FileTree/FileTree.tsx       # 文件树侧边栏
│   │   ├── Preview/MarkdownPreview.tsx # Markdown 渲染预览
│   │   └── Layout/
│   │       ├── AppLayout.tsx           # 主布局（工具栏/标签/分屏/状态栏）
│   │       └── CommandPalette.tsx      # Cmd+Shift+P 命令面板
│   ├── stores/
│   │   ├── workspaceStore.ts  # 工作区根路径、打开文件标签、内容状态
│   │   ├── editorStore.ts     # 视图模式(source/preview/split)、主题
│   │   └── imageStore.ts      # 图片记录索引
│   ├── lib/
│   │   ├── markdown.ts        # Markdown→HTML 渲染器
│   │   └── commands.ts        # 命令注册表（命令面板用）
│   └── types/
│       └── electron.d.ts      # window.electronAPI 类型声明
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

## 运行方式

```bash
# 开发模式（Vite + Electron 并行启动）
npm run dev

# 仅构建前端
npm run build

# 打包（electron-builder，因 winCodeSign 问题大概率失败，见下文）
npm run dist
```

## 打包方案（重要）

**electron-builder 在 Windows 上存在两个已知问题**，官方打包流程不可用。手动流程如下：

```bash
# 1. 构建前端
npx vite build

# 2. 用 electron-builder 仅创建 unpacked 目录（Electron 二进制+壳）
#    winCodeSign 的 7-Zip 解压会因符号链接权限失败，但目录已生成
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
npx electron-builder --win dir
# ↑ 这一步大概率报错退出，但 release/win-unpacked/ 已创建

# 3. 手动打包 ASAR（electron-builder 不会正确包含 dist/ 和 electron/）
rm -rf .staging && mkdir -p .staging/dist .staging/electron
cp -r dist/* .staging/dist/
cp -r electron/* .staging/electron/
cp package.json .staging/
cp -r node_modules .staging/
npx asar pack .staging release/win-unpacked/resources/app.asar

# 4. 压缩为便携版
powershell -Command "Compress-Archive -Path 'release\win-unpacked\*' -DestinationPath 'release\MarkEdit-portable-win32-x64.zip' -Force"
```

产物：`release/win-unpacked/MarkEdit.exe`（可直接运行）、`release/MarkEdit-portable-win32-x64.zip`

## 踩坑记录 & 关键设计决策

### 1. 自定义协议 (markedit://) — 解决 ESM 的 CORS + MIME 问题
**问题 1**：Vite 构建产物使用 `<script type="module">`。直接用 `win.loadFile()` 加载 `file://` 协议时，Chromium 对 ESM 做 CORS 校验，`file://` 没有 HTTP 头 → 拒绝加载。

**问题 2**：第一版用 `protocol.handle('markedit', ...)` + `net.fetch('file:///...')`，但 `net.fetch` 返回的 Response 不带 `Content-Type` 头。Chromium 严格要求 `type="module"` 脚本的 MIME 为 `text/javascript`，否则拒绝执行 → React 没启动 → 白屏。

**最终方案**：`protocol.handle` 中用 `readFile()` 手动读文件，根据扩展名设置正确的 `Content-Type`：

```js
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  // ...
}
return new Response(data, { status: 200, headers: { 'Content-Type': mime } })
```

### 2. Preload 必须用 CommonJS
`electron/preload.cjs` 使用 `require('electron')` 而不是 `import`。
**原因**：Electron 的 sandboxed preload 环境对 ESM 支持不稳定，`import` 会导致 preload 静默失败 → `window.electronAPI` 为 `undefined` → 所有 IPC 失效（打开文件、保存、图片操作全部无响应）。

### 3. electron/main.js 不能写 TypeScript 类型注解
`package.json` 设了 `"type": "module"`，`main.js` 被 Node.js 作为 ESM 直接解析执行。
**如果在 JS 文件里写 `const foo: Record<string, string>`，Node.js ESM loader 抛出 `SyntaxError: Missing initializer in const declaration`，进程直接崩溃。**

### 4. Electron builder ASAR 文件缺失
`electron-builder --win dir` 创建的 `app.asar` 只含 `node_modules/`，缺少 `dist/`、`electron/`、`package.json`。
**原因**：electron-builder 26 的文件 glob 匹配机制有 bug，`"files": ["dist/**/*", "electron/**/*", "package.json"]` 配置不生效。
**修法**：手动 `asar pack` 组装。

### 5. Ctrl+O 快捷键被 CodeMirror 拦截
CodeMirror 6 内置了 Ctrl+O 键绑定（在当前行下方插入新行），会吃掉按键事件，Electron 菜单的 `accelerator: 'CmdOrCtrl+O'` 收不到信号。
**修法**：在 AppLayout 的全局 `keydown` handler 中拦截 Ctrl+O / Ctrl+Shift+O，直接通过 IPC 调用 `dialog:openFile` / `dialog:openFolder`。

### 6. 图片存储策略
- Electron 环境：拖入/粘贴图片 → 读 base64 → IPC 调用 `image:writeBase64` → 主进程用 `nativeImage` 生成缩略图 → 写入 `assets/images/` 和 `assets/images/thumb/`
- 浏览器环境（fallback）：base64 内联
- CM6 Image Widget 优先加载缩略图，失败时回退原图

### 7. indentWithTab 不能直接放在 extensions 数组中
`indentWithTab`（来自 `@codemirror/commands`）是一个 `KeyBinding` 对象 `{ key: "Tab", run: indentMore, shift: indentLess }`，**不是 Extension**。直接放在 `extensions` 数组中会导致 CodeMirror 在遍历扩展时无法识别该对象（不属于 CompartmentInstance/PrecExtension/StateField/FacetProvider，也没有 `.extension` 属性），抛出 `"Unrecognized extension value in extension set"` → **编辑器创建失败 → 白屏**。
**修法**：将 `indentWithTab` 移入 `keymap.of([...])` 内部，与 `defaultKeymap`、`historyKeymap` 等放在一起。

### 8. codeLanguages 必须传入函数而非普通对象
`@codemirror/lang-markdown` v6.5 的 `codeLanguages` 选项接受两种形式：
- 函数 `(info: string) => LanguageSupport | null`
- 数组/可迭代对象

传入 `Record<string, LanguageSupport>` 普通对象会在 `LanguageDescription.matchLanguageName()` 中对它做 `for...of` 迭代，JavaScript 普通对象不可迭代 → `"descs is not iterable"` → **编辑器创建失败**。
**修法**：将 `codeLanguages` 声明为模块级 `Record`，传入一个 `getCodeParser(info: string)` 查表函数。
同时也避免了 `createCodeLanguages()` 在每次渲染时重建 `LanguageSupport` 实例的性能问题。

## 已实现功能

| 功能 | 状态 | 关键文件 |
|------|------|---------|
| 多光标编辑（Cmd+D、Alt+↑↓、列选择） | ✅ | `multiCursor.ts` |
| 图片拖入/粘贴 + 文件系统存储 | ✅ | `ImageDropHandler.tsx`, `main.js` (image:writeBase64) |
| 图片内联渲染（CM6 Widget） | ✅ | `imagePlugin.ts` |
| 源码 / 预览 / 分屏三种视图 | ✅ | `AppLayout.tsx`, `MarkdownPreview.tsx` |
| 暗色/亮色主题 | ✅ | `editorStore.ts`, `index.css` |
| 文件树 + 多标签 + 脏状态 | ✅ | `FileTree.tsx`, `workspaceStore.ts` |
| Cmd+S 保存、Ctrl+O 打开文件/文件夹 | ✅ | `EditorWrapper.tsx`, `AppLayout.tsx` |
| 命令面板 (Cmd+Shift+P) | ✅ | `CommandPalette.tsx`, `commands.ts` |
| 代码块语法高亮（JS/TS/Python/JSON/CSS/HTML） | ✅ | `EditorWrapper.tsx` getCodeParser() |
| 文件树递归展开子目录（懒加载） | ✅ | `FileTree.tsx` TreeNode |
| 编辑↔预览滚动同步 | ✅ | `EditorWrapper.tsx` onScrollChange |

## IPC 接口清单

| Channel | 方向 | 用途 |
|---------|------|------|
| `dialog:openFile` | renderer→main | 渲染进程主动弹文件选择框（返回 {path, content} 或 null） |
| `dialog:openFolder` | renderer→main | 渲染进程主动弹文件夹选择框（返回 {path} 或 null） |
| `file:read` | renderer→main | 读文件内容 |
| `file:write` | renderer→main | 写文件内容 |
| `file:saveDialog` | renderer→main | 弹出另存为对话框 |
| `dir:list` | renderer→main | 列出目录内容 |
| `dir:ensure` | renderer→main | 确保目录存在 |
| `image:copy` | renderer→main | 从本地路径复制图片到 assets |
| `image:writeBase64` | renderer→main | 从 base64 写入图片文件 + 生成缩略图 |
| `app:getPath` | renderer→main | 获取系统文档路径 |
| `file:opened` | main→renderer | 菜单 File>Open 完成后推送 |
| `folder:opened` | main→renderer | 菜单 File>Open Folder 完成后推送 |
| `menu:save` | main→renderer | 菜单 File>Save 点击时推送 |

## 待实现（优先级排序）

1. **图片粘贴的真实文件系统写入**：当前 ImageDropHandler 优先走 IPC，但需要 Electron 环境。纯浏览器退化为 base64。
2. **暗色预览主题完善**：预览 CSS 已有基础 dark 覆盖，但不够全面
3. **插件系统**：CM6 扩展机制可作为插件基础
4. **大文件优化**：流式加载、虚拟滚动
5. **Git 集成**、**AI 辅助**
