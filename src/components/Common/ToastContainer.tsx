import { useEffect, useState } from 'react'
import { useToastStore, type ToastType } from '../../stores/toastStore'

const toastAccent: Record<ToastType, string> = {
  success: '#3d9a5f',
  error: '#e05252',
  info: 'var(--accent)',
  warning: '#d98e1e',
}

const toastIcon: Record<ToastType, string> = {
  success: 'M3 8.5 6.5 12 13 4.5',
  error: 'M4 4l8 8M12 4l-8 8',
  info: 'M8 7v5M8 4.25v.5',
  warning: 'M8 3l6 10H2L8 3z',
}

function ToastItem({ id, type, message, detail, onDismiss }: { id: string; type: ToastType; message: string; detail?: string; onDismiss: (id: string) => void }) {
  const [enter, setEnter] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEnter(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      className="pointer-events-auto rounded-xl border px-4 py-3 transition-all duration-200"
      style={{
        background: 'var(--bg-elevated)',
        borderColor: 'var(--border)',
        color: 'var(--text-primary)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
        transform: enter ? 'translateY(0)' : 'translateY(10px)',
        opacity: enter ? 1 : 0,
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${type === 'success' || type === 'info' ? 'mark-ping' : ''}`}
          style={{ color: toastAccent[type], background: 'var(--bg-hover)' }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={toastIcon[type]} />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium leading-5">{message}</div>
          {detail && (
            <div className="mt-0.5 break-words text-xs leading-4" style={{ color: 'var(--text-dim)' }}>
              {detail}
            </div>
          )}
        </div>
        <button
          onClick={() => onDismiss(id)}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors"
          style={{ color: 'var(--text-dim)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          aria-label="Dismiss notification"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="2" y1="2" x2="8" y2="8" />
            <line x1="8" y1="2" x2="2" y2="8" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)
  const dismissToast = useToastStore((state) => state.dismissToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed right-4 bottom-10 z-[70] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          detail={toast.detail}
          onDismiss={dismissToast}
        />
      ))}
    </div>
  )
}
