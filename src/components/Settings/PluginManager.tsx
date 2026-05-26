import { useEffect, useState } from 'react'
import { useT } from '../../lib/i18n'
import { useEditorStore } from '../../stores/editorStore'
import { pluginRegistry, usePlugins } from '../../lib/pluginRegistry'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function PluginManager({ isOpen, onClose }: Props) {
  const t = useT()
  const registry = usePlugins()
  const disabledPlugins = useEditorStore(s => s.disabledPlugins)
  const togglePlugin = useEditorStore(s => s.togglePlugin)
  const [refreshing, setRefreshing] = useState(false)
  const theme = useEditorStore(s => s.theme)

  // ESC 关闭
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const plugins = registry.listAll()
  const activeCount = plugins.filter(p => p.active).length

  const handleToggle = (id: string) => {
    togglePlugin(id)
    if (disabledPlugins.includes(id)) {
      pluginRegistry.activate(id)
    } else {
      pluginRegistry.deactivate(id)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await pluginRegistry.reloadExternal()
    } finally {
      setRefreshing(false)
    }
  }

  const handleOpenDir = () => {
    window.electronAPI?.openPluginDir()
  }

  if (!isOpen) return null

  const overlayBg = theme === 'dark' ? 'bg-black/50' : 'bg-black/20'
  const panelBg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const textColor = theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
  const dimText = theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
  const itemHover = theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
  const switchBgOff = theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
  const switchBgOn = 'bg-indigo-500'
  const btnBg = theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
  const accentBtn = 'bg-indigo-500 hover:bg-indigo-600 text-white'

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg}`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg rounded-xl border shadow-2xl ${panelBg} ${textColor}`}
        onClick={e => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/20">
          <h2 className="text-base font-semibold">{t('plugin.title')}</h2>
          <button onClick={onClose} className={`text-lg leading-none ${dimText} hover:opacity-70`}>✕</button>
        </div>

        {/* 插件列表 */}
        <div className="max-h-80 overflow-y-auto px-2 py-2">
          {plugins.length === 0 && (
            <div className={`px-3 py-8 text-center text-sm ${dimText}`}>
              {t('plugin.noPlugins')} {t('plugin.help')}
            </div>
          )}
          {plugins.map(p => (
            <div
              key={p.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${itemHover}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{p.name}</span>
                  <span className={`text-[11px] ${dimText} shrink-0`}>v{p.version}</span>
                </div>
                {p.description && (
                  <div className={`text-xs mt-0.5 truncate ${dimText}`}>{p.description}</div>
                )}
              </div>
              {/* 开关 */}
              <button
                onClick={() => handleToggle(p.id)}
                className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
                  p.active ? switchBgOn : switchBgOff
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  p.active ? 'translate-x-5' : ''
                }`} />
              </button>
            </div>
          ))}
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-700/20">
          <span className={`text-xs ${dimText}`}>
            {t('plugin.pluginsCount', { n: plugins.length, m: activeCount })}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenDir}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${btnBg}`}
            >
              📂 {t('plugin.openDir')}
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${accentBtn} ${refreshing ? 'opacity-50' : ''}`}
            >
              {refreshing ? '⟳ ...' : '🔄 ' + t('plugin.refresh')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
