/**
 * MarkEdit · 码记 — 编辑器主题系统
 *
 * 每个主题定义完整的 CSS 变量 + 元数据。
 * 通过 `data-theme="<id>"` 属性应用到 <html> 元素。
 */

export interface EditorTheme {
  id: string
  name: string
  nameZh: string
  isDark: boolean
  /** 图标显示的强调色 */
  iconColor: string
  /** SVG path for the theme icon (a 16×16 sun/moon/circle) */
  iconPath: string
  /** 匹配的 highlight.js 预览代码高亮主题 ID */
  highlightThemeId: string
  /** 全部 CSS 自定义属性键值对 */
  vars: Record<string, string>
}

export const editorThemes: EditorTheme[] = [
  // ─── 1. Warm Light ───────────────────────────────────────────
  {
    id: 'warm-light',
    name: 'Warm Light',
    nameZh: '暖色亮白',
    isDark: false,
    iconColor: '#a0703e',
    iconPath: 'M8 1.5v1.5M8 13v1.5M3.1 3.1l1.06 1.06M11.84 11.84l1.06 1.06M1.5 8H3M13 8h1.5M3.1 12.9l1.06-1.06M11.84 4.16l1.06-1.06M8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    highlightThemeId: 'github',
    vars: {
      '--bg-base': '#f5f0eb',
      '--bg-surface': '#ede7e0',
      '--bg-elevated': '#ffffff',
      '--bg-hover': '#e5ded6',
      '--bg-active': '#d9d0c6',
      '--border': '#d5ccc2',
      '--border-light': '#e2d9d0',
      '--text-primary': '#2c2824',
      '--text-secondary': '#6b6358',
      '--text-dim': '#9c9488',
      '--accent': '#a0703e',
      '--accent-hover': '#b8864e',
      '--accent-muted': 'rgba(160,112,62,0.12)',
      '--accent-ring': 'rgba(160,112,62,0.25)',
      '--noise-opacity': '0.015',
      '--syntax-keyword': '#c77d4a',
      '--syntax-string': '#8a9a5a',
      '--syntax-function': '#a0703e',
      '--syntax-type': '#8b7a5e',
      '--syntax-constant': '#c77d4a',
      '--syntax-comment': '#9c9488',
      '--syntax-invalid': '#d23a3a',
      '--syntax-operator': '#c77d4a',
      '--syntax-variable': '#2c2824',
    },
  },

  // ─── 2. Warm Dark ────────────────────────────────────────────
  {
    id: 'warm-dark',
    name: 'Warm Dark',
    nameZh: '暖色暗黑',
    isDark: true,
    iconColor: '#d4a574',
    iconPath: 'M13.5 9.5A6.5 6.5 0 0 1 6.5 2.5 6.5 6.5 0 1 0 13.5 9.5z',
    highlightThemeId: 'github-dark',
    vars: {
      '--bg-base': '#1a1714',
      '--bg-surface': '#25211c',
      '--bg-elevated': '#2f2a24',
      '--bg-hover': '#3a342e',
      '--bg-active': '#453e36',
      '--border': '#3d3730',
      '--border-light': '#2d2822',
      '--text-primary': '#e8e2da',
      '--text-secondary': '#a09888',
      '--text-dim': '#736b60',
      '--accent': '#d4a574',
      '--accent-hover': '#e0b88a',
      '--accent-muted': 'rgba(212,165,116,0.15)',
      '--accent-ring': 'rgba(212,165,116,0.25)',
      '--noise-opacity': '0.035',
      '--syntax-keyword': '#d4a574',
      '--syntax-string': '#a8c090',
      '--syntax-function': '#e0b88a',
      '--syntax-type': '#b8a898',
      '--syntax-constant': '#d4a574',
      '--syntax-comment': '#736b60',
      '--syntax-invalid': '#e05050',
      '--syntax-operator': '#d4a574',
      '--syntax-variable': '#e8e2da',
    },
  },

  // ─── 3. Nord ─────────────────────────────────────────────────
  {
    id: 'nord',
    name: 'Nord',
    nameZh: '北欧极光',
    isDark: false,
    iconColor: '#81a1c1',
    iconPath: 'M3 4.5A1.5 1.5 0 0 1 4.5 3h7A1.5 1.5 0 0 1 13 4.5v7a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 11.5zM6 8l2 2 4-4',
    highlightThemeId: 'atom-one-light',
    vars: {
      '--bg-base': '#eceff4',
      '--bg-surface': '#e5e9f0',
      '--bg-elevated': '#ffffff',
      '--bg-hover': '#d8dee9',
      '--bg-active': '#c8d0df',
      '--border': '#c8d0df',
      '--border-light': '#d8dee9',
      '--text-primary': '#2e3440',
      '--text-secondary': '#4c566a',
      '--text-dim': '#8a94a8',
      '--accent': '#5e81ac',
      '--accent-hover': '#6b93be',
      '--accent-muted': 'rgba(94,129,172,0.12)',
      '--accent-ring': 'rgba(94,129,172,0.25)',
      '--noise-opacity': '0.01',
      '--syntax-keyword': '#5e81ac',
      '--syntax-string': '#a3be8c',
      '--syntax-function': '#8fbcbb',
      '--syntax-type': '#b48ead',
      '--syntax-constant': '#d08770',
      '--syntax-comment': '#8a94a8',
      '--syntax-invalid': '#bf616a',
      '--syntax-operator': '#5e81ac',
      '--syntax-variable': '#2e3440',
    },
  },

  // ─── 4. Tokyo Night ──────────────────────────────────────────
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    nameZh: '东京之夜',
    isDark: true,
    iconColor: '#7aa2f7',
    iconPath: 'M12 3a6 6 0 0 0-6 6v5h12V9a6 6 0 0 0-6-6zM4 14h16M8 14v3M16 14v3',
    highlightThemeId: 'night-owl',
    vars: {
      '--bg-base': '#1a1b26',
      '--bg-surface': '#222330',
      '--bg-elevated': '#2a2b3d',
      '--bg-hover': '#333450',
      '--bg-active': '#3b3c5c',
      '--border': '#363854',
      '--border-light': '#2a2b3d',
      '--text-primary': '#c0caf5',
      '--text-secondary': '#9aa5ce',
      '--text-dim': '#565f89',
      '--accent': '#7aa2f7',
      '--accent-hover': '#89b4fa',
      '--accent-muted': 'rgba(122,162,247,0.15)',
      '--accent-ring': 'rgba(122,162,247,0.25)',
      '--noise-opacity': '0.04',
      '--syntax-keyword': '#bb9af7',
      '--syntax-string': '#9ece6a',
      '--syntax-function': '#7aa2f7',
      '--syntax-type': '#e0af68',
      '--syntax-constant': '#ff9e64',
      '--syntax-comment': '#565f89',
      '--syntax-invalid': '#db4b4b',
      '--syntax-operator': '#89ddff',
      '--syntax-variable': '#c0caf5',
    },
  },

  // ─── 5. Paper ────────────────────────────────────────────────
  {
    id: 'paper',
    name: 'Paper',
    nameZh: '纸色书写',
    isDark: false,
    iconColor: '#9c7c5c',
    iconPath: 'M4 2h8l2 2v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM8 7v4M6 9h4',
    highlightThemeId: 'a11y-light',
    vars: {
      '--bg-base': '#f8f3e9',
      '--bg-surface': '#f0e9db',
      '--bg-elevated': '#fffcf5',
      '--bg-hover': '#e8dfce',
      '--bg-active': '#ddd2bd',
      '--border': '#d4c8b2',
      '--border-light': '#e3d8c4',
      '--text-primary': '#3a3228',
      '--text-secondary': '#7a6e5e',
      '--text-dim': '#b0a490',
      '--accent': '#9c7c5c',
      '--accent-hover': '#b08f6e',
      '--accent-muted': 'rgba(156,124,92,0.12)',
      '--accent-ring': 'rgba(156,124,92,0.25)',
      '--noise-opacity': '0.02',
      '--syntax-keyword': '#b08050',
      '--syntax-string': '#7a9050',
      '--syntax-function': '#9c7c5c',
      '--syntax-type': '#8a7a60',
      '--syntax-constant': '#b08050',
      '--syntax-comment': '#b0a490',
      '--syntax-invalid': '#c05040',
      '--syntax-operator': '#b08050',
      '--syntax-variable': '#3a3228',
    },
  },
]

/** 通过 id 查找主题 */
export function getTheme(id: string): EditorTheme | undefined {
  return editorThemes.find(t => t.id === id)
}

/** 默认主题 ID */
export const DEFAULT_THEME_ID = 'warm-light'
