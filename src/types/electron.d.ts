export interface FileEntry {
  name: string
  isDirectory: boolean
  path: string
}

export interface PluginManifest {
  id: string
  name: string
  version: string
  entry: string
  description?: string
}

export interface ElectronAPI {
  readFile: (filePath: string) => Promise<{ path: string; content: string }>
  writeFile: (filePath: string, content: string) => Promise<boolean>
  saveDialog: (defaultPath?: string) => Promise<string | null>
  rename: (oldPath: string, newPath: string) => Promise<boolean>
  deleteFile: (filePath: string) => Promise<boolean>
  deleteDir: (dirPath: string) => Promise<boolean>
  openFileDialog: () => Promise<{ path: string; content: string } | null>
  openFolderDialog: () => Promise<{ path: string } | null>
  listDir: (dirPath: string) => Promise<FileEntry[]>
  ensureDir: (dirPath: string) => Promise<void>
  showConfirmDialog: (message: string, title: string) => Promise<boolean>
  confirmUnsaved: (message: string, title: string) => Promise<'save' | 'discard' | 'cancel'>
  copyImage: (sourcePath: string, workspaceRoot: string) => Promise<{
    success: boolean
    relativePath: string
    thumbnailPath: string | null
    filename: string
  }>
  writeBase64Image: (workspaceRoot: string, base64Data: string, filename: string) => Promise<{
    success: boolean
    relativePath: string
    thumbnailPath: string | null
    filename: string
  }>
  onFileOpened: (cb: (data: { path: string; content: string }) => void) => void
  onFolderOpened: (cb: (data: { path: string }) => void) => void
  onMenuSave: (cb: () => void) => void
  getAppPath: () => Promise<string>
  setLanguage: (lang: string) => void
  getStartupArgs: () => Promise<{ type: 'file' | 'folder'; path: string; content?: string }[]>
  openPluginDir: () => Promise<void>
  scanPlugins: () => Promise<PluginManifest[]>
  // 下载更新
  startDownload: (url: string, filename?: string) => Promise<{ success: boolean; filePath?: string; reason?: string }>
  onDownloadProgress: (callback: (data: { received: number; total: number; percent: number; done?: boolean; filePath?: string }) => void) => void

  // 窗口控制（Windows frameless）
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  isWindowMaximized: () => Promise<boolean>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
  /** 注入自 package.json 的版本号，由 Vite define 在构建时替换 */
  const __APP_VERSION__: string
}

export {}
