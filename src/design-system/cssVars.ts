/**
 * Design-system tokens → CSS custom properties.
 *
 * `DesignSystemProvider` calls `applyTokens` whenever the active design system
 * changes: it purges the previously-injected `--sfs-*` properties and writes the
 * new manifest's `tokens` onto the target element (spec §6 Step 2 — "Purge the
 * previous system's tokens and inject the active system's tokens into the DOM as
 * CSS variables").
 *
 * DOM-only. No literal design values live here — every value comes from the
 * active manifest at runtime.
 */

import type { ManifestTokens } from '@/shared/design-system/manifest'
import { SCREENFLOW_MANIFEST } from '@/shared/design-system/screenflow-manifest'

const PREFIX = '--sfs-'

const GROUPS: Array<[keyof ManifestTokens, string]> = [
  ['colors', 'color'],
  ['spacing', 'space'],
  ['typography', 'type'],
  ['radius', 'radius'],
  ['shadow', 'shadow'],
]

/**
 * The built-in ScreenFlow token values, as `--sfs-*` vars. The canvas seeds
 * these underneath the active manifest's own tokens (see `Canvas.tsx`) so a
 * partial imported system still has every var the generic renderer reads —
 * `check-tokens.mjs` can stay strict about "no literal fallback in `var()`"
 * because there's always a base layer underneath.
 */
export function screenflowBaseVars(): Record<string, string> {
  return manifestTokensToCssVars(SCREENFLOW_MANIFEST.tokens)
}

export function manifestTokensToCssVars(tokens: ManifestTokens): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const [group, alias] of GROUPS) {
    const dict = tokens[group]
    if (!dict) continue
    for (const [name, value] of Object.entries(dict)) {
      vars[`${PREFIX}${alias}-${name}`] = value
    }
  }
  return vars
}

/** Remove every `--sfs-*` custom property this module previously set on `el`. */
export function purgeTokens(el: HTMLElement): void {
  for (const name of Array.from(el.style)) {
    if (name.startsWith(PREFIX)) el.style.removeProperty(name)
  }
}

/** Purge, then set — so switching systems never leaves a stale token behind. */
export function applyTokens(el: HTMLElement, vars: Record<string, string>): void {
  purgeTokens(el)
  for (const [name, value] of Object.entries(vars)) {
    el.style.setProperty(name, value)
  }
}
