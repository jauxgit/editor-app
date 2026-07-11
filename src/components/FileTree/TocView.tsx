import { useEffect, useRef } from 'react';
import type { TocItem } from '../Preview/MarkdownPreview';
import { useT } from '../../lib/i18n';

interface Props {
  items: TocItem[];
  activeId: string | null;
  onItemClick: (id: string) => void;
}

/**
 * 侧边栏大纲面板组件。
 * 展示 Markdown 文档的标题目录，支持点击跳转和活跃项高亮。
 */
export function TocView({ items, activeId, onItemClick }: Props) {
  const t = useT();
  const listRef = useRef<HTMLDivElement>(null);

  // 活跃项变化时，确保大纲列表滚到可见区域
  useEffect(() => {
    if (!activeId || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-toc-id="${CSS.escape(activeId)}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeId]);

  if (items.length === 0) {
    return (
      <div className="h-full min-h-0 flex items-center justify-center" style={{ color: 'var(--text-dim)' }}>
        <span className="text-xs">{t('toc.empty')}</span>
      </div>
    );
  }

  return (
    <div ref={listRef} className="h-full min-h-0 overflow-y-auto overscroll-contain py-1">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          data-toc-id={item.id}
          className={`toc-link toc-level-${item.level} ${activeId === item.id ? 'toc-active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            onItemClick(item.id);
          }}
        >
          {item.text}
        </a>
      ))}
    </div>
  );
}
