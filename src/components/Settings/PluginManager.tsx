import { useEffect, useState } from 'react';
import { useT } from '../../lib/i18n';
import { pluginRegistry, usePlugins } from '../../lib/pluginRegistry';
import { useEditorStore } from '../../stores/editorStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function PluginManager({ isOpen, onClose }: Props) {
  const t = useT();
  const registry = usePlugins();
  const disabledPlugins = useEditorStore((s) => s.disabledPlugins);
  const togglePlugin = useEditorStore((s) => s.togglePlugin);
  const [refreshing, setRefreshing] = useState(false);
  const [visible, setVisible] = useState(false);

  // 开启动画
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // ESC 关闭
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const plugins = registry.listAll();
  const activeCount = plugins.filter((p) => p.active).length;

  const handleToggle = (id: string) => {
    togglePlugin(id);
    if (disabledPlugins.includes(id)) {
      pluginRegistry.activate(id);
    } else {
      pluginRegistry.deactivate(id);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await pluginRegistry.reloadExternal();
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenDir = () => {
    window.electronAPI?.openPluginDir();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-200"
      style={{
        background: visible ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
        // backdropFilter: visible ? 'blur(6px)' : 'blur(0px)',
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
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2 className="text-base font-medium">{t('plugin.title')}</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-6 h-6 rounded transition-colors"
            style={{ color: 'var(--text-dim)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <line x1="2" y1="2" x2="8" y2="8" />
              <line x1="8" y1="2" x2="2" y2="8" />
            </svg>
          </button>
        </div>

        {/* Plugin list */}
        <div className="max-h-80 overflow-y-auto px-2 py-2">
          {plugins.length === 0 && (
            <div className="px-3 py-10 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                className="mx-auto mb-3"
                style={{ color: 'var(--text-dim)', opacity: 0.4 }}
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              {t('plugin.noPlugins')}
              <br />
              {t('plugin.help')}
            </div>
          )}
          {plugins.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{p.name}</span>
                  <span className="text-[11px] shrink-0" style={{ color: 'var(--text-dim)' }}>
                    v{p.version}
                  </span>
                </div>
                {p.description && (
                  <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-dim)' }}>
                    {p.description}
                  </div>
                )}
              </div>
              {/* Toggle switch */}
              <button
                onClick={() => handleToggle(p.id)}
                className="relative w-10 h-5 rounded-full transition-colors shrink-0"
                style={{ background: p.active ? 'var(--accent)' : 'var(--border)' }}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                    p.active ? 'translate-x-5' : ''
                  }`}
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-3 border-t"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
        >
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
            {t('plugin.pluginsCount', { n: plugins.length, m: activeCount })}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenDir}
              className="px-3 py-1.5 text-xs rounded-lg transition-colors"
              style={{
                background: 'var(--bg-hover)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-active)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            >
              <span className="flex items-center gap-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                >
                  <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.5l2 2H12.5A1.5 1.5 0 0 1 14 6.5v5A1.5 1.5 0 0 1 12.5 13h-9A1.5 1.5 0 0 1 2 11.5z" />
                </svg>
                {t('plugin.openDir')}
              </span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-1.5 text-xs rounded-lg transition-all"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                opacity: refreshing ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!refreshing) e.currentTarget.style.background = 'var(--accent-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--accent)';
              }}
            >
              {refreshing ? (
                <span className="flex items-center gap-1">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="animate-spin"
                  >
                    <circle cx="8" cy="8" r="6" opacity="0.3" />
                    <path d="M14 8a6 6 0 0 0-6-6" />
                  </svg>
                  ...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  >
                    <polyline points="14,8 12,10 10,8" />
                    <path d="M12 10a6 6 0 1 1-2-5" />
                  </svg>
                  {t('plugin.refresh')}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
