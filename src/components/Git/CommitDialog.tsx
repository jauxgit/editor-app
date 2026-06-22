import { useCallback, useEffect, useRef, useState } from 'react';
import { useT } from '../../lib/i18n';
import { useGitStore } from '../../stores/gitStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CommitDialog({ isOpen, onClose }: Props) {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [committing, setCommitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const changes = useGitStore((s) => s.changes);
  const isGitRepo = useGitStore((s) => s.isGitRepo);
  const branch = useGitStore((s) => s.branch);
  const commit = useGitStore((s) => s.commit);
  const push = useGitStore((s) => s.push);
  const refreshStatus = useGitStore((s) => s.refreshStatus);

  const root = useWorkspaceStore((s) => s.root);

  // 开启动画
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        setVisible(true);
        setResultMsg(null);
        setMessage('');
      });
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // 打开时聚焦
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const handleCommit = useCallback(async () => {
    if (!root || !message.trim()) return;
    setCommitting(true);
    setResultMsg(null);

    const ok = await commit(root, message.trim());
    if (ok) {
      setResultMsg(t('git.commitSuccess'));
      setMessage('');
    } else {
      setResultMsg(t('git.commitFailed'));
    }
    setCommitting(false);
  }, [root, message, commit, t]);

  const handleCommitAndPush = useCallback(async () => {
    if (!root || !message.trim()) return;
    setCommitting(true);
    setResultMsg(null);

    const ok = await commit(root, message.trim());
    if (ok) {
      const pushResult = await push(root);
      setResultMsg(t('git.pushResult', { msg: pushResult.slice(0, 100) }));
      setMessage('');
    } else {
      setResultMsg(t('git.commitFailed'));
    }
    setCommitting(false);
  }, [root, message, commit, push, t]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      // Ctrl+Enter 或 Cmd+Enter 提交
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCommit();
      }
    },
    [handleCommit, onClose],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] transition-opacity duration-200"
      style={{
        background: visible ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden transition-all duration-200 flex flex-col"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.97)',
          opacity: visible ? 1 : 0,
          maxHeight: '70vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="text-sm font-medium">
            {t('git.commitTitle')}
          </span>
          {branch && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
            >
              {branch}
            </span>
          )}
        </div>

        {!isGitRepo ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
            {t('git.notRepo')}
          </div>
        ) : committing ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="animate-spin mx-auto mb-2"
            >
              <circle cx="8" cy="8" r="6" opacity="0.3" />
              <path d="M14 8a6 6 0 0 0-6-6" />
            </svg>
            {t('git.committing')}
          </div>
        ) : (
          <>
            {/* Changed files list */}
            <div className="overflow-y-auto flex-1 min-h-0 px-4 py-2">
              {changes.length === 0 ? (
                <div className="py-4 text-center text-xs" style={{ color: 'var(--text-dim)' }}>
                  {t('git.noChanges')}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {changes.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 py-1 text-xs"
                    >
                      <span
                        className="shrink-0 font-mono font-bold w-6 text-center"
                        style={{
                          color: c.status === '??' ? 'var(--text-dim)' : c.status === 'M' ? '#d29922' : c.status === 'A' ? '#2ea043' : c.status === 'D' ? '#da3633' : 'var(--text-dim)',
                        }}
                      >
                        {c.status === '??' ? 'U' : c.status}
                      </span>
                      <span className="truncate" style={{ color: 'var(--text-secondary)' }}>
                        {c.path}
                      </span>
                      {c.staged && (
                        <span
                          className="text-[10px] px-1 rounded shrink-0"
                          style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                        >
                          {t('git.staged')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Commit message input */}
            <div className="px-4 py-2 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('git.commitPlaceholder')}
                className="w-full outline-none resize-none text-sm rounded-lg p-2 border"
                style={{
                  background: 'var(--bg-base)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)',
                  minHeight: '60px',
                }}
                rows={3}
                spellCheck={false}
              />

              {/* Result message */}
              {resultMsg && (
                <div className="mt-1 text-xs" style={{ color: 'var(--text-dim)' }}>
                  {resultMsg}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs rounded-lg border transition-colors"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {t('git.cancel')}
                </button>
                <button
                  onClick={handleCommit}
                  disabled={!message.trim() || changes.length === 0}
                  className="px-3 py-1.5 text-xs rounded-lg border transition-colors font-medium"
                  style={{
                    background: message.trim() && changes.length > 0 ? 'var(--accent)' : 'var(--bg-base)',
                    borderColor: message.trim() && changes.length > 0 ? 'var(--accent)' : 'var(--border)',
                    color: message.trim() && changes.length > 0 ? '#fff' : 'var(--text-dim)',
                    opacity: message.trim() && changes.length > 0 ? 1 : 0.5,
                    cursor: message.trim() && changes.length > 0 ? 'pointer' : 'not-allowed',
                  }}
                >
                  {t('git.commitBtn')}
                </button>
                <button
                  onClick={handleCommitAndPush}
                  disabled={!message.trim() || changes.length === 0}
                  className="px-3 py-1.5 text-xs rounded-lg border transition-colors"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                    opacity: message.trim() && changes.length > 0 ? 1 : 0.5,
                    cursor: message.trim() && changes.length > 0 ? 'pointer' : 'not-allowed',
                  }}
                  onMouseEnter={(e) => {
                    if (message.trim() && changes.length > 0)
                      e.currentTarget.style.background = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {t('git.commitAndPush')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
