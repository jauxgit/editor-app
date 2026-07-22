/**
 * MarkEdit CodeMirror 6 Theme
 * Uses CSS custom properties so it adapts to any theme automatically.
 */

import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

/**
 * EditorView theme — targets all CM6 inner elements.
 * Values use var(--*) so they respond to theme changes.
 */
export const warmEditorTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    fontSize: '14.5px',
    fontFamily: 'var(--font-mono)',
  },
  '.cm-content': {
    padding: '8px 0',
    caretColor: 'var(--accent)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--bg-elevated)',
    color: 'var(--text-dim)',
    borderRight: '1px solid var(--border-light)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
    color: 'var(--accent)',
    fontWeight: '600',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 12px 0 8px',
    fontSize: '11.5px',
    minWidth: '40px',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--accent-muted)',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--accent)',
    borderLeftWidth: '2px',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'var(--accent-ring) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'var(--accent-ring) !important',
  },
  '.cm-selectionMatch': {
    backgroundColor: 'var(--accent-muted)',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'var(--accent-muted)',
    outline: '1px solid var(--accent-ring)',
  },
  '.cm-searchMatch': {
    backgroundColor: 'var(--accent-muted)',
    outline: '1px solid var(--accent-ring)',
  },
  '.cm-searchMatch-selected': {
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-contrast)',
  },
  '.cm-tooltip': {
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul': {
      maxHeight: '220px',
      fontFamily: 'var(--font-mono)',
      fontSize: '13px',
    },
    '& > ul > li': {
      padding: '4px 10px',
    },
    '& > ul > li[aria-selected]': {
      backgroundColor: 'var(--accent)',
      color: 'var(--accent-contrast)',
    },
  },
  '.cm-panels': {
    backgroundColor: 'transparent',
  },
  '.cm-panel': {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '8px 12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
  },
  '.cm-panel input': {
    backgroundColor: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '13px',
    fontFamily: 'var(--font-ui)',
    outline: 'none',
    '&:focus': {
      borderColor: 'var(--accent)',
      boxShadow: '0 0 0 2px var(--accent-ring)',
    },
  },
  '.cm-panel label': {
    color: 'var(--text-secondary)',
    fontSize: '12px',
  },
  '.cm-button': {
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-contrast)',
    border: 'none',
    borderRadius: '6px',
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'var(--accent-hover)',
    },
  },
  '.cm-fat-cursor': {
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-contrast)',
  },
  '&.cm-focused .cm-fat-cursor': {
    backgroundColor: 'var(--accent)',
  },
  '.cm-selectionLayer': {
    backgroundColor: 'var(--accent-ring)',
  },
})

/**
 * Syntax highlighting — uses CSS custom properties keyed to each theme.
 * Each theme in lib/editorThemes.ts defines --syntax-* values.
 */
export const warmSyntaxHighlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: t.keyword, color: 'var(--syntax-keyword)', fontWeight: '500' },
    { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: 'var(--syntax-variable)' },
    { tag: [t.function(t.variableName), t.labelName], color: 'var(--syntax-function)' },
    { tag: t.color, color: 'var(--syntax-constant)' },
    { tag: [t.constant, t.standard(t.name) as any], color: 'var(--syntax-constant)' },
    { tag: [t.definition(t.name), t.separator], color: 'var(--syntax-variable)' },
    { tag: [t.typeName, t.className, t.tagName, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: 'var(--syntax-type)' },
    { tag: [t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: 'var(--syntax-type)' },
    { tag: [t.string, t.special(t.brace), t.regexp, t.escape], color: 'var(--syntax-string)' },
    { tag: [t.special(t.string), t.regexp, t.escape], color: 'var(--syntax-string)' },
    { tag: [t.comment, t.quote, t.link], color: 'var(--syntax-comment)', fontStyle: 'italic' },
    { tag: t.meta, color: 'var(--syntax-comment)' },
    { tag: t.invalid, color: 'var(--syntax-invalid)' },
    { tag: t.bracket, color: 'var(--text-secondary)' },
    { tag: t.punctuation, color: 'var(--text-dim)' },
    { tag: t.attributeName, color: 'var(--syntax-function)' },
    { tag: t.attributeValue, color: 'var(--syntax-string)' },
    { tag: t.operator, color: 'var(--syntax-operator)' },
    { tag: t.heading, color: 'var(--accent)', fontWeight: '600' },
    { tag: t.heading1, color: 'var(--accent)', fontWeight: '700' },
    { tag: t.heading2, color: 'var(--accent)', fontWeight: '600' },
    { tag: t.heading3, color: 'var(--accent)', fontWeight: '500' },
    { tag: t.strong, fontWeight: '600' },
    { tag: t.emphasis, fontStyle: 'italic' },
    { tag: t.strikethrough, textDecoration: 'line-through', color: 'var(--text-dim)' },
    { tag: t.url, color: 'var(--accent)', textDecoration: 'underline' },
    { tag: t.list, color: 'var(--accent)' },
    { tag: t.processingInstruction, color: 'var(--syntax-comment)' },
    { tag: t.inserted, color: 'var(--syntax-string)' },
    { tag: t.deleted, color: 'var(--syntax-invalid)' },
  ]),
)
