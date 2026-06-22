import { useCallback, useEffect, useRef, useState } from 'react';
import { useT } from '../../lib/i18n';
import type { DiffLine } from '../../types/electron';
import { useGitStore } from '../../stores/gitStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';

interface Props {
  isOpen: boolean;
  filePath: string;
  changeStatus: string;
  onClose: () => void;
}

export function DiffView({ isOpen, onClose, filePath, changeStatus }: Props) {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const getDiff = useGitStore((s) => s.getDiff);
  const root = useWorkspaceStore((s) => s.root);
  const fileName = filePath.split(/[/\\]/).pop() || filePath;

  // 开启动画
  useEffect(() => {
    if (isOpen) requestAnimationFrame(() => setVisible(true));
    else setVisible(false);
  }, [isOpen]);

  // 加载 diff（含超时 + 卸载保护）
  useEffect(() => {
    if (!isOpen || !root) {
      if (!isOpen) { setLoading(false); setError(null); setDiffLines([]); }
      return;
    }

    mountedRef.current = true;
    setLoading(true);
    setError(null);
    setDiffLines([]);

    const controller = { aborted: false };
    const timeout = setTimeout(() => {
      controller.aborted = true;
      if (mountedRef.current) {
        setLoading(false);
        setError(t('git.diffTimeout'));
      }
    }, 10000); // 10 秒超时

    getDiff(root, filePath, changeStatus)
      .then((lines) => {
        if (controller.aborted || !mountedRef.current) return;
        setDiffLines(lines);
        if (lines.length === 0) setError(t('git.diffNoChanges'));
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setError(t('git.diffError'));
      })
      .finally(() => {
        clearTimeout(timeout);
        if (mountedRef.current) {
          setLoading(false);
        }
      });

    return () => {
      controller.aborted = true;
      mountedRef.current = false;
      clearTimeout(timeout);
    };
  }, [isOpen, root, filePath, changeStatus, getDiff]); // ⚠️ 不含 t — useT() 每次渲染返回新函数，放入会导致无限循环

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  }, [onClose]);

  if (!isOpen) return null;

  const addCount = diffLines.filter(l => l.type === 'add').length;
  const removeCount = diffLines.filter(l => l.type === 'remove').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] transition-opacity duration-200"
      style={{ background: visible ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)' }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-full max-w-3xl rounded-xl border shadow-2xl overflow-hidden transition-all duration-200 flex flex-col"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.97)',
          opacity: visible ? 1 : 0,
          maxHeight: '80vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" style={{ color: 'var(--accent)' }}>
              <path d="M12 3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h1" />
              <polyline points="11,1 8,4 5,1" />
              <line x1="8" y1="4" x2="8" y2="11" />
              <line x1="5" y1="8" x2="11" y2="8" />
            </svg>
            <span className="text-sm font-medium">{t('git.diffTitle')}: {fileName}</span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-6 h-6 rounded transition-colors"
            style={{ color: 'var(--text-dim)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="2" y1="2" x2="10" y2="10" /><line x1="10" y1="2" x2="2" y2="10" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto flex-1 min-h-0" style={{ background: 'var(--bg-base)' }}>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: 'var(--text-dim)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="animate-spin">
                <circle cx="8" cy="8" r="6" opacity="0.3" />
                <path d="M14 8a6 6 0 0 0-6-6" />
              </svg>
              {t('git.diffLoading')}
            </div>
          ) : error ? (
            <div className="py-16 text-center text-sm" style={{ color: 'var(--text-dim)' }}>{error}</div>
          ) : (
            <pre className="text-xs leading-relaxed font-mono" style={{ margin: 0, padding: '12px 0', tabSize: 2 }}>
              {diffLines.map((line, i) => (
                <div
                  key={i}
                  className="flex"
                  style={{
                    background: line.type === 'add' ? 'rgba(46,160,67,0.12)' :
                                line.type === 'remove' ? 'rgba(218,54,51,0.12)' :
                                line.type === 'header' ? 'var(--bg-surface)' : 'transparent',
                    padding: '0 16px',
                  }}
                >
                  <span className="shrink-0 w-5 text-right mr-3 select-none" style={{ color: 'var(--text-dim)', opacity: 0.4 }}>
                    {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : line.type === 'header' ? '@' : ' '}
                  </span>
                  <span
                    className="whitespace-pre-wrap break-all min-w-0"
                    style={{
                      color: line.type === 'add' ? '#2ea043' :
                             line.type === 'remove' ? '#da3633' :
                             line.type === 'header' ? 'var(--text-dim)' : 'var(--text-primary)',
                      fontStyle: line.type === 'header' ? 'italic' : 'normal',
                    }}
                  >
                    {line.text}
                  </span>
                </div>
              ))}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t shrink-0 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
          <span>{loading ? '' : `${addCount} +  ${removeCount} -`}</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded-lg border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {t('git.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
