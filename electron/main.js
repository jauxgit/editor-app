import { app, BrowserWindow, ipcMain, dialog, Menu, nativeImage, protocol } from 'electron'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile, writeFile, readdir, mkdir, copyFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createHash } from 'node:crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isDev = !app.isPackaged

// ===== 自定义协议：serve dist 文件，解决 file:// 下 ESM 的 CORS 问题 =====
function registerCustomProtocol() {
  protocol.handle('markedit', async (request) => {
    // markedit:// 的 host+pathname 组成完整文件路径
    // 例如 markedit://index.html → host=index.html, pathname=/
    // 例如 markedit://assets/foo.js → host=assets, pathname=/foo.js
    const url = new URL(request.url)
    const distDir = join(__dirname, '../dist')

    let reqPath = url.host + url.pathname
    if (reqPath.endsWith('/')) reqPath = reqPath.slice(0, -1)

    const filePath = join(distDir, reqPath)

    // 防止目录遍历
    if (!filePath.startsWith(distDir)) {
      return new Response('Forbidden', { status: 403 })
    }

    try {
      const data = await readFile(filePath)
      const ext = extname(filePath).toLowerCase()
      const mime = MIME_TYPES[ext] || 'application/octet-stream'

      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': mime,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      })
    } catch {
      return new Response('Not Found', { status: 404 })
    }
  })
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 500,
    title: 'MarkEdit',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadURL('markedit://index.html')
  }

  Menu.setApplicationMenu(null)

  return win
}

// ===== IPC Handlers =====

async function handleOpenFile(win) {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown', 'txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0]
    const content = await readFile(filePath, 'utf-8')
    win.webContents.send('file:opened', { path: filePath, content })
  }
}

async function handleOpenFolder(win) {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
  })
  if (!result.canceled && result.filePaths.length > 0) {
    const folderPath = result.filePaths[0]
    win.webContents.send('folder:opened', { path: folderPath })
  }
}

// 渲染进程主动调用打开文件/文件夹对话框
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

ipcMain.handle('file:read', async (_e, filePath) => {
  const content = await readFile(filePath, 'utf-8')
  return { path: filePath, content }
})

ipcMain.handle('file:write', async (_e, filePath, content) => {
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, content, 'utf-8')
  return true
})

ipcMain.handle('file:saveDialog', async () => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return null
  const result = await dialog.showSaveDialog(win, {
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })
  if (result.canceled) return null
  return result.filePath
})

ipcMain.handle('dir:list', async (_e, dirPath) => {
  const entries = await readdir(dirPath, { withFileTypes: true })
  return entries
    .filter(e => !e.name.startsWith('.'))
    .map(e => ({
      name: e.name,
      isDirectory: e.isDirectory(),
      path: join(dirPath, e.name),
    }))
    .sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
      return a.name.localeCompare(b.name)
    })
})

ipcMain.handle('dir:ensure', async (_e, dirPath) => {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true })
  }
})

ipcMain.handle('image:copy', async (_e, sourcePath, workspaceRoot) => {
  const hash = createHash('md5')
    .update(sourcePath + Date.now().toString())
    .digest('hex')
    .slice(0, 8)

  const ext = sourcePath.split('.').pop()?.toLowerCase() || 'png'
  const date = new Date().toISOString().slice(0, 10)
  const filename = `${date}_${hash}.${ext}`
  const assetsDir = join(workspaceRoot, 'assets', 'images')
  const destPath = join(assetsDir, filename)

  await mkdir(assetsDir, { recursive: true })
  await copyFile(sourcePath, destPath)

  const relativePath = `assets/images/${filename}`

  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp']
  if (!imageExts.includes(ext)) {
    return { success: true, relativePath, thumbnailPath: null }
  }

  const thumbDir = join(assetsDir, 'thumb')
  await mkdir(thumbDir, { recursive: true })
  const thumbPath = join(thumbDir, filename)

  await copyFile(sourcePath, thumbPath)

  return {
    success: true,
    relativePath,
    thumbnailPath: `assets/images/thumb/${filename}`,
    filename,
  }
})

// 从 base64 写入图片
ipcMain.handle('image:writeBase64', async (_e, workspaceRoot, base64Data, filename) => {
  const hash = createHash('md5')
    .update(filename + Date.now().toString())
    .digest('hex')
    .slice(0, 8)

  const ext = filename.split('.').pop()?.toLowerCase() || 'png'
  const date = new Date().toISOString().slice(0, 10)
  const name = `${date}_${hash}.${ext}`

  const assetsDir = join(workspaceRoot, 'assets', 'images')
  const thumbDir = join(assetsDir, 'thumb')
  await mkdir(assetsDir, { recursive: true })
  await mkdir(thumbDir, { recursive: true })

  const imgPath = join(assetsDir, name)
  const buffer = Buffer.from(base64Data, 'base64')
  await writeFile(imgPath, buffer)

  let thumbnailPath = null
  const imageExts = ['png', 'jpg', 'jpeg', 'webp']
  if (imageExts.includes(ext)) {
    try {
      const img = nativeImage.createFromBuffer(buffer)
      const size = img.getSize()
      if (size.width > 480) {
        const ratio = 480 / size.width
        const thumb = img.resize({ width: 480, height: Math.round(size.height * ratio) })
        const thumbBuffer = ext === 'png' ? thumb.toPNG() : thumb.toJPEG(85)
        await writeFile(join(thumbDir, name), thumbBuffer)
      } else {
        await writeFile(join(thumbDir, name), buffer)
      }
      thumbnailPath = `assets/images/thumb/${name}`
    } catch {
      await writeFile(join(thumbDir, name), buffer)
      thumbnailPath = `assets/images/thumb/${name}`
    }
  }

  return {
    success: true,
    relativePath: `assets/images/${name}`,
    thumbnailPath,
    filename: name,
  }
})

ipcMain.handle('app:getPath', async () => {
  return app.getPath('documents')
})

// ===== App Lifecycle =====
app.whenReady().then(() => {
  registerCustomProtocol()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
