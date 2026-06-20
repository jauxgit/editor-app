import type { Root, Element, Properties } from 'hast'

const LANGUAGE_NAMES: Record<string, string> = {
  javascript: 'JavaScript', js: 'JavaScript',
  typescript: 'TypeScript', ts: 'TypeScript',
  jsx: 'JSX', tsx: 'TSX',
  python: 'Python', py: 'Python',
  ruby: 'Ruby', rb: 'Ruby',
  rust: 'Rust', rs: 'Rust',
  go: 'Go', golang: 'Go',
  csharp: 'C#', 'c#': 'C#',
  fsharp: 'F#', 'f#': 'F#',
  css: 'CSS', scss: 'SCSS', less: 'Less',
  html: 'HTML', xml: 'XML', svg: 'SVG',
  bash: 'Bash', sh: 'Shell', zsh: 'Zsh', shell: 'Shell',
  powershell: 'PowerShell', ps1: 'PowerShell',
  json: 'JSON', yaml: 'YAML', yml: 'YAML', toml: 'TOML',
  sql: 'SQL', mysql: 'MySQL', pgsql: 'PostgreSQL', postgresql: 'PostgreSQL',
  java: 'Java', kotlin: 'Kotlin', scala: 'Scala',
  swift: 'Swift', dart: 'Dart',
  php: 'PHP',
  cpp: 'C++', c: 'C', 'c++': 'C++',
  elixir: 'Elixir', erlang: 'Erlang', haskell: 'Haskell',
  lua: 'Lua',
  markdown: 'Markdown', md: 'Markdown',
  dockerfile: 'Dockerfile', docker: 'Docker',
  graphql: 'GraphQL', gql: 'GraphQL',
  diff: 'Diff',
  regex: 'Regex', regexp: 'Regex',
  svelte: 'Svelte', vue: 'Vue',
  terraform: 'Terraform', tf: 'Terraform',
  wasm: 'WebAssembly', wat: 'WAT',
  makefile: 'Makefile', cmake: 'CMake',
  plaintext: 'Plain Text', text: 'Text',
  nginx: 'Nginx',
  ini: 'INI', cfg: 'Config',
  perl: 'Perl', r: 'R', matlab: 'MATLAB',
  groovy: 'Groovy', objectivec: 'Objective-C',
  clojure: 'Clojure', clj: 'Clojure',
  coffeescript: 'CoffeeScript', coffee: 'CoffeeScript',
  julia: 'Julia', nim: 'Nim',
}

function getExplicitLanguage(node: Element): string | undefined {
  const classes = node.properties?.className
  if (!Array.isArray(classes)) return undefined
  for (const cls of classes) {
    const s = String(cls)
    if (s.startsWith('language-')) return s.slice(9)
    if (s.startsWith('lang-')) return s.slice(5)
  }
  return undefined
}

// 遍历工具函数（替代 unist-util-visit，减少依赖）
function visitElement(tree: Element, fn: (node: Element, index: number, parent: Element) => void) {
  const children = tree.children
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (child.type === 'element') {
      fn(child as Element, i, tree)
      visitElement(child as Element, fn)
    }
  }
}

/** 在 rehypeHighlight 之前运行：将 `<code>` 的语言标记存到父级 `<pre>` 上 */
export function rehypeMarkExplicitLanguage() {
  return function (tree: Root) {
    visitElement(tree as unknown as Element, (node: Element, _index: number, parent: Element) => {
      if (node.tagName !== 'code') return
      const lang = getExplicitLanguage(node)
      if (!lang) return
      if (parent.tagName === 'pre') {
        parent.properties = parent.properties || {} as Properties
        ;(parent.properties as Record<string, unknown>).dataExplicitLang = lang
      }
    })
  }
}

/** 在 rehypeHighlight 之后运行：给有语言标记的 `<pre>` 添加语言标签 + 复制按钮 */
export function rehypeCodeLabels() {
  return function (tree: Root) {
    visitElement(tree as unknown as Element, (node: Element, index: number, parent: Element) => {
      if (node.tagName !== 'pre') return
      const props = node.properties as Record<string, unknown> | undefined
      const lang = props?.dataExplicitLang
      if (typeof lang !== 'string' || !lang) return
      delete props!.dataExplicitLang

      const displayName = LANGUAGE_NAMES[lang] || lang

      const wrapper: Element = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['code-block-wrapper'] },
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: { className: ['code-header'] },
            children: [
              {
                type: 'element',
                tagName: 'span',
                properties: {
                  className: ['code-lang-label'],
                  ...({ title: displayName } as Record<string, unknown>),
                },
                children: [{ type: 'text', value: displayName }],
              },
              {
                type: 'element',
                tagName: 'button',
                properties: {
                  className: ['code-copy-btn'],
                  title: 'Copy code',
                },
                children: [{
                  type: 'element',
                  tagName: 'svg',
                  properties: {
                    width: '14',
                    height: '14',
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    'stroke-width': '2',
                    'stroke-linecap': 'round',
                    'stroke-linejoin': 'round',
                  },
                  children: [
                    { type: 'element', tagName: 'rect', properties: { x: '9', y: '9', width: '13', height: '13', rx: '2', ry: '2' }, children: [] },
                    { type: 'element', tagName: 'path', properties: { d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' }, children: [] },
                  ],
                }],
              },
            ],
          },
          node,
        ],
      }

      parent.children[index] = wrapper
    })
  }
}
