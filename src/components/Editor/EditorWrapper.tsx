import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown, markdownKeymap, markdownLanguage } from '@codemirror/lang-markdown';
import { highlightSelectionMatches, openSearchPanel, searchKeymap } from '@codemirror/search';
import { EditorState } from '@codemirror/state';
import {
  crosshairCursor,
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from '@codemirror/view';
import { useCallback, useEffect, useRef, useState } from 'react';
import { warmEditorTheme, warmSyntaxHighlight } from '../../lib/cm6Theme';
import { removeActiveEditorView, setActiveEditorView } from '../../lib/commands';
import { getFont } from '../../lib/editorFonts';
import { PluginRegistry, usePlugins } from '../../lib/pluginRegistry';
import { imageInlinePlugin } from '../../plugins/builtin/imagePlugin';
import { useEditorStore } from '../../stores/editorStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { ContextMenu, type ContextMenuItem } from '../ContextMenu';
import { useImageHandler } from './ImageDropHandler';

/** 构建编辑区右键菜单（全部由外置插件注册） */
function buildEditorContextMenu(registry: PluginRegistry): ContextMenuItem[] {
  return registry.getContextMenuItems();
}
interface Props {
  docPath: string;
  onScrollChange?: (ratio: number) => void;
}

export function EditorWrapper({ docPath, onScrollChange }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const updateContent = useWorkspaceStore((s) => s.updateContent);
  const root = useWorkspaceStore((s) => s.root);
  const tab = useWorkspaceStore((s) => s.openTabs.find((t) => t.path === docPath));
  const theme = useEditorStore((s) => s.theme);
  const font = useEditorStore((s) => s.font);
  const fontSize = useEditorStore((s) => s.fontSize);
  const setFontSize = useEditorStore((s) => s.setFontSize);
  const registry = usePlugins();
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; view: EditorView } | null>(null);

  // 在光标位置插入文本
  const onInsertAtCursor = useCallback((text: string) => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch(view.state.replaceSelection(text));
    view.focus();
  }, []);

  // 图片拖入/粘贴处理
  useImageHandler({ docPath, containerRef: editorRef, onInsertAtCursor });

  // 动态注册/更新图片内联渲染插件（依赖 workspace root）
  useEffect(() => {
    const id = 'core.image-render';
    if (registry.has(id)) {
      registry.unregister(id);
    }
    registry.register(imageInlinePlugin(root));
  }, [root]);

  // 初始化 CodeMirror
  useEffect(() => {
    if (!editorRef.current || !tab) return;

    if (viewRef.current) {
      viewRef.current.destroy();
    }

    // 检测文件扩展名，代码文件使用对应语言高亮，否则按 Markdown 处理
    const fileLang = registry.getFileLanguage(docPath);

    const extensions = [
      lineNumbers(),
      EditorView.lineWrapping,
      highlightActiveLine(),
      highlightSpecialChars(),
      highlightSelectionMatches(),
      drawSelection(),
      rectangularSelection(),
      crosshairCursor(),
      history(),
      closeBrackets(),
      warmSyntaxHighlight,
      keymap.of([
        ...markdownKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        { key: 'Mod-h', run: openSearchPanel },
        ...closeBracketsKeymap,
        indentWithTab,
      ]),
      // 代码文件 → 使用对应语言的全文高亮；Markdown/其他 → 使用 Markdown + 代码块高亮
      fileLang ??
        markdown({
          base: markdownLanguage,
          codeLanguages: registry.getCodeParser(),
        }),
      // 从插件注册表收集扩展
      ...registry.getAllExtensions(),
      warmEditorTheme,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const content = update.state.doc.toString();
          updateContent(docPath, content);
        }
      }),
    ];

    const state = EditorState.create({
      doc: tab.content,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;
    setActiveEditorView(view);

    return () => {
      removeActiveEditorView(view);
      view.destroy();
      viewRef.current = null;
    };
  }, [docPath, theme, registry.version]);

  // 同步外部内容变更到编辑器
  useEffect(() => {
    if (!viewRef.current || !tab) return;
    const current = viewRef.current.state.doc.toString();
    if (tab.content !== current && tab.content !== undefined) {
      viewRef.current.dispatch({
        changes: { from: 0, to: current.length, insert: tab.content },
      });
    }
  }, [tab?.content]);

  // ===== 保存逻辑（处理 untitled 标签 + 保存对话框） =====
  const saveCurrentFile = useCallback(async () => {
    if (!viewRef.current || !window.electronAPI) return false;
    const content = viewRef.current.state.doc.toString();
    const store = useWorkspaceStore.getState();
    const currentTab = store.openTabs.find((t) => t.path === docPath);
    if (!currentTab) return false;

    // untitled 文件 → 弹出保存对话框
    if (currentTab?.isUntitled) {
      const defaultDir = store.root || undefined;
      const savePath = await window.electronAPI.saveDialog(defaultDir);
      if (!savePath) return false;

      await window.electronAPI.writeFile(savePath, content);
      store.updateTabPath(docPath, savePath);
      store.markClean(savePath);

      // 如果没有打开过文件夹，设 root 为保存位置的父目录
      if (!store.root) {
        const parentDir = savePath.substring(
          0,
          Math.max(savePath.lastIndexOf('/'), savePath.lastIndexOf('\\')),
        );
        store.setRoot(parentDir);
      }
      store.triggerRefresh();
      return true;
    }

    // 普通文件直接保存
    await window.electronAPI.writeFile(docPath, content);
    store.markClean(docPath);
    return true;
  }, [docPath]);

  // 注册 Electron 菜单保存事件
  useEffect(() => {
    if (!window.electronAPI) return;
    window.electronAPI.onMenuSave(() => {
      saveCurrentFile();
    });
  }, [saveCurrentFile]);

  // Ctrl+S 保存
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentFile();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveCurrentFile]);

  // 滚动位置同步 — rAF 轮询检测滚动变化
  useEffect(() => {
    if (!onScrollChange) return;
    if (!editorRef.current) return;

    const scroller = editorRef.current.querySelector('.cm-scroller') as HTMLElement | null;
    if (!scroller) return;

    let lastTop = scroller.scrollTop;
    let rafId: number;

    const poll = () => {
      const currentTop = scroller.scrollTop;
      if (currentTop !== lastTop) {
        lastTop = currentTop;
        const max = scroller.scrollHeight - scroller.clientHeight;
        if (max > 0) onScrollChange(currentTop / max);
      }
      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);

    return () => cancelAnimationFrame(rafId);
  }, [onScrollChange, docPath, registry.version]);

  // 切换字体时直接应用到编辑器 DOM（使用 !important 覆盖 CM6 内部样式）
  // 依赖项与 init effect 保持一致，确保 EditorView 重建后重新应用字体 + 字号
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const def = getFont(font);
    if (!def) return;
    const fontVal = def.monoFont;
    view.dom.style.setProperty('font-family', fontVal, 'important');
    if (view.contentDOM) {
      view.contentDOM.style.setProperty('font-family', fontVal, 'important');
    }
    view.dom.style.setProperty('font-size', `${fontSize}px`, 'important');
    if (view.contentDOM) {
      view.contentDOM.style.setProperty('font-size', `${fontSize}px`, 'important');
    }
  }, [font, docPath, theme, registry.version, fontSize]);

  // 监听图片双击事件
  useEffect(() => {
    const handler = (e: Event) => {
      const { path } = (e as CustomEvent).detail;
      // 在 Electron 中，发送到主进程以系统查看器打开
      if (window.electronAPI && path) {
        // 使用 openExternal 之类的 API（此处简化处理）
        console.log('Open image externally:', path);
      }
    };
    window.addEventListener('image:dblclick', handler);
    return () => window.removeEventListener('image:dblclick', handler);
  }, []);

  // 编辑区右键菜单
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      e.preventDefault();
      const view = viewRef.current;
      if (!view) return;
      setCtxMenu({ x: e.clientX, y: e.clientY, view });
    };
    el.addEventListener('contextmenu', handler);
    return () => el.removeEventListener('contextmenu', handler);
  }, []);

  // Ctrl + 鼠标滚轮 → 调整字号
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const el = view.scrollDOM;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const dir = e.deltaY > 0 ? -1 : 1;
      const step = e.shiftKey ? 2 : 1;
      const next = Math.max(10, Math.min(24, fontSize + dir * step));
      if (next !== fontSize) setFontSize(next);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [fontSize, setFontSize, docPath,registry.version]);

  // 构建 MD 语法插入 + 插件右键菜单项
  const editorCtxItems: ContextMenuItem[] = ctxMenu ? buildEditorContextMenu(registry) : [];

  return (
    <>
      <div ref={editorRef} className="h-full w-full" />
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={editorCtxItems}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  );
}
