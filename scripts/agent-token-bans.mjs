/**
 * Tokens DESIGN.md bans for anything an agent draws. They stay in tokens.json,
 * global.css and the ui-kit (some components still use them). Agent-facing guides
 * omit them, and the explore checks name the replacement.
 *
 * DESIGN.md:
 * - §3.2 three weights: regular, medium, bold. Never extra-bold.
 * - §3.3 the smallest text is .text-footnote-* (12px), and only for a secondary
 *   label that carries no decision. Everything else is .text-body-sm-* (14px)
 *   or larger. .text-caption-* (10px) is not used.
 * - §4.6 and §12.6 no pure black. text-inverse is #000000; dark text on a light
 *   fill uses background-primary.
 */

const READABLE =
  '--typography-font-size-sm for a secondary label (.text-footnote-*), or --typography-font-size-md (.text-body-sm-*) otherwise'

/** @param {string | readonly string[]} path Token path, dotted or as segments. */
export function isAgentHiddenToken(path) {
  const p = Array.isArray(path) ? path.join('.') : path
  if (p === 'color.semantic.functional.text-inverse') return true
  if (p === 'typography.fontWeight.extra-bold') return true
  if (p === 'typography.fontSize.xs') return true
  if (p === 'typography.caption' || p.startsWith('typography.caption.')) return true
  if (p.endsWith('.extra-bold')) return true
  return false
}

/** @param {string} name CSS variable, including the leading --. */
export function banForCssVar(name) {
  if (name === '--color-semantic-functional-text-inverse')
    return { reason: 'pure black #000000', use: '--color-semantic-functional-background-primary' }
  if (name === '--typography-font-weight-extra-bold')
    return { reason: 'three weights only: regular, medium, bold', use: '--typography-font-weight-bold' }
  if (name === '--typography-font-size-xs') return { reason: 'min readable size', use: READABLE }
  return null
}

/** A literal font-size below the footnote floor (DESIGN §3.3). @param {number} px */
export function banForFontSizePx(px) {
  if (!(px < 12)) return null
  return { reason: 'min readable size', use: READABLE }
}

/**
 * @param {string} name Type class, with or without the leading dot.
 * @returns {{ reason: string, use: string } | null}
 */
export function banForClass(name) {
  const n = name.replace(/^\./, '')
  if (n === 'text-caption' || n.startsWith('text-caption-')) {
    const weight = n.slice('text-caption-'.length)
    const mapped = weight === 'bold' || weight === 'extra-bold' ? 'bold' : 'medium'
    return {
      reason: 'min readable size',
      use: `.text-footnote-${mapped} for a secondary label, or .text-body-sm-${mapped} otherwise`,
    }
  }
  if (/(^|-)extra-bold$/.test(n)) {
    const style = n.replace(/^text-/, '').replace(/-extra-bold$/, '')
    return {
      reason: 'three weights only: regular, medium, bold',
      use: style ? `.text-${style}-bold` : '--typography-font-weight-bold',
    }
  }
  return null
}

/** @param {string} label @param {{ reason: string, use: string }} ban */
export function banSentence(label, ban) {
  const shown = label.startsWith('text-') ? `.${label}` : label
  return `${shown} is banned on TV (${ban.reason}); use ${ban.use}`
}

/** Closest allowed name. Skips tokens {@link banForCssVar} rejects. @param {string} name @param {Iterable<string>} names */
export function closestName(name, names) {
  let best
  let bestDist = Infinity
  for (const candidate of names) {
    if (candidate === name || banForCssVar(candidate)) continue
    const d = levenshtein(name, candidate)
    if (d < bestDist || (d === bestDist && (best === undefined || candidate < best))) {
      best = candidate
      bestDist = d
    }
  }
  return best
}

/** @param {string} a @param {string} b */
function levenshtein(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    const ca = a.charCodeAt(i - 1)
    for (let j = 1; j <= b.length; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    prev = cur
  }
  return prev[b.length]
}
