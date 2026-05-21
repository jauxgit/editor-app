import { pluginRegistry } from '../lib/pluginRegistry'
import { multiCursorPlugin } from './builtin/multiCursor'
import { codeLanguagesPlugin } from './builtin/codeLanguages'
import { markdownPipelinePlugin } from './builtin/markdownPipeline'
import { highlightThemePlugin } from './builtin/highlightThemes'

/** 注册所有内置插件 */
export function registerBuiltinPlugins() {
  pluginRegistry.register(multiCursorPlugin())
  pluginRegistry.register(codeLanguagesPlugin())
  pluginRegistry.register(markdownPipelinePlugin())
  pluginRegistry.register(highlightThemePlugin())
}
