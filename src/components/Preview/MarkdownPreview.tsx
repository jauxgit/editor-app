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
  const re = /<h([1-6])\s[^>]*?id="([^"]*)"[^>]*>(.*?)<\/h\1>/gi;
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

  // Scroll-spy：按滚动位置高亮「最接近预览顶部」的标题
  useEffect(() => {
    const root = ref.current;
    if (!root || tocItems.length === 0) return;

    let raf = 0;
    const updateActive = () => {
      const headings = root.querySelectorAll<HTMLElement>(
        'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]',
      );
      if (headings.length === 0) return;

      const rootTop = root.getBoundingClientRect().top;
      // 激活线：预览可视区顶部向下 8px（紧贴标题进入顶部时切换）
      const markerY = root.scrollTop + 8;

      let current = headings[0].id;
      for (const h of headings) {
        // 标题相对滚动内容顶部的绝对位置（比单纯 getBoundingClientRect 更稳）
        const headingTop = h.getBoundingClientRect().top - rootTop + root.scrollTop;
        if (headingTop <= markerY) {
          current = h.id;
        } else {
          break;
        }
      }

      // 滚到文档底部时锁定最后一个标题，避免底部空白区高亮回跳
      const atBottom = root.scrollTop + root.clientHeight >= root.scrollHeight - 2;
      if (atBottom) {
        current = headings[headings.length - 1].id;
      }

      setActiveId((prev) => (prev === current ? prev : current));
    };

    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateActive);
    };

    updateActive();
    root.addEventListener('scroll', onScroll, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onScroll) : null;
    ro?.observe(root);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      root.removeEventListener('scroll', onScroll);
      ro?.disconnect();
    };
  }, [html, tocItems]);

  // 代码块复制按钮
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('.code-copy-btn');
      if (!btn) return;

      const wrapper = (btn as HTMLElement).closest('.code-block-wrapper');
      if (!wrapper) return;

      const pre = wrapper.querySelector('pre');
      if (!pre) return;

      const code = pre.textContent || '';
      navigator.clipboard.writeText(code).then(() => {
        const original = btn.innerHTML;
        btn.innerHTML = '<span style="font-size:11px">✓</span>';
        btn.setAttribute('data-copied', 'true');
        setTimeout(() => {
          btn.innerHTML = original;
          btn.removeAttribute('data-copied');
        }, 1500);
      });
    };
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, []);

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
