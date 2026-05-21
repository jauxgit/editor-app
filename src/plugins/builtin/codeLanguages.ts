import type { MarkEditPlugin } from '../../lib/pluginRegistry'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { json } from '@codemirror/lang-json'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { go } from '@codemirror/lang-go'
import { rust } from '@codemirror/lang-rust'
import { php } from '@codemirror/lang-php'
import { sql } from '@codemirror/lang-sql'
import { xml } from '@codemirror/lang-xml'
import { yaml } from '@codemirror/lang-yaml'

export function codeLanguagesPlugin(): MarkEditPlugin {
  return {
    id: 'core.code-languages',
    name: 'Code Block Languages',
    version: '1.0.0',
    codeLanguages: {
      javascript: javascript(),
      js: javascript(),
      jsx: javascript({ jsx: true }),
      typescript: javascript({ typescript: true }),
      ts: javascript({ typescript: true }),
      tsx: javascript({ typescript: true, jsx: true }),
      python: python(),
      py: python(),
      json: json(),
      css: css(),
      html: html(),
      java: java(),
      cpp: cpp(),
      c: cpp(),
      'c++': cpp(),
      go: go(),
      rust: rust(),
      php: php(),
      sql: sql(),
      xml: xml(),
      yaml: yaml(),
      toml: yaml(),
      csharp: java(),
      'c#': java(),
      kotlin: java(),
      scala: java(),
      swift: java(),
      bash: javascript(),
      sh: javascript(),
    },
    fileExtensions: {
      '.js': javascript(),
      '.mjs': javascript(),
      '.cjs': javascript(),
      '.jsx': javascript({ jsx: true }),
      '.ts': javascript({ typescript: true }),
      '.mts': javascript({ typescript: true }),
      '.cts': javascript({ typescript: true }),
      '.tsx': javascript({ typescript: true, jsx: true }),
      '.py': python(),
      '.json': json(),
      '.css': css(),
      '.html': html(),
      '.htm': html(),
      '.java': java(),
      '.cs': java(),
      '.cpp': cpp(),
      '.c': cpp(),
      '.h': cpp(),
      '.hpp': cpp(),
      '.go': go(),
      '.rs': rust(),
      '.php': php(),
      '.sql': sql(),
      '.xml': xml(),
      '.yaml': yaml(),
      '.yml': yaml(),
      '.kt': java(),
      '.kts': java(),
      '.scala': java(),
      '.swift': java(),
      '.sh': javascript(),
      '.bash': javascript(),
    },
  }
}
