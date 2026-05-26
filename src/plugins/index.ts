import { pluginRegistry } from '../lib/pluginRegistry'
import { multiCursorPlugin } from './builtin/multiCursor'
import { codeLanguagesPlugin } from './builtin/codeLanguages'
import { markdownPipelinePlugin } from './builtin/markdownPipeline'
import { highlightThemePlugin } from './builtin/highlightThemes'

/** 注册所有内置插件 + 加载外置插件 */
export function registerBuiltinPlugins() {
  pluginRegistry.register(multiCursorPlugin(), true)
  pluginRegistry.register(codeLanguagesPlugin(), true)
  pluginRegistry.register(markdownPipelinePlugin(), true)
  pluginRegistry.register(highlightThemePlugin(), true)

  // 异步扫描外置插件
  pluginRegistry.scanExternal().catch(e =>
    console.error('[plugin] scanExternal failed:', e)
  )
}
