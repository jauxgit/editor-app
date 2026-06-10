import { useEffect, useInsertionEffect, useMemo, useRef, useState } from 'react';
import { getFont } from '../../lib/editorFonts';
import { applyHighlightTheme } from '../../lib/highlightThemes';
import { renderMarkdownWithPlugins } from '../../lib/markdown';
import { usePlugins } from '../../lib/pluginRegistry';
import { useEditorStore } from '../../stores/editorStore';

interface Props {
  content: string;
  /** 编辑器滚动位置同步 (0-1 比例) */
  scrollRatio?: number;
  onScrollChange?: (ratio: number) => void;
  /** 目录变更回调（同步 tocItems 到侧边栏） */
  onTocChange?: (items: TocItem[]) => void;
  /** 当前活跃标题 ID 变更回调 */
  onActiveIdChange?: (id: string | null) => void;
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

function extractToc(html: string): TocItem[] {
  const items: TocItem[] = [];
  const re = /<h([1-3])\s[^>]*?id="([^"]*)"[^>]*>(.*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    items.push({
      level: parseInt(m[1], 10),
      id: m[2],
      text: m[3].replace(/<[^>]*>/g, ''),
    });
  }
  return items;
}

export function MarkdownPreview({ content, scrollRatio, onScrollChange, onTocChange, onActiveIdChange }: Props) {
  const registry = usePlugins();

  const html = useMemo(
    () =>
      renderMarkdownWithPlugins(content, {
        remarkPlugins: registry.getRemarkPlugins(),
        rehypePlugins: registry.getRehypePlugins(),
      }),
    [content, registry.version],
  );
  const tocItems = useMemo(() => extractToc(html), [html]);
  const highlightTheme = useEditorStore((s) => s.highlightTheme);
  const font = useEditorStore((s) => s.font);
  const ref = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // 同步 tocItems 到父级
  useEffect(() => {
    onTocChange?.(tocItems);
  }, [tocItems, onTocChange]);

  // 同步 activeId 到父级
  useEffect(() => {
    onActiveIdChange?.(activeId);
  }, [activeId, onActiveIdChange]);

  useInsertionEffect(() => {
    applyHighlightTheme(highlightTheme);
  }, [highlightTheme]);

  // 切换字体时直接应用到预览 DOM（内容重新渲染或视图切换后重新应用）
  useEffect(() => {
    if (!ref.current) return;
    const def = getFont(font);
    if (!def) return;
    ref.current.style.setProperty('font-family', def.uiFont, 'important');
  }, [font, html]);

  // 同步滚动位置（来自编辑器）
  useEffect(() => {
    if (!ref.current || scrollRatio === undefined) return;
    const el = ref.current;
    const max = el.scrollHeight - el.clientHeight;
    if (max > 0) {
      isSyncing.current = true;
      el.scrollTop = scrollRatio * max;
      requestAnimationFrame(() => {
        isSyncing.current = false;
      });
    }
  }, [scrollRatio]);

  // 发出滚动事件
  useEffect(() => {
    const el = ref.current;
    if (!el || !onScrollChange) return;
    const handler = () => {
      if (isSyncing.current) return;
      const max = el.scrollHeight - el.clientHeight;
      if (max > 0) onScrollChange(el.scrollTop / max);
    };
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, [onScrollChange]);

  // Scroll-spy：IntersectionObserver 高亮当前标题
  useEffect(() => {
    if (!ref.current || tocItems.length === 0) return;
    const headings = ref.current.querySelectorAll('h1[id], h2[id], h3[id]');
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [html, tocItems]);

  return (
    <div className="h-full">
      <div
        ref={ref}
        className="markdown-preview h-full"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
