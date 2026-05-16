import { useEffect, useCallback } from 'react'
import { useWorkspaceStore } from '../../stores/workspaceStore'

interface Props {
  docPath: string
  containerRef: React.RefObject<HTMLDivElement | null>
  onInsertAtCursor: (text: string) => void
}

/**
 * 处理图片拖入和粘贴
 * Electron 环境：通过 IPC 写入 assets/ 目录，使用缩略图渲染
 * 浏览器环境：退化为 base64 内联
 */
export function useImageHandler({ containerRef, onInsertAtCursor }: Props) {
  const root = useWorkspaceStore(s => s.root)

  const processImage = useCallback(async (file: File) => {
    const allowedExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp']
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    if (!allowedExts.includes(ext)) return

    const alt = file.name.replace(/\.[^.]+$/, '')

    // 读取文件为 base64
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })

    // Electron 环境：写入文件系统
    if (window.electronAPI && root) {
      try {
        const base64 = dataUrl.split(',')[1]
        const result = await window.electronAPI.writeBase64Image(
          root,
          base64,
          file.name
        )
        if (result.success) {
          // 使用缩略图路径在编辑器中渲染（如果有的话）
          const displayPath = result.relativePath
          onInsertAtCursor(`![${alt}](${displayPath})`)
          return
        }
      } catch (err) {
        console.error('IPC image write failed, falling back to base64:', err)
      }
    }

    // 浏览器环境 fallback：内联 base64
    onInsertAtCursor(`![${alt}](${dataUrl})`)
  }, [root, onInsertAtCursor])

  // 拖入事件
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    }

    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const files = e.dataTransfer?.files
      if (!files) return
      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
          processImage(file)
          break
        }
      }
    }

    el.addEventListener('dragover', onDragOver)
    el.addEventListener('drop', onDrop)
    return () => {
      el.removeEventListener('dragover', onDragOver)
      el.removeEventListener('drop', onDrop)
    }
  }, [containerRef, processImage])

  // 粘贴事件
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) processImage(file)
          break
        }
      }
    }

    el.addEventListener('paste', onPaste)
    return () => el.removeEventListener('paste', onPaste)
  }, [containerRef, processImage])

  return { processImage }
}
