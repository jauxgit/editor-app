import { create } from 'zustand'

export interface ImageRecord {
  relativePath: string
  thumbnailPath: string | null
  filename: string
  sourcePath: string
  addedAt: number
}

interface ImageState {
  images: Record<string, ImageRecord>  // sourcePath → record
  addImage: (record: ImageRecord) => void
  removeImage: (sourcePath: string) => void
  getByRelativePath: (relativePath: string) => ImageRecord | undefined
}

export const useImageStore = create<ImageState>((set, get) => ({
  images: {},

  addImage: (record) => set(s => ({
    images: { ...s.images, [record.sourcePath]: record },
  })),

  removeImage: (sourcePath) => set(s => {
    const { [sourcePath]: _, ...rest } = s.images
    return { images: rest }
  }),

  getByRelativePath: (relativePath) => {
    return Object.values(get().images).find(r => r.relativePath === relativePath)
  },
}))
