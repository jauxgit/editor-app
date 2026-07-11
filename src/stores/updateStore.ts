import { create } from 'zustand'
import {
  APP_VERSION,
  fetchLatestRelease,
  pickInstallerAsset,
  type ReleaseAsset,
} from '../lib/update'

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'latest'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'error'

interface UpdateState {
  status: UpdateStatus
  currentVersion: string
  latestVersion: string
  progress: number
  assets: ReleaseAsset[]
  filePath: string | null
  error: string | null
  /** When true, bottom-right update toast is visible */
  showPrompt: boolean
  /** Whether a download progress listener is already attached */
  _listening: boolean

  checkForUpdates: (opts?: { silent?: boolean }) => Promise<void>
  startDownload: () => Promise<void>
  installAndRestart: () => Promise<void>
  dismissPrompt: () => void
  reset: () => void
}

function ensureProgressListener(
  set: (partial: Partial<UpdateState> | ((s: UpdateState) => Partial<UpdateState>)) => void,
  get: () => UpdateState,
) {
  if (get()._listening) return
  const api = window.electronAPI
  if (!api?.onDownloadProgress) return

  api.onDownloadProgress((data) => {
    set({ progress: data.percent ?? 0 })
    if (data.done) {
      set({
        status: 'ready',
        progress: 100,
        filePath: data.filePath || get().filePath,
        showPrompt: true,
      })
    }
  })
  set({ _listening: true })
}

export const useUpdateStore = create<UpdateState>((set, get) => ({
  status: 'idle',
  currentVersion: APP_VERSION,
  latestVersion: '',
  progress: 0,
  assets: [],
  filePath: null,
  error: null,
  showPrompt: false,
  _listening: false,

  checkForUpdates: async (opts = {}) => {
    const silent = opts.silent ?? false
    const { status } = get()
    // Avoid overlapping checks / downloads
    if (status === 'checking' || status === 'downloading') return

    set({
      status: 'checking',
      error: null,
      ...(silent ? {} : { showPrompt: false }),
    })

    try {
      const release = await fetchLatestRelease()
      if (release.hasUpdate) {
        set({
          status: 'available',
          latestVersion: release.version,
          assets: release.assets,
          // Auto-check always prompts; manual check also shows via About UI
          showPrompt: true,
        })
      } else {
        set({
          status: 'latest',
          latestVersion: release.version || APP_VERSION,
          assets: release.assets,
          showPrompt: false,
        })
      }
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
        // Silent auto-check shouldn't spam the user on network failure
        showPrompt: silent ? false : true,
      })
    }
  },

  startDownload: async () => {
    const api = window.electronAPI
    if (!api?.startDownload) {
      set({ status: 'error', error: 'no_electron_api', showPrompt: true })
      return
    }

    const asset = pickInstallerAsset(get().assets)
    if (!asset) {
      set({ status: 'error', error: 'no_asset', showPrompt: true })
      return
    }

    ensureProgressListener(set, get)
    set({
      status: 'downloading',
      progress: 0,
      filePath: null,
      error: null,
      showPrompt: true,
    })

    try {
      const result = await api.startDownload(asset.url, asset.name)
      if (!result.success) {
        if (result.reason === 'canceled') {
          set({ status: 'available', progress: 0 })
          return
        }
        set({
          status: 'error',
          error: result.reason || 'download_failed',
          showPrompt: true,
        })
        return
      }
      // Progress listener usually flips to ready; this is a fallback
      if (get().status === 'downloading') {
        set({
          status: 'ready',
          progress: 100,
          filePath: result.filePath || null,
          showPrompt: true,
        })
      } else if (result.filePath) {
        set({ filePath: result.filePath })
      }
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
        showPrompt: true,
      })
    }
  },

  installAndRestart: async () => {
    const api = window.electronAPI
    const filePath = get().filePath
    if (!api?.installAndRestart || !filePath) {
      set({ status: 'error', error: 'no_installer', showPrompt: true })
      return
    }
    try {
      const result = await api.installAndRestart(filePath)
      if (!result.success) {
        set({
          status: 'error',
          error: result.reason || 'install_failed',
          showPrompt: true,
        })
      }
      // On success the app will quit shortly
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
        showPrompt: true,
      })
    }
  },

  dismissPrompt: () => set({ showPrompt: false }),

  reset: () =>
    set({
      status: 'idle',
      latestVersion: '',
      progress: 0,
      assets: [],
      filePath: null,
      error: null,
      showPrompt: false,
    }),
}))
