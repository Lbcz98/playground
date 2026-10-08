/**
 * Alpha variants of a colour token — the one definition both readers of
 * `tokens/tokens.json` share.
 *
 * A token like `color.opacity.dark.60` states its base once, as an alias, and its
 * alpha as `$extensions["com.screenflow.css"].alpha` (0..1). The CSS compiler
 * (`scripts/tokens/compile.ts`) keeps the alias live with `color-mix()`; the token
 * adapter (`token-adapter.ts`) needs a literal for the design system manifest and
 * gets it from `hexWithAlpha`. Framework-free.
 */

const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/** An alpha a token may declare: a number from 0 (transparent) to 1 (the base itself). */
export function isAlpha(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1
}

/** `0.3` → `30`, without the float noise of `0.3 * 100`. */
export function alphaPercent(alpha: number): number {
  return Number((alpha * 100).toFixed(2))
}

/**
 * A hex colour at `alpha`, as `#RRGGBBAA`; null when `hex` is not a hex colour.
 * A base that already carries alpha is multiplied. Halves round up, which is how
 * the hand-typed twins this replaces were made (30% → `4D`, 50% → `80`).
 */
export function hexWithAlpha(hex: string, alpha: number): string | null {
  if (!HEX.test(hex)) return null
  let digits = hex.slice(1)
  if (digits.length <= 4) digits = [...digits].map((c) => c + c).join('')
  const own = digits.length === 8 ? parseInt(digits.slice(6), 16) : 255
  const byte = Math.round((alphaPercent(alpha) * own) / 100)
  return `#${digits.slice(0, 6)}${byte.toString(16).padStart(2, '0')}`.toUpperCase()
}
