import { contextBridge, ipcRenderer } from 'electron'

/**
 * 向渲染进程暴露安全的 IPC API
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // ===== 文件操作 =====
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('file:write', filePath, content),
  saveDialog: () => ipcRenderer.invoke('file:saveDialog'),
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),

  // ===== 目录操作 =====
  listDir: (dirPath: string) => ipcRenderer.invoke('dir:list', dirPath),
  ensureDir: (dirPath: string) => ipcRenderer.invoke('dir:ensure', dirPath),

  // ===== 图片操作 =====
  copyImage: (sourcePath: string, workspaceRoot: string) =>
    ipcRenderer.invoke('image:copy', sourcePath, workspaceRoot),
  writeBase64Image: (workspaceRoot: string, base64Data: string, filename: string) =>
    ipcRenderer.invoke('image:writeBase64', workspaceRoot, base64Data, filename),

  // ===== 事件监听 =====
  onFileOpened: (callback: (data: { path: string; content: string }) => void) => {
    ipcRenderer.on('file:opened', (_e, data) => callback(data))
  },
  onFolderOpened: (callback: (data: { path: string }) => void) => {
    ipcRenderer.on('folder:opened', (_e, data) => callback(data))
  },
  onMenuSave: (callback: () => void) => {
    ipcRenderer.on('menu:save', () => callback())
  },

  // ===== 系统 =====
  getAppPath: () => ipcRenderer.invoke('app:getPath'),
})
