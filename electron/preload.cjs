const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // ===== 文件操作 =====
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('file:write', filePath, content),
  saveDialog: (defaultPath) => ipcRenderer.invoke('file:saveDialog', defaultPath),
  rename: (oldPath, newPath) => ipcRenderer.invoke('file:rename', oldPath, newPath),
  deleteFile: (filePath) => ipcRenderer.invoke('file:delete', filePath),
  deleteDir: (dirPath) => ipcRenderer.invoke('dir:delete', dirPath),
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),

  // ===== 目录操作 =====
  listDir: (dirPath) => ipcRenderer.invoke('dir:list', dirPath),
  ensureDir: (dirPath) => ipcRenderer.invoke('dir:ensure', dirPath),

  // ===== 对话框 =====
  showConfirmDialog: (message, title) => ipcRenderer.invoke('dialog:confirm', message, title),

  // ===== 图片操作 =====
  copyImage: (sourcePath, workspaceRoot) =>
    ipcRenderer.invoke('image:copy', sourcePath, workspaceRoot),
  writeBase64Image: (workspaceRoot, base64Data, filename) =>
    ipcRenderer.invoke('image:writeBase64', workspaceRoot, base64Data, filename),

  // ===== 事件监听 =====
  onFileOpened: (callback) => {
    ipcRenderer.on('file:opened', (_e, data) => callback(data))
  },
  onFolderOpened: (callback) => {
    ipcRenderer.on('folder:opened', (_e, data) => callback(data))
  },
  onMenuSave: (callback) => {
    ipcRenderer.on('menu:save', () => callback())
  },

  // ===== 系统 =====
  getAppPath: () => ipcRenderer.invoke('app:getPath'),
  getStartupArgs: () => ipcRenderer.invoke('app:getStartupArgs'),

  // ===== 插件系统 =====
  openPluginDir: () => ipcRenderer.invoke('plugins:openDir'),
  scanPlugins: () => ipcRenderer.invoke('plugins:scan'),

  // ===== 语言切换 =====
  setLanguage: (lang) => ipcRenderer.send('language:changed', lang),

  // ===== 下载更新 =====
  startDownload: (url, filename) => ipcRenderer.invoke('download:start', { url, filename }),
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download:progress', (_e, data) => callback(data))
  },

  // ===== 窗口控制（Windows frameless） =====
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isWindowMaximized: () => ipcRenderer.invoke('window:isMaximized'),
})
