import { useCallback, useEffect, useState } from 'react';
import { useT } from '../../lib/i18n';
import { APP_VERSION, GITHUB_RELEASES, GITHUB_URL } from '../../lib/update';
import { useUpdateStore } from '../../stores/updateStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// Re-export for any accidental external imports (keep name stable)
const GITHUB_REPO_URL = GITHUB_URL || 'https://github.com/jauxgit/editor-app';

export function AboutDialog({ isOpen, onClose }: Props) {
  const t = useT();
  const [visible, setVisible] = useState(false);

  const status = useUpdateStore((s) => s.status);
  const latestVersion = useUpdateStore((s) => s.latestVersion);
  const progress = useUpdateStore((s) => s.progress);
  const checkForUpdates = useUpdateStore((s) => s.checkForUpdates);
  const startDownload = useUpdateStore((s) => s.startDownload);
  const installAndRestart = useUpdateStore((s) => s.installAndRestart);

  const handleCheck = useCallback(() => {
    void checkForUpdates({ silent: false });
  }, [checkForUpdates]);

  // 弹窗打开时重置可见动画（不重置更新状态，避免打断后台下载）
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const renderUpdateButton = () => {
    const btnClass = 'w-full py-2 rounded-lg text-sm font-medium transition-colors';
    const baseStyle = { background: 'var(--accent)', color: '#fff' };
    const hoverStyle = { background: 'var(--accent-hover)' };

    switch (status) {
      case 'idle':
        return (
          <button
            onClick={handleCheck}
            className={btnClass}
            style={baseStyle}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyle)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, baseStyle)}
          >
            {t('about.checkUpdate')}
          </button>
        );
      case 'checking':
        return (
          <button className={btnClass} style={{ ...baseStyle, opacity: 0.6 }} disabled>
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  opacity="0.3"
                />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              {t('about.checking')}
            </span>
          </button>
        );
      case 'latest':
        return (
          <div className="text-center text-xs" style={{ color: 'var(--text-dim)' }}>
            {t('about.latest', { version: APP_VERSION })}
          </div>
        );
      case 'available':
        return (
          <button
            onClick={() => void startDownload()}
            className={`${btnClass} inline-flex items-center justify-center gap-2`}
            style={baseStyle}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyle)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, baseStyle)}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t('about.download')} (v{latestVersion})
          </button>
        );
      case 'downloading':
        return (
          <div className="space-y-2">
            <div
              className="flex items-center gap-2 text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span className="flex-1">
                {t('about.downloading', { percent: progress })}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                {progress}%
              </span>
            </div>
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ background: 'var(--bg-hover)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: progress + '%', background: 'var(--accent)' }}
              />
            </div>
          </div>
        );
      case 'ready':
        return (
          <div className="space-y-2">
            <div className="text-center text-xs" style={{ color: 'var(--text-dim)' }}>
              {t('about.downloadComplete')}
            </div>
            <button
              onClick={() => void installAndRestart()}
              className={btnClass}
              style={baseStyle}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyle)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, baseStyle)}
            >
              {t('about.restartToUpdate')}
            </button>
          </div>
        );
      case 'error':
        return (
          <div className="space-y-2">
            <div className="text-center text-xs" style={{ color: 'var(--text-dim)' }}>
              {t('about.checkFailed')}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCheck}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
                style={baseStyle}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyle)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, baseStyle)}
              >
                {t('about.checkUpdate')}
              </button>
              <a
                href={GITHUB_RELEASES}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors text-center no-underline"
                style={{ background: 'var(--bg-hover)', color: 'var(--accent)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              >
                {t('about.download')}
              </a>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-200"
      style={{
        background: visible ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border shadow-2xl overflow-hidden transition-all duration-200"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.96)',
          opacity: visible ? 1 : 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with logo */}
        <div
          className="flex flex-col items-center pt-8 pb-5 px-6"
          style={{ background: 'var(--bg-surface)' }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'var(--accent-muted)' }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 48 48"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 6H8a2 2 0 0 0-2 2v32a2 2 0 0 0 2 2h32a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-6" />
              <polyline points="14,6 14,12 24,12 34,12 34,6" />
              <line x1="16" y1="22" x2="32" y2="22" />
              <line x1="16" y1="28" x2="28" y2="28" />
              <line x1="16" y1="34" x2="24" y2="34" />
            </svg>
          </div>

          <h1 className="text-lg font-semibold tracking-tight">MarkEdit · 码记</h1>

          <span className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
            v{APP_VERSION}
          </span>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t('about.description')}
          </p>

          <div className="border-t" style={{ borderColor: 'var(--border)' }} />

          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              J
            </div>
            <div>
              <div className="text-sm font-medium">JAUX</div>
              <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                {t('about.author')}
              </div>
            </div>
          </div>

          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors"
            style={{
              background: 'var(--bg-hover)',
              color: 'var(--accent)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-muted)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" opacity="0.8">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="flex-1">GitHub</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 3h7v7M13 3L4 12" />
            </svg>
          </a>

          <div className="flex flex-wrap gap-1.5">
            {['Electron', 'React 19', 'CodeMirror 6', 'Tailwind 4', 'TypeScript', 'Vite 8'].map(
              (tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 rounded text-[11px]"
                  style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                >
                  {tech}
                </span>
              ),
            )}
          </div>

          <div className="border-t" style={{ borderColor: 'var(--border)' }} />
          <div>{renderUpdateButton()}</div>
        </div>

        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: 'var(--accent)',
              color: '#fff',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
          >
            {t('about.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
