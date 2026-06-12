import { useEffect, useState } from 'react'
import { useT } from '../../lib/i18n'
import { useEditorStore } from '../../stores/editorStore'
import { editorThemes } from '../../lib/editorThemes'
import { editorFonts } from '../../lib/editorFonts'
import type { HighlightThemeId } from '../../lib/highlightThemes'

interface Props {
  isOpen: boolean
  onClose: () => void
}

type SettingsTab = 'editor' | 'theme' | 'language'

export function SettingsDialog({ isOpen, onClose }: Props) {
  const t = useT()
  const [visible, setVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<SettingsTab>('editor')

  const theme = useEditorStore(s => s.theme)
  const setTheme = useEditorStore(s => s.setTheme)
  const highlightTheme = useEditorStore(s => s.highlightTheme)
  const setHighlightTheme = useEditorStore(s => s.setHighlightTheme)
  const language = useEditorStore(s => s.language)
  const setLanguage = useEditorStore(s => s.setLanguage)
  const font = useEditorStore(s => s.font)
  const setFont = useEditorStore(s => s.setFont)
  const fontSize = useEditorStore(s => s.fontSize)
  const setFontSize = useEditorStore(s => s.setFontSize)

  // 开启动画
  // ESC 关闭
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const highlightThemeIds: HighlightThemeId[] = [
    'github', 'github-dark', 'atom-one-light', 'night-owl',
    'a11y-light', 'monokai',
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-200"
      style={{
        background: visible ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
        backdropFilter: visible ? 'blur(6px)' : 'blur(0px)',
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden transition-all duration-200"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.96)',
          opacity: visible ? 1 : 0,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-base font-medium">{t('settings.title')}</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-6 h-6 rounded transition-colors"
            style={{ color: 'var(--text-dim)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="2" y1="2" x2="8" y2="8" /><line x1="8" y1="2" x2="2" y2="8" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-stretch border-b shrink-0 px-4" style={{ borderColor: 'var(--border)' }}>
          {(['editor', 'theme', 'language'] as SettingsTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative px-4 py-2.5 text-xs font-medium transition-colors"
              style={{
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              {t(`settings.${tab}`)}
              {activeTab === tab && (
                <span className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: 'var(--accent)' }} />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-h-80 overflow-y-auto px-5 py-4 space-y-4">
          {activeTab === 'editor' && (
            <>
              {/* Font size */}
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  {t('settings.fontSize')}: <span className="font-mono">{fontSize}px</span>
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: 'var(--text-dim)' }}>10</span>
                  <input
                    type="range"
                    min="10"
                    max="24"
                    step="1"
                    value={fontSize}
                    onChange={e => setFontSize(Number(e.target.value))}
                    className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: 'var(--border)',
                      accentColor: 'var(--accent)',
                    }}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-dim)' }}>24</span>
                </div>
              </div>

              {/* Font family */}
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  {t('settings.font')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {editorFonts.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFont(f.id)}
                      className="px-2.5 py-1.5 text-xs rounded-lg transition-all border"
                      style={{
                        borderColor: font === f.id ? 'var(--accent)' : 'var(--border)',
                        background: font === f.id ? 'var(--accent-muted)' : 'var(--bg-base)',
                        color: font === f.id ? 'var(--accent)' : 'var(--text-secondary)',
                      }}
                    >
                      {f.id}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'theme' && (
            <>
              {/* Editor theme */}
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {t('settings.theme')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {editorThemes.map(th => (
                    <button
                      key={th.id}
                      onClick={() => setTheme(th.id)}
                      className="flex items-center gap-2 px-3 py-2.5 text-xs rounded-lg transition-all border text-left"
                      style={{
                        borderColor: theme === th.id ? 'var(--accent)' : 'var(--border)',
                        background: theme === th.id ? 'var(--accent-muted)' : 'var(--bg-base)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke={th.iconColor} strokeWidth="1.5" strokeLinecap="round">
                        <path d={th.iconPath} />
                      </svg>
                      <span className="truncate">{th.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Highlight theme */}
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {t('settings.highlightTheme')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {highlightThemeIds.map(id => (
                    <button
                      key={id}
                      onClick={() => setHighlightTheme(id)}
                      className="px-2.5 py-1.5 text-xs rounded-lg transition-all border"
                      style={{
                        borderColor: highlightTheme === id ? 'var(--accent)' : 'var(--border)',
                        background: highlightTheme === id ? 'var(--accent-muted)' : 'var(--bg-base)',
                        color: highlightTheme === id ? 'var(--accent)' : 'var(--text-secondary)',
                      }}
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'language' && (
            <div>
              <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                {t('settings.language')}
              </label>
              <div className="flex gap-2">
                {(['en', 'zh'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className="flex-1 px-4 py-3 text-sm rounded-lg transition-all border text-center"
                    style={{
                      borderColor: language === lang ? 'var(--accent)' : 'var(--border)',
                      background: language === lang ? 'var(--accent-muted)' : 'var(--bg-base)',
                      color: language === lang ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    {lang === 'en' ? 'English' : '中文'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
