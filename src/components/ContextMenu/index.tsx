import { useEffect, useRef, useState } from 'react'

export interface ContextMenuItem {
  id: string
  label: string
  shortcut?: string
  divider?: boolean
  action: () => void
}

interface Props {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
  theme: 'dark' | 'light'
}

export function ContextMenu({ x, y, items, onClose, theme }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    requestAnimationFrame(() => document.addEventListener('mousedown', handler))
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // 防止菜单超出屏幕
  const adjustedX = Math.min(x, window.innerWidth - 180)
  const adjustedY = Math.min(y, window.innerHeight - items.length * 32 - 16)

  return (
    <div
      ref={ref}
      className="fixed z-[100] w-44 py-1.5 rounded-lg border shadow-lg transition-all duration-150"
      style={{
        left: adjustedX,
        top: adjustedY,
        background: 'var(--bg-elevated, #2f2a24)',
        borderColor: 'var(--border, #3d3730)',
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(-4px)',
        opacity: visible ? 1 : 0,
        transformOrigin: 'top left',
      }}
    >
      {items.map(item =>
        item.divider ? (
          <div key={item.id} className="mx-2 my-1 border-t" style={{ borderColor: 'var(--border)' }} />
        ) : (
          <button
            key={item.id}
            onClick={() => { item.action(); onClose() }}
            className="w-full flex items-center justify-between px-3 py-1.5 text-left text-xs transition-colors duration-75"
            style={{ color: 'var(--text-primary)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-muted)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-primary)' }}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="ml-4" style={{ color: 'var(--text-dim)' }}>{item.shortcut}</span>
            )}
          </button>
        )
      )}
    </div>
  )
}
