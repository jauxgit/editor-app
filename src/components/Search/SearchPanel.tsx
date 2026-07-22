import { useCallback, useEffect, useRef, useState } from 'react'
import { useT } from '../../lib/i18n'
import { useEditorStore } from '../../stores/editorStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import type { SearchResult } from '../../types/electron'

interface Props {
  onClose?: () => void
}

export function SearchPanel({ onClose }: Props) {
  const t = useT()
  const root = useWorkspaceStore((s) => s.root)
  const openFile = useWorkspaceStore((s) => s.openFile)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 自动聚焦输入框
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || !root || !window.electronAPI) {
      setResults([])
      setSearched(false)
      return
    }
    setSearching(true)
    setSearched(true)
    try {
      const res = await window.electronAPI.searchFiles(root, q.trim())
      setResults(res)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [root])

  // 输入防抖搜索
  const handleChange = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(value), 300)
  }, [doSearch])

  // 点击结果打开文件
  const handleResultClick = useCallback(async (result: SearchResult) => {
    try {
      if (window.electronAPI) {
        const data = await window.electronAPI.readFile(result.path)
        openFile(data.path, data.content)
        // 跳转到具体行号（在文件打开后触发）
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('editor:goto-line', {
            detail: { line: result.line },
          }))
        }, 100)
      }
    } catch {
      // 文件可能已被删除
    }
  }, [openFile])

  return (
    <div
      className="shrink-0 border-l overflow-hidden flex flex-col"
      style={{
        width: '280px',
        borderColor: 'var(--border)',
        background: 'var(--bg-surface)',
        color: 'var(--text-secondary)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            style={{ color: 'var(--accent)' }}
          >
            <circle cx="7" cy="7" r="4" />
            <line x1="10" y1="10" x2="14" y2="14" />
          </svg>
          <span className="micro-label">{t('search.title')}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center justify-center w-5 h-5 rounded transition-colors"
            style={{ color: 'var(--text-dim)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="2" y1="2" x2="8" y2="8" />
              <line x1="8" y1="2" x2="2" y2="8" />
            </svg>
          </button>
        )}
      </div>

      {/* Search input */}
      <div className="px-3 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
          style={{
            background: 'var(--bg-base)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            style={{ color: 'var(--text-dim)', opacity: 0.6 }}
          >
            <circle cx="7" cy="7" r="4" />
            <line x1="10" y1="10" x2="14" y2="14" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={t('search.placeholder')}
            className="flex-1 bg-transparent outline-none text-xs"
            style={{ color: 'var(--text-primary)' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') doSearch(query)
              if (e.key === 'Escape') onClose?.()
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setSearched(false); inputRef.current?.focus() }}
              className="flex items-center justify-center w-4 h-4 rounded transition-colors"
              style={{ color: 'var(--text-dim)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="2" y1="2" x2="8" y2="8" />
                <line x1="8" y1="2" x2="2" y2="8" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto py-0.5">
        {!root ? (
          <div className="px-4 py-10 text-center text-xs" style={{ color: 'var(--text-dim)' }}>
            <svg
              width="20" height="20" viewBox="0 0 16 16" fill="none"
              stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
              className="mx-auto mb-2" style={{ opacity: 0.3 }}
            >
              <path d="M14 8v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4" />
              <polyline points="10,2 14,2 14,6" />
              <line x1="8" y1="8" x2="14" y2="2" />
            </svg>
            <div>{t('search.noFolder')}</div>
          </div>
        ) : searching ? (
          <div className="px-4 py-10 text-center text-xs" style={{ color: 'var(--text-dim)' }}>
            <div className="animate-spin mb-2" style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto' }} />
            <div>{t('search.searching')}</div>
          </div>
        ) : searched && results.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs" style={{ color: 'var(--text-dim)' }}>
            <svg
              width="20" height="20" viewBox="0 0 16 16" fill="none"
              stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
              className="mx-auto mb-2" style={{ opacity: 0.3 }}
            >
              <circle cx="7" cy="7" r="4" />
              <line x1="10" y1="10" x2="14" y2="14" />
              <line x1="4" y1="7" x2="10" y2="7" />
            </svg>
            <div>{t('search.noResults')}</div>
          </div>
        ) : (
          <div>
            {results.length > 0 && (
              <div
                className="px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider shrink-0"
                style={{ color: 'var(--text-dim)' }}
              >
                {t('search.resultsCount', { n: results.length })}
              </div>
            )}
            {results.map((result, i) => {
              // 提取文件名和相对路径
              const pathParts = result.path.replace(/\\/g, '/').split('/')
              const fileName = pathParts.pop() || ''
              const dirPath = pathParts.join('/')
              return (
                <div
                  key={i}
                  className="group flex flex-col gap-0.5 px-4 py-1.5 cursor-pointer select-none transition-all duration-100 text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={() => handleResultClick(result)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 font-mono text-[10px] px-1.5 py-px rounded font-medium"
                      style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}>
                      {result.line}
                    </span>
                    <span className="truncate font-medium" style={{ color: 'var(--text-primary)' }}>
                      {fileName}
                    </span>
                  </div>
                  <div className="truncate pl-7 text-[11px]" style={{ color: 'var(--text-dim)' }}>
                    <span>{dirPath}</span>
                    <span className="mx-1 opacity-40">/</span>
                    <span className="font-mono">{result.content.slice(0, 120)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
