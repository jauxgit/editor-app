import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { highlightSelectionMatches, openSearchPanel, searchKeymap } from '@codemirror/search';
import { EditorState } from '@codemirror/state';
import { warmEditorTheme, warmSyntaxHighlight } from '../../lib/cm6Theme';
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
import { setActiveEditorView } from '../../lib/commands';
import { usePlugins } from '../../lib/pluginRegistry';
import { imageInlinePlugin } from '../../plugins/builtin/imagePlugin';
import { useEditorStore } from '../../stores/editorStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { ContextMenu, type ContextMenuItem } from '../ContextMenu/index';
import { useImageHandler } from './ImageDropHandler';

/** 构建编辑区右键菜单（全部由外置插件注册） */
function buildEditorContextMenu(
  registry: import('../../lib/pluginRegistry').PluginRegistry,
): ContextMenuItem[] {
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
  const markClean = useWorkspaceStore((s) => s.markClean);
  const root = useWorkspaceStore((s) => s.root);
  const tab = useWorkspaceStore((s) => s.openTabs.find((t) => t.path === docPath));
  const theme = useEditorStore((s) => s.theme);
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
      setActiveEditorView(null);
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
    if (!viewRef.current || !tab || !window.electronAPI) return false;
    const content = viewRef.current.state.doc.toString();
    const store = useWorkspaceStore.getState();

    // 先更新内容到 store
    store.updateContent(docPath, content);

    const currentTab = store.openTabs.find((t) => t.path === docPath);

    // untitled 文件 → 弹出保存对话框
    if (currentTab?.isUntitled) {
      const defaultDir = store.root || undefined;
      const savePath = await window.electronAPI.saveDialog(defaultDir);
      if (!savePath) return false;

      await window.electronAPI.writeFile(savePath, content);
      const newName = savePath.split(/[/\\]/).pop() || savePath;
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
  }, [docPath, tab]);

  // 注册 Electron 菜单保存事件
  useEffect(() => {
    if (!window.electronAPI || !tab) return;
    window.electronAPI.onMenuSave(() => {
      saveCurrentFile();
    });
  }, [docPath, tab, saveCurrentFile]);

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
  }, [docPath, tab, saveCurrentFile]);

  // 滚动位置同步
  useEffect(() => {
    if (!onScrollChange || !editorRef.current) return;
    const scroller = editorRef.current.querySelector('.cm-scroller');
    if (!scroller) return;
    const handler = () => {
      const max = scroller.scrollHeight - scroller.clientHeight;
      if (max > 0) onScrollChange(scroller.scrollTop / max);
    };
    scroller.addEventListener('scroll', handler, { passive: true });
    return () => scroller.removeEventListener('scroll', handler);
  }, [onScrollChange, docPath]);

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

  // 构建 MD 语法插入 + 插件右键菜单项
  const editorCtxItems: ContextMenuItem[] = ctxMenu ? buildEditorContextMenu(registry) : [];

  return (
    <>
      <div ref={editorRef} className="h-full w-full" style={{ overflow: 'auto' }} />
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={editorCtxItems}
          onClose={() => setCtxMenu(null)}
          theme={theme}
        />
      )}
    </>
  );
}
