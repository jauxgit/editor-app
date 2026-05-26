// MarkEdit 示例外置插件
// 插件 API 兼容 MarkEditPlugin 接口
// 插件需要自行 bundle 依赖（或直接导出配置对象）

export default {
  id: 'hello-world',
  name: 'Hello World',
  version: '1.0.0',
  description: '在命令面板添加一条打招呼命令',

  /** 命令面板中的命令 */
  commands: [
    {
      id: 'hello-world.greet',
      label: 'Hello World: Say Hi',
      category: 'Plugins',
      action: () => alert('👋 Hello from MarkEdit plugin!'),
    },
    {
      id: 'hello-world.time',
      label: 'Hello World: Insert Time',
      category: 'Plugins',
      action: () => {
        const now = new Date()
        const time = now.toLocaleTimeString()
        // 通过 window.markeditAPI 访问 CM6 编辑器
        const view = window.markeditAPI?.getActiveEditorView?.()
        if (view) {
          view.dispatch(view.state.replaceSelection(`<!-- ${time} -->`))
        }
      },
    },
  ],
}
