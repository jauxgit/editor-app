import { app, BrowserWindow, ipcMain, dialog, Menu, nativeImage, net, protocol, shell } from 'electron'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile, writeFile, readdir, mkdir, copyFile, rename, unlink, rm } from 'node:fs/promises'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'markedit',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
])

// ===== 单实例锁：处理拖拽到 exe 的情况 =====
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    const win = BrowserWindow.getAllWindows()[0]
    if (!win) return
    processExternalArgs(commandLine, win)
    if (win.isMinimized()) win.restore()
    win.focus()
  })
}

function processExternalArgs(argv, win) {
  // argv: [exe, ...] or [electron, main.js, ...]
  // Skip the executable path(s) — find args that look like file paths
  for (const arg of argv) {
    if (!arg || arg === process.execPath) continue
    if (!existsSync(arg)) continue
    try {
      const stat = statSync(arg)
      if (stat.isDirectory()) {
        win.webContents.send('folder:opened', { path: arg })
      } else if (stat.isFile()) {
        const content = readFileSync(arg, 'utf-8')
        win.webContents.send('file:opened', { path: arg, content })
      }
    } catch {
      // Skip binary/unreadable files silently
    }
  }
}

const isDev = !app.isPackaged

function getElectronDir() {
  if (isDev) {
    return dirname(fileURLToPath(import.meta.url))
  }
  return join(app.getAppPath(), 'electron')
}

function getDistDir() {
  if (isDev) {
    return join(dirname(fileURLToPath(import.meta.url)), '../dist')
  }
  return join(app.getAppPath(), 'dist')
}

const electronDir = getElectronDir()
const distDir = getDistDir()
// 插件目录：dev 时在项目根目录，打包后在 exe 同级目录
const pluginsDir = isDev
  ? join(dirname(dirname(fileURLToPath(import.meta.url))), 'plugins')
  : join(dirname(process.execPath), 'plugins')

// ===== 自定义协议：serve dist 文件 + 插件文件 =====
function registerCustomProtocol() {
  protocol.handle('markedit', async (request) => {
    const url = new URL(request.url)
    let filePath

    // 插件文件路由：markedit://plugins/<plugin-id>/<path>
    if (url.host === 'plugins') {
      // 安全校验：只允许 plugins 目录下的文件
      const pluginFilePath = join(pluginsDir, url.pathname)
      if (!pluginFilePath.startsWith(pluginsDir)) {
        return new Response('Forbidden', { status: 403 })
      }
      filePath = pluginFilePath
    } else {
      // 普通 dist 文件
      filePath = join(distDir, url.pathname === '/' ? '/index.html' : url.pathname)
    }

    try {
      const data = await readFile(filePath)
      const ext = extname(filePath).toLowerCase()
      const mimeMap = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
      }
      const contentType = mimeMap[ext] || 'application/octet-stream'
      return new Response(data, {
        headers: { 'Content-Type': contentType },
      })
    } catch {
      return new Response('Not Found', { status: 404 })
    }
  })
}

// ===== 创建窗口 =====
function createWindow() {
  // Windows 和 macOS 采用不同的标题栏方案
  const isWindows = process.platform === 'win32'
  const winOptions = {
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 500,
    title: 'MarkEdit · 码记',
    icon: join(electronDir, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: join(electronDir, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  }

  if (isWindows) {
    // Windows: 无边框窗口。窗口控制按钮由 React 自绘（跟随 CSS 变量，无帧重建）
    winOptions.frame = false
    winOptions.roundedCorners = true
  } else {
    // macOS: 隐藏标题栏，保留红绿灯按钮
    winOptions.titleBarStyle = 'hiddenInset'
  }

  const win = new BrowserWindow(winOptions)

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadURL('markedit:///index.html')
  }

  Menu.setApplicationMenu(null)

  // ===== 外部链接处理：强制使用系统默认浏览器打开 =====
  const handleExternalNav = (url) => {
    const internalPrefixes = ['http://localhost:5173', 'markedit://', 'file://']
    if (internalPrefixes.some(p => url.startsWith(p))) return false
    shell.openExternal(url)
    return true
  }

  win.webContents.on('will-navigate', (event, url) => {
    if (handleExternalNav(url)) event.preventDefault()
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    handleExternalNav(url)
    return { action: 'deny' }
  })

  return win
}

// ===== IPC Handlers =====

// 获取启动参数（用于双击打开文件/文件夹）
ipcMain.handle('app:getStartupArgs', () => {
  // 跳过 process.execPath，只返回文件/文件夹路径
  return process.argv
    .filter(arg => arg && arg !== process.execPath)
    .map(arg => {
      try {
        const stat = statSync(arg)
        if (stat.isDirectory()) return { type: 'folder', path: arg }
        if (stat.isFile()) {
          // 读取文件内容，确保渲染进程打开时不是空白
          try {
            const content = readFileSync(arg, 'utf-8')
            return { type: 'file', path: arg, content }
          } catch {
            // 二进制或不可读文件，返回空内容
            return { type: 'file', path: arg, content: '' }
          }
        }
        return null
      } catch {
        return null
      }
    })
    .filter(Boolean)
})

// 文件操作
ipcMain.handle('file:read', async (_e, filePath) => {
  const content = await readFile(filePath, 'utf-8')
  return { path: filePath, content }
})

ipcMain.handle('file:write', async (_e, filePath, content) => {
  await writeFile(filePath, content, 'utf-8')
  return true
})

ipcMain.handle('file:saveDialog', async (_e, defaultPath) => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return null
  const result = await dialog.showSaveDialog(win, {
    title: 'Save As',
    defaultPath,
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: 'Text', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })
  return result.canceled ? null : result.filePath
})

ipcMain.handle('file:rename', async (_e, oldPath, newPath) => {
  try {
    await rename(oldPath, newPath)
    return true
  } catch {
    return false
  }
})

ipcMain.handle('file:delete', async (_e, filePath) => {
  try {
    await unlink(filePath)
    return true
  } catch {
    return false
  }
})

ipcMain.handle('dir:delete', async (_e, dirPath) => {
  try {
    await rm(dirPath, { recursive: true, force: true })
    return true
  } catch {
    return false
  }
})

// 对话框
ipcMain.handle('dialog:openFile', async () => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return null
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown', 'txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const filePath = result.filePaths[0]
  const content = await readFile(filePath, 'utf-8')
  return { path: filePath, content }
})

ipcMain.handle('dialog:openFolder', async () => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return null
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return { path: result.filePaths[0] }
})

// 目录操作
ipcMain.handle('dir:list', async (_e, dirPath) => {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true })
    // 按类型排序：目录在前，文件在后，各按名称排序
    const dirs = entries.filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))
    const files = entries.filter(e => !e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))
    return [...dirs, ...files].map(e => ({
      name: e.name,
      path: join(dirPath, e.name),
      isDirectory: e.isDirectory(),
    }))
  } catch {
    return []
  }
})

ipcMain.handle('dir:ensure', async (_e, dirPath) => {
  await mkdir(dirPath, { recursive: true })
  return true
})

// 确认对话框（用于文件夹信任提示）
ipcMain.handle('dialog:confirm', async (_e, message, title) => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return false
  const result = await dialog.showMessageBox(win, {
    type: 'warning',
    title: title || 'Confirm',
    message,
    buttons: ['Cancel', 'Trust'],
    defaultId: 0,
    cancelId: 0,
  })
  return result.response === 1
})

// 未保存更改确认对话框（保存 / 不保存 / 取消）
ipcMain.handle('dialog:confirmUnsaved', async (_e, message, title) => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return 'cancel'
  const result = await dialog.showMessageBox(win, {
    type: 'warning',
    title: title || 'Unsaved Changes',
    message,
    buttons: ['Save', "Don't Save", 'Cancel'],
    defaultId: 0,
    cancelId: 2,
  })
  const actions = ['save', 'discard', 'cancel']
  return actions[result.response] || 'cancel'
})

// 图片处理
ipcMain.handle('image:copy', async (_e, sourcePath, workspaceRoot) => {
  const imagesDir = join(workspaceRoot, 'assets', 'images')
  const thumbsDir = join(workspaceRoot, 'assets', 'images', 'thumb')
  await mkdir(imagesDir, { recursive: true })
  await mkdir(thumbsDir, { recursive: true })

  const hash = createHash('md5').update(sourcePath + Date.now()).digest('hex').slice(0, 8)
  const ext = extname(sourcePath)
  const filename = `${hash}${ext}`
  const destPath = join(imagesDir, filename)

  await copyFile(sourcePath, destPath)

  // 生成缩略图（通过 nativeImage）
  const img = nativeImage.createFromPath(destPath)
  if (!img.isEmpty()) {
    const thumb = img.resize({ width: 200 })
    const thumbFilename = `${hash}_thumb${ext}`
    await writeFile(join(thumbsDir, thumbFilename), thumb.toPNG())
  }

  return { filename, path: destPath }
})

ipcMain.handle('image:writeBase64', async (_e, workspaceRoot, base64Data, filename) => {
  const imagesDir = join(workspaceRoot, 'assets', 'images')
  const thumbsDir = join(workspaceRoot, 'assets', 'images', 'thumb')
  await mkdir(imagesDir, { recursive: true })
  await mkdir(thumbsDir, { recursive: true })

  // 从 base64 解析格式
  const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/)
  const ext = matches ? `.${matches[1]}` : '.png'
  const data = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64Data, 'base64')

  const hash = createHash('md5').update(base64Data.slice(0, 100) + Date.now()).digest('hex').slice(0, 8)
  const imageFilename = filename || `${hash}${ext}`
  const destPath = join(imagesDir, imageFilename)

  await writeFile(destPath, data)

  // 缩略图
  const img = nativeImage.createFromPath(destPath)
  if (!img.isEmpty()) {
    const thumb = img.resize({ width: 200 })
    const thumbFilename = `${hash}_thumb${ext}`
    await writeFile(join(thumbsDir, thumbFilename), thumb.toPNG())
  }

  return { filename: imageFilename, path: destPath }
})

// 系统路径
ipcMain.handle('app:getPath', () => {
  return app.getPath('documents')
})

// 语言切换 → 重建菜单
ipcMain.on('language:changed', (_e, lang) => {
  // 可在后续需要时重建 Electron 菜单
})

// 插件系统
ipcMain.handle('plugins:openDir', async () => {
  try {
    await mkdir(pluginsDir, { recursive: true })
    await shell.openPath(pluginsDir)
  } catch {
    // 静默失败
  }
})

ipcMain.handle('plugins:scan', async () => {
  try {
    await mkdir(pluginsDir, { recursive: true })
    const entries = await readdir(pluginsDir, { withFileTypes: true })
    const plugins = []
    for (const entry of entries) {
      if (entry.isDirectory()) {
        // 先尝试 manifest.json（新版），再尝试 plugin.json（旧版兼容）
        let manifest = null
        for (const name of ['manifest.json', 'plugin.json']) {
          const fp = join(pluginsDir, entry.name, name)
          try {
            manifest = JSON.parse(await readFile(fp, 'utf-8'))
            break
          } catch { /* try next */ }
        }
        if (manifest) {
          plugins.push({
            id: entry.name,
            name: manifest.name || entry.name,
            version: manifest.version || '0.0.0',
            description: manifest.description || '',
            entry: manifest.entry || manifest.main || 'index.js',
          })
        } else {
          // 无任何 manifest 文件，尝试直接加载 index.js
          plugins.push({
            id: entry.name,
            name: entry.name,
            version: '0.0.0',
            description: '',
            entry: 'index.js',
          })
        }
      }
    }
    return plugins
  } catch {
    return []
  }
})

// ===== Title Bar 覆盖色更新 =====
// ===== 窗口控制（Windows frameless 使用） =====
ipcMain.handle('window:minimize', () => {
  const win = BrowserWindow.getFocusedWindow()
  if (win) win.minimize()
})

ipcMain.handle('window:maximize', () => {
  const win = BrowserWindow.getFocusedWindow()
  if (win) {
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  }
})

ipcMain.handle('window:close', () => {
  const win = BrowserWindow.getFocusedWindow()
  if (win) win.close()
})

ipcMain.handle('window:isMaximized', () => {
  const win = BrowserWindow.getFocusedWindow()
  return win ? win.isMaximized() : false
})

// ===== 下载更新 =====
ipcMain.handle('download:start', async (event, { url, filename }) => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return { success: false, reason: 'no_window' }

  // 下载到用户数据目录的 updates 子目录
  const updatesDir = join(app.getPath('userData'), 'updates')
  await mkdir(updatesDir, { recursive: true })
  const filePath = join(updatesDir, filename || 'MarkEdit.Setup.exe')

  // 清理上次残留的安装包
  try { await unlink(filePath) } catch { /* 不存在则忽略 */ }

  try {
    const response = await net.fetch(url)
    if (!response.ok || !response.body) {
      return { success: false, reason: `HTTP ${response.status}` }
    }

    const total = parseInt(response.headers.get('content-length') || '0', 10)
    let downloaded = 0
    const chunks = []

    const reader = response.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        chunks.push(value)
        downloaded += value.length
        if (total > 0) {
          win.webContents.send('download:progress', {
            received: downloaded, total,
            percent: Math.round((downloaded / total) * 100),
          })
        }
      }
    }

    // 写入文件
    const totalLength = chunks.reduce((s, c) => s + c.length, 0)
    const buffer = Buffer.alloc(totalLength)
    let offset = 0
    for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length }
    await writeFile(filePath, buffer)

    // 下载完成 -> 启动安装程序
    shell.openPath(filePath)

    win.webContents.send('download:progress', {
      done: true, filePath,
      received: totalLength, total: totalLength, percent: 100,
    })

    return { success: true, filePath }
  } catch (err) {
    return { success: false, reason: err.message }
  }
})

// ===== App Lifecycle =====
app.whenReady().then(() => {
  registerCustomProtocol()
  const win = createWindow()

  // 由渲染进程主动拉取启动参数，避免 IPC 时序竞争

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
