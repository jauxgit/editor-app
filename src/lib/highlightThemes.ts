import githubDark from 'highlight.js/styles/github-dark.css?inline'
import githubLight from 'highlight.js/styles/github.css?inline'
import atomOneDark from 'highlight.js/styles/atom-one-dark.css?inline'
import atomOneLight from 'highlight.js/styles/atom-one-light.css?inline'
import monokai from 'highlight.js/styles/monokai.css?inline'
import nightOwl from 'highlight.js/styles/night-owl.css?inline'
import githubDarkDimmed from 'highlight.js/styles/github-dark-dimmed.css?inline'
import a11yLight from 'highlight.js/styles/a11y-light.css?inline'

export type HighlightThemeId =
  | 'github-dark'
  | 'github'
  | 'atom-one-dark'
  | 'atom-one-light'
  | 'monokai'
  | 'night-owl'
  | 'github-dark-dimmed'
  | 'a11y-light'

export interface HighlightTheme {
  id: HighlightThemeId
  label: string
  css: string
  variant: 'light' | 'dark'
}

export const highlightThemes: HighlightTheme[] = [
  { id: 'github-dark', label: 'GitHub Dark', css: githubDark, variant: 'dark' },
  { id: 'github', label: 'GitHub', css: githubLight, variant: 'light' },
  { id: 'atom-one-dark', label: 'Atom One Dark', css: atomOneDark, variant: 'dark' },
  { id: 'atom-one-light', label: 'Atom One Light', css: atomOneLight, variant: 'light' },
  { id: 'monokai', label: 'Monokai', css: monokai, variant: 'dark' },
  { id: 'night-owl', label: 'Night Owl', css: nightOwl, variant: 'dark' },
  { id: 'github-dark-dimmed', label: 'GitHub Dark Dimmed', css: githubDarkDimmed, variant: 'dark' },
  { id: 'a11y-light', label: 'A11y Light', css: a11yLight, variant: 'light' },
]

export const highlightThemeMap: Record<HighlightThemeId, HighlightTheme> = Object.fromEntries(
  highlightThemes.map(t => [t.id, t])
) as Record<HighlightThemeId, HighlightTheme>

let styleElement: HTMLStyleElement | null = null

export function applyHighlightTheme(themeId: HighlightThemeId): void {
  const theme = highlightThemeMap[themeId]
  if (!theme) return

  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.id = 'hljs-theme-dynamic'
    document.head.appendChild(styleElement)
  }

  styleElement.textContent = theme.css
}
