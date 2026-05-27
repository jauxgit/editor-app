import { useEffect, useRef } from 'react'

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // 延迟避免立即触发
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

  const bg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const textColor = theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
  const dimText = theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
  const itemHover = theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
  const dividerColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200'

  // 防止菜单超出屏幕
  const adjustedX = Math.min(x, window.innerWidth - 180)
  const adjustedY = Math.min(y, window.innerHeight - items.length * 32 - 16)

  return (
    <div
      ref={ref}
      className={`fixed z-[100] w-44 py-1 rounded-lg border shadow-xl text-xs ${bg} ${textColor}`}
      style={{ left: adjustedX, top: adjustedY }}
    >
      {items.map(item =>
        item.divider ? (
          <div key={item.id} className={`mx-2 my-1 border-t ${dividerColor}`} />
        ) : (
          <button
            key={item.id}
            onClick={() => { item.action(); onClose() }}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors ${itemHover} ${textColor}`}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className={`ml-4 ${dimText}`}>{item.shortcut}</span>
            )}
          </button>
        )
      )}
    </div>
  )
}
