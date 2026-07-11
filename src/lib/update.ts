/** Shared update helpers for MarkEdit auto-update. */

export const APP_VERSION =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.1.0'

export const GITHUB_URL = 'https://github.com/jauxgit/editor-app'

export const GITHUB_API =
  'https://api.github.com/repos/jauxgit/editor-app/releases/latest'

export const GITHUB_RELEASES =
  'https://github.com/jauxgit/editor-app/releases/latest'

export interface ReleaseAsset {
  version: string
  url: string
  name: string
}

export interface LatestRelease {
  version: string
  assets: ReleaseAsset[]
  hasUpdate: boolean
}

/** Simple semver-ish compare: true if latest > current */
export function isNewerVersion(latest: string, current: string): boolean {
  const la = latest.replace(/^v/, '').split('.').map(Number)
  const ca = current.replace(/^v/, '').split('.').map(Number)
  for (let i = 0; i < Math.max(la.length, ca.length); i++) {
    const l = la[i] || 0
    const c = ca[i] || 0
    if (l !== c) return l > c
  }
  return false
}

/** Prefer NSIS Setup installer asset when available. */
export function pickInstallerAsset(assets: ReleaseAsset[]): ReleaseAsset | null {
  if (assets.length === 0) return null
  return (
    assets.find((a) => /setup/i.test(a.name) && /\.exe$/i.test(a.name)) ||
    assets.find((a) => /\.exe$/i.test(a.name)) ||
    assets[0]
  )
}

export async function fetchLatestRelease(): Promise<LatestRelease> {
  const res = await fetch(GITHUB_API)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const tag: string = data.tag_name || ''
  const version = tag.replace(/^v/, '')
  const assets: ReleaseAsset[] = (data.assets || []).map(
    (asset: { browser_download_url: string; name: string }) => ({
      version,
      url: asset.browser_download_url,
      name: asset.name,
    }),
  )
  return {
    version,
    assets,
    hasUpdate: isNewerVersion(version, APP_VERSION),
  }
}
