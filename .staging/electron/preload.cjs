const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // ===== 文件操作 =====
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('file:write', filePath, content),
  saveDialog: () => ipcRenderer.invoke('file:saveDialog'),
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

  // ===== 语言切换 =====
  setLanguage: (lang) => ipcRenderer.send('language:changed', lang),
})
