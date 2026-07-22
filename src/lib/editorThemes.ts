/**
 * MarkEdit · 码记 — 编辑器主题系统
 *
 * 设计论断（Three Shades 三阶墨色）：
 *   界面的层次靠「灰阶明度差」建立，而不是靠边框和透明叠加。
 *   唯一的强调色只出现在真正重要的瞬间。
 *
 * 每个主题定义四层灰阶 + 一个饱和 accent + 专属 syntax 色板：
 *   --bg-app       最外圈壳层（标题栏 / 工具栏 / 状态栏），明度最低、最“沉”
 *   --bg-base      基底（编辑器周边留白）
 *   --bg-surface   侧栏 / 卡片
 *   --bg-elevated  编辑器与弹层，明度最高、最“呼吸”
 *
 * 亮色主题用「压得住的深饱和色」做 accent（在浅底上保证对比度），
 * 暗色主题用「高明度发光色」做 accent（在深底上发光但不刺眼）。
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
  // ─── 1. 焦橙 · 亮 ────────────────────────────────────────────
  {
    id: 'warm-light',
    name: 'Ember',
    nameZh: '焦橙',
    isDark: false,
    iconColor: '#c2480f',
    iconPath: 'M8 1.5v1.5M8 13v1.5M3.1 3.1l1.06 1.06M11.84 11.84l1.06 1.06M1.5 8H3M13 8h1.5M3.1 12.9l1.06-1.06M11.84 4.16l1.06-1.06M8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    highlightThemeId: 'atom-one-light',
    vars: {
      '--bg-app': '#e6dfd2',
      '--bg-base': '#efeadd',
      '--bg-surface': '#f5f1e7',
      '--bg-elevated': '#fdfcf7',
      '--bg-hover': '#e7e0d1',
      '--bg-active': '#ddd5c3',
      '--border': '#d6cdba',
      '--border-light': '#e3dcc9',
      '--text-primary': '#221e18',
      '--text-secondary': '#6d6455',
      '--text-dim': '#a29a8b',
      '--accent': '#c2480f',
      '--accent-hover': '#a83c0c',
      '--accent-ink': '#8f3409',
      '--accent-contrast': '#fff4ec',
      '--accent-muted': 'rgba(194,72,15,0.13)',
      '--accent-ring': 'rgba(194,72,15,0.30)',
      '--noise-opacity': '0.03',
      '--syntax-keyword': '#b3470e',
      '--syntax-string': '#4e7d2e',
      '--syntax-function': '#1f6f8b',
      '--syntax-type': '#8a5a2e',
      '--syntax-constant': '#a03472',
      '--syntax-comment': '#9a917f',
      '--syntax-invalid': '#c23030',
      '--syntax-operator': '#b3470e',
      '--syntax-variable': '#221e18',
    },
  },

  // ─── 2. 焦橙 · 暗 ────────────────────────────────────────────
  {
    id: 'warm-dark',
    name: 'Ember Dark',
    nameZh: '焦橙暗夜',
    isDark: true,
    iconColor: '#ff6b1a',
    iconPath: 'M13.5 9.5A6.5 6.5 0 0 1 6.5 2.5 6.5 6.5 0 1 0 13.5 9.5z',
    highlightThemeId: 'atom-one-dark',
    vars: {
      '--bg-app': '#131109',
      '--bg-base': '#1a170f',
      '--bg-surface': '#221e14',
      '--bg-elevated': '#2b2618',
      '--bg-hover': '#35301f',
      '--bg-active': '#423a24',
      '--border': '#3d3622',
      '--border-light': '#2c2718',
      '--text-primary': '#eee6d8',
      '--text-secondary': '#a89d88',
      '--text-dim': '#6f6555',
      '--accent': '#ff6b1a',
      '--accent-hover': '#ff8a3d',
      '--accent-ink': '#ff6b1a',
      '--accent-contrast': '#1c1206',
      '--accent-muted': 'rgba(255,107,26,0.15)',
      '--accent-ring': 'rgba(255,107,26,0.32)',
      '--noise-opacity': '0.05',
      '--syntax-keyword': '#ff8a3d',
      '--syntax-string': '#a9c46f',
      '--syntax-function': '#5fb3c9',
      '--syntax-type': '#d1a35f',
      '--syntax-constant': '#e08fb0',
      '--syntax-comment': '#6f6555',
      '--syntax-invalid': '#ff6b6b',
      '--syntax-operator': '#ff8a3d',
      '--syntax-variable': '#eee6d8',
    },
  },

  // ─── 3. 北欧 · 冰蓝 ──────────────────────────────────────────
  {
    id: 'nord',
    name: 'Nordic',
    nameZh: '北欧冰蓝',
    isDark: false,
    iconColor: '#3b5bdb',
    iconPath: 'M3 4.5A1.5 1.5 0 0 1 4.5 3h7A1.5 1.5 0 0 1 13 4.5v7a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 11.5zM6 8l2 2 4-4',
    highlightThemeId: 'atom-one-light',
    vars: {
      '--bg-app': '#dde3ec',
      '--bg-base': '#e7ecf3',
      '--bg-surface': '#eef1f7',
      '--bg-elevated': '#fbfcfe',
      '--bg-hover': '#dde3ec',
      '--bg-active': '#cfd8e4',
      '--border': '#c6d0de',
      '--border-light': '#d8dfe9',
      '--text-primary': '#232a36',
      '--text-secondary': '#5b6676',
      '--text-dim': '#96a0af',
      '--accent': '#3b5bdb',
      '--accent-hover': '#2f4ac0',
      '--accent-ink': '#2a44a8',
      '--accent-contrast': '#eef2ff',
      '--accent-muted': 'rgba(59,91,219,0.11)',
      '--accent-ring': 'rgba(59,91,219,0.28)',
      '--noise-opacity': '0.025',
      '--syntax-keyword': '#3b5bdb',
      '--syntax-string': '#4c8a3f',
      '--syntax-function': '#1f7a8c',
      '--syntax-type': '#8c5ac8',
      '--syntax-constant': '#c25e1e',
      '--syntax-comment': '#96a0af',
      '--syntax-invalid': '#c23b4e',
      '--syntax-operator': '#3b5bdb',
      '--syntax-variable': '#232a36',
    },
  },

  // ─── 4. 东京之夜 · 霓虹紫 ────────────────────────────────────
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    nameZh: '东京之夜',
    isDark: true,
    iconColor: '#bb9af7',
    iconPath: 'M12 3a6 6 0 0 0-6 6v5h12V9a6 6 0 0 0-6-6zM4 14h16M8 14v3M16 14v3',
    highlightThemeId: 'night-owl',
    vars: {
      '--bg-app': '#14151f',
      '--bg-base': '#1a1b26',
      '--bg-surface': '#212230',
      '--bg-elevated': '#282938',
      '--bg-hover': '#31324a',
      '--bg-active': '#3b3c58',
      '--border': '#363852',
      '--border-light': '#2a2b3d',
      '--text-primary': '#c9d4f5',
      '--text-secondary': '#98a3cc',
      '--text-dim': '#5a6285',
      '--accent': '#bb9af7',
      '--accent-hover': '#cdb4ff',
      '--accent-ink': '#bb9af7',
      '--accent-contrast': '#1d1430',
      '--accent-muted': 'rgba(187,154,247,0.15)',
      '--accent-ring': 'rgba(187,154,247,0.32)',
      '--noise-opacity': '0.05',
      '--syntax-keyword': '#bb9af7',
      '--syntax-string': '#9ece6a',
      '--syntax-function': '#7aa2f7',
      '--syntax-type': '#e0af68',
      '--syntax-constant': '#ff9e64',
      '--syntax-comment': '#5a6285',
      '--syntax-invalid': '#f7768e',
      '--syntax-operator': '#89ddff',
      '--syntax-variable': '#c9d4f5',
    },
  },

  // ─── 5. 宣纸 · 墨绿 ──────────────────────────────────────────
  {
    id: 'paper',
    name: 'Paper Ink',
    nameZh: '宣纸墨绿',
    isDark: false,
    iconColor: '#3f6b4f',
    iconPath: 'M4 2h8l2 2v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM8 7v4M6 9h4',
    highlightThemeId: 'a11y-light',
    vars: {
      '--bg-app': '#e9e2d0',
      '--bg-base': '#f1ebdb',
      '--bg-surface': '#f6f1e4',
      '--bg-elevated': '#fcf9f0',
      '--bg-hover': '#e9e1cd',
      '--bg-active': '#ded4ba',
      '--border': '#d5c9ae',
      '--border-light': '#e2d8c2',
      '--text-primary': '#2b2618',
      '--text-secondary': '#71674f',
      '--text-dim': '#a89d83',
      '--accent': '#3f6b4f',
      '--accent-hover': '#355a42',
      '--accent-ink': '#2c4f39',
      '--accent-contrast': '#eef5ef',
      '--accent-muted': 'rgba(63,107,79,0.13)',
      '--accent-ring': 'rgba(63,107,79,0.30)',
      '--noise-opacity': '0.04',
      '--syntax-keyword': '#3f6b4f',
      '--syntax-string': '#7a8a3a',
      '--syntax-function': '#2e6f6f',
      '--syntax-type': '#8a6a2e',
      '--syntax-constant': '#a8542e',
      '--syntax-comment': '#a89d83',
      '--syntax-invalid': '#b8402e',
      '--syntax-operator': '#3f6b4f',
      '--syntax-variable': '#2b2618',
    },
  },
]

/** 通过 id 查找主题 */
export function getTheme(id: string): EditorTheme | undefined {
  return editorThemes.find(t => t.id === id)
}

/** 默认主题 ID */
export const DEFAULT_THEME_ID = 'warm-light'
