import { useUpdateStore } from '../../stores/updateStore'
import { useT } from '../../lib/i18n'

export function UpdateToast() {
  const t = useT()
  const showPrompt = useUpdateStore((s) => s.showPrompt)
  const status = useUpdateStore((s) => s.status)
  const latestVersion = useUpdateStore((s) => s.latestVersion)
  const progress = useUpdateStore((s) => s.progress)
  const startDownload = useUpdateStore((s) => s.startDownload)
  const installAndRestart = useUpdateStore((s) => s.installAndRestart)
  const dismissPrompt = useUpdateStore((s) => s.dismissPrompt)
  const checkForUpdates = useUpdateStore((s) => s.checkForUpdates)

  if (!showPrompt) return null
  // Don't show toast for "already latest" — About dialog handles that
  if (status === 'idle' || status === 'latest' || status === 'checking') return null

  const accent =
    status === 'error' ? '#ef4444' : status === 'ready' ? '#22c55e' : 'var(--accent)'

  return (
    <div className="fixed right-4 bottom-10 z-[71] w-[min(360px,calc(100vw-2rem))] pointer-events-none">
      <div
        className="pointer-events-auto rounded-lg border px-3.5 py-3 shadow-xl transition-all"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
        }}
      >
        <div className="flex items-start gap-2.5">
          <span
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
            style={{ color: accent, background: 'var(--bg-hover)' }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {status === 'error' ? (
                <path d="M4 4l8 8M12 4l-8 8" />
              ) : status === 'ready' ? (
                <path d="M3 8.5 6.5 12 13 4.5" />
              ) : (
                <>
                  <path d="M8 2v8" />
                  <path d="M5 7l3 3 3-3" />
                  <path d="M3 13h10" />
                </>
              )}
            </svg>
          </span>

          <div className="min-w-0 flex-1">
            {status === 'available' && (
              <>
                <div className="text-sm font-medium leading-5">
                  {t('toast.updateAvailable', { version: latestVersion })}
                </div>
                <div className="mt-0.5 text-xs leading-4" style={{ color: 'var(--text-dim)' }}>
                  {t('toast.updateAvailableDetail')}
                </div>
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={() => void startDownload()}
                    className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
                    style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
                  >
                    {t('toast.updateDownload')}
                  </button>
                  <button
                    onClick={dismissPrompt}
                    className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                  >
                    {t('toast.updateLater')}
                  </button>
                </div>
              </>
            )}

            {status === 'downloading' && (
              <>
                <div className="text-sm font-medium leading-5">
                  {t('toast.updateDownloading', { percent: progress })}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full"
                    style={{ background: 'var(--bg-hover)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%`, background: 'var(--accent)' }}
                    />
                  </div>
                  <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-dim)' }}>
                    {progress}%
                  </span>
                </div>
              </>
            )}

            {status === 'ready' && (
              <>
                <div className="text-sm font-medium leading-5">{t('toast.updateReady')}</div>
                <div className="mt-0.5 text-xs leading-4" style={{ color: 'var(--text-dim)' }}>
                  {t('toast.updateReadyDetail', { version: latestVersion })}
                </div>
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={() => void installAndRestart()}
                    className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
                    style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
                  >
                    {t('toast.updateRestart')}
                  </button>
                  <button
                    onClick={dismissPrompt}
                    className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                  >
                    {t('toast.updateLater')}
                  </button>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="text-sm font-medium leading-5">{t('toast.updateFailed')}</div>
                <div className="mt-0.5 text-xs leading-4" style={{ color: 'var(--text-dim)' }}>
                  {t('toast.updateFailedDetail')}
                </div>
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={() => void checkForUpdates({ silent: false })}
                    className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
                    style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
                  >
                    {t('about.checkUpdate')}
                  </button>
                  <button
                    onClick={dismissPrompt}
                    className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                  >
                    {t('toast.updateLater')}
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={dismissPrompt}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors"
            style={{ color: 'var(--text-dim)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            aria-label="Dismiss"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="2" y1="2" x2="8" y2="8" />
              <line x1="8" y1="2" x2="2" y2="8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
