export interface FileEntry {
  name: string
  isDirectory: boolean
  path: string
}

export interface ElectronAPI {
  readFile: (filePath: string) => Promise<{ path: string; content: string }>
  writeFile: (filePath: string, content: string) => Promise<boolean>
  saveDialog: () => Promise<string | null>
  openFileDialog: () => Promise<{ path: string; content: string } | null>
  openFolderDialog: () => Promise<{ path: string } | null>
  listDir: (dirPath: string) => Promise<FileEntry[]>
  ensureDir: (dirPath: string) => Promise<void>
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
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
