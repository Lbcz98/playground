/**
 * Live component bundle loading — Phase 8B.
 *
 * The bundle contract: a UMD build with `react` / `react-dom` external,
 * resolved against `window.React` / `window.ReactDOM` (set once in
 * `main.tsx` — the app's own instances, so a live component's hooks work
 * against the SAME React the rest of the app runs). It must, on load, set
 * `window.__sfsDesignSystem` to a plain object mapping manifest component ids
 * to React components.
 *
 * Loaded as a classic `<script>` (NOT `import()` — a `<script src>` is what
 * lets a UMD build read `window.React`/`window.ReactDOM` directly, and is
 * what the Phase 8A CSP change (`script-src design-system:`) actually covers).
 * Every load clears the global first and after, so a bundle that fails to set
 * it — or a stale value left by a previous load — is never mistaken for
 * success.
 */

import type { ComponentType } from 'react'

export const LIVE_BUNDLE_GLOBAL = '__sfsDesignSystem'

export type LiveComponentMap = Record<string, ComponentType<Record<string, unknown>>>

export type LiveBundleResult =
  | { ok: true; components: LiveComponentMap }
  | { ok: false; error: string }

/**
 * A React component type: a function or class, or one of React's wrapped forms —
 * `forwardRef`, `memo`, `lazy` — which are objects tagged with `$$typeof`.
 */
function isComponentType(value: unknown): boolean {
  if (typeof value === 'function') return true
  return typeof value === 'object' && value !== null && typeof (value as { $$typeof?: unknown }).$$typeof === 'symbol'
}

/** Pure — no DOM. What a bundle left on the global must look like to be usable. */
export function validateLiveBundleGlobal(value: unknown): LiveBundleResult {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {
      ok: false,
      error: `The bundle did not set window.${LIVE_BUNDLE_GLOBAL} to an object of components.`,
    }
  }
  const entries = Object.entries(value as Record<string, unknown>)
  if (entries.length === 0) {
    return { ok: false, error: `window.${LIVE_BUNDLE_GLOBAL} was empty — no components exported.` }
  }
  const notComponents = entries.filter(([, v]) => !isComponentType(v)).map(([k]) => k)
  if (notComponents.length > 0) {
    return {
      ok: false,
      error: `window.${LIVE_BUNDLE_GLOBAL} has non-component values for: ${notComponents.join(', ')}.`,
    }
  }
  return { ok: true, components: value as LiveComponentMap }
}

/**
 * Loads `design-system://<manifestId>/bundle.js` as a classic script and
 * returns its validated component map. Never throws — every failure mode
 * (script error, missing/malformed global) comes back as `{ ok: false }` so
 * the caller can fall back to the generic renderer.
 */
export async function loadLiveComponents(manifestId: string): Promise<LiveBundleResult> {
  const w = window as unknown as Record<string, unknown>
  delete w[LIVE_BUNDLE_GLOBAL]

  const script = document.createElement('script')
  script.src = `design-system://${manifestId}/bundle.js`

  const loaded = await new Promise<boolean>((resolve) => {
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.head.appendChild(script)
  })
  script.remove()

  if (!loaded) {
    return { ok: false, error: 'The component bundle failed to load.' }
  }

  const result = validateLiveBundleGlobal(w[LIVE_BUNDLE_GLOBAL])
  delete w[LIVE_BUNDLE_GLOBAL]
  return result
}
