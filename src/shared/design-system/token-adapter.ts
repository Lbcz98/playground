/**
 * Design-token ingestion — the Adapter pattern, token half.
 *
 * `parseDesignTokens` normalises a design-token export into our `ManifestTokens`
 * shape (flat `Record<name, cssValue>` per semantic group). It targets:
 *
 *   - W3C Design Tokens (DTCG):        { color: { brand: { $value, $type } } }
 *   - pre-DTCG Style Dictionary:       { color: { brand: { value, type } } }
 *   - already-grouped ManifestTokens:  { colors: { brand: <hex> }, spacing: {…} }
 *   - a flat map:                      { "color-brand": <hex>, "space-md": <length> }
 *
 * `$type` is inherited from the nearest ancestor group; `{dot.path}` / `$aliasOf`
 * references are resolved. Every token is categorised into colors / spacing /
 * typography / radius / shadow by its type first, then by name/path heuristics,
 * then by what its value looks like.
 *
 * Framework-free — usable from the Electron main process.
 */

import type { ManifestTokens } from './manifest'

export type TokenGroup = keyof ManifestTokens

const GROUPS: TokenGroup[] = ['colors', 'spacing', 'typography', 'radius', 'shadow']

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

// ---------------------------------------------------------------------------
// Group detection
// ---------------------------------------------------------------------------

/** A leading path segment matching this just names the token's group — we drop it. */
const GROUP_PREFIX =
  /^(colou?rs?|palette|spac(e|ing)|sizes?|sizing|dimensions?|gaps?|typ(o|ography)?|fonts?|text|radi(us|i)|corners?|rounded|border-?radius|shadows?|elevations?|box-?shadow)$/i

function groupFromType(type: string | undefined): TokenGroup | null {
  switch ((type ?? '').toLowerCase().replace(/[\s_-]/g, '')) {
    case 'color':
      return 'colors'
    case 'shadow':
    case 'boxshadow':
      return 'shadow'
    case 'borderradius':
    case 'radius':
    case 'cornerradius':
      return 'radius'
    case 'fontfamily':
    case 'fontweight':
    case 'fontsize':
    case 'fontstyle':
    case 'lineheight':
    case 'letterspacing':
    case 'typography':
    case 'textstyle':
      return 'typography'
    default:
      return null
  }
}

function groupFromName(path: string[]): TokenGroup | null {
  const p = path.join(' ').toLowerCase()
  if (/colou?r|palette|background|foreground|\bfg\b|\bbg\b|fill|stroke|border(?!-radius)/.test(p)) {
    return 'colors'
  }
  if (/radi|corner|rounded/.test(p)) return 'radius'
  if (/shadow|elevation/.test(p)) return 'shadow'
  if (/font|typograph|leading|line-?height|letter-?spacing|\btext\b/.test(p)) return 'typography'
  if (/spac|\bgap\b|\bsize\b|sizing|margin|padding|inset|dimension/.test(p)) return 'spacing'
  return null
}

function groupFromValue(value: string): TokenGroup | null {
  const v = value.trim().toLowerCase()
  if (/^#[0-9a-f]{3,8}$/.test(v) || /^(rgb|hsl|oklch|lab|color)\(/.test(v) || /^(transparent|currentcolor)$/.test(v)) {
    return 'colors'
  }
  if (/\d+px\s+\d+px/.test(v) || /\binset\b/.test(v)) return 'shadow'
  if (/^-?\d*\.?\d+(px|rem|em|%|vh|vw|pt)$/.test(v)) return 'spacing'
  return null
}

// ---------------------------------------------------------------------------
// Value normalisation
// ---------------------------------------------------------------------------

function dimensionToCss(v: unknown): string | null {
  if (typeof v === 'number') return `${v}px`
  if (typeof v === 'string') return v
  if (isObject(v) && (typeof v.value === 'number' || typeof v.value === 'string')) {
    const unit = typeof v.unit === 'string' ? v.unit : 'px'
    return typeof v.value === 'number' ? `${v.value}${unit}` : String(v.value)
  }
  return null
}

function shadowToCss(v: unknown): string | null {
  const one = (s: Record<string, unknown>): string => {
    const parts = [s.offsetX, s.offsetY, s.blur, s.spread]
      .map((p) => dimensionToCss(p))
      .filter((p): p is string => p !== null)
    const color = typeof s.color === 'string' ? s.color : ''
    const inset = s.inset === true ? 'inset ' : ''
    return `${inset}${parts.join(' ')}${color ? ` ${color}` : ''}`.trim()
  }
  if (Array.isArray(v)) return v.filter(isObject).map(one).join(', ') || null
  if (isObject(v) && ('offsetX' in v || 'offsetY' in v || 'blur' in v)) return one(v)
  if (typeof v === 'string') return v
  return null
}

/** Turn a raw token `$value` into a single CSS string for the given group. */
function valueToCss(raw: unknown, group: TokenGroup | null): string | null {
  if (typeof raw === 'string') return raw
  if (typeof raw === 'number') return group === 'colors' ? String(raw) : `${raw}px`

  if (group === 'shadow') return shadowToCss(raw)
  if (group === 'spacing' || group === 'radius') return dimensionToCss(raw)

  if (isObject(raw)) {
    // Composite typography / misc object — pick a representative scalar.
    for (const key of ['fontSize', 'value', 'size']) {
      const hit = raw[key]
      if (typeof hit === 'string' || typeof hit === 'number') return String(hit)
    }
    const dim = dimensionToCss(raw)
    if (dim) return dim
  }
  return null
}

// ---------------------------------------------------------------------------
// Tree walk
// ---------------------------------------------------------------------------

interface RawToken {
  path: string[]
  value: unknown
  type?: string
  ref?: string
}

const VALUE_KEYS = ['$value', 'value']
const TYPE_KEYS = ['$type', 'type']

function readKeyed(node: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) if (k in node) return node[k]
  return undefined
}

function isTokenNode(node: Record<string, unknown>): boolean {
  return VALUE_KEYS.some((k) => k in node) || '$aliasOf' in node
}

function refString(v: unknown): string | undefined {
  if (typeof v === 'string') {
    const m = v.match(/^\{([^}]+)\}$/)
    if (m) return m[1].replace(/\.\$value$/, '')
  }
  return undefined
}

function walk(
  node: unknown,
  path: string[],
  inheritedType: string | undefined,
  out: RawToken[],
): void {
  if (!isObject(node)) return

  if (isTokenNode(node)) {
    const rawValue = readKeyed(node, VALUE_KEYS)
    const alias = typeof node.$aliasOf === 'string' ? node.$aliasOf : refString(rawValue)
    const type =
      (readKeyed(node, TYPE_KEYS) as string | undefined) ?? inheritedType
    out.push({ path, value: rawValue, type: typeof type === 'string' ? type : undefined, ref: alias })
    return
  }

  const groupType = readKeyed(node, TYPE_KEYS)
  const nextType = typeof groupType === 'string' ? groupType : inheritedType

  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$') || key === 'type') continue
    walk(child, [...path, key], nextType, out)
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** True for an object that is already `{ colors: {...}, spacing: {...} }`-shaped. */
function looksGrouped(raw: Record<string, unknown>): boolean {
  const keys = Object.keys(raw)
  return (
    keys.length > 0 &&
    keys.every((k) => (GROUPS as string[]).includes(k)) &&
    Object.values(raw).every(
      (v) => isObject(v) && Object.values(v).every((x) => typeof x === 'string'),
    )
  )
}

/** Drop one leading path segment when it just names the token's group. */
function stripGroupPrefix(path: string[]): string[] {
  const [first, ...rest] = path
  if (rest.length > 0 && first && GROUP_PREFIX.test(first)) return rest
  return path
}

function tokenName(path: string[]): string {
  return stripGroupPrefix(path)
    .join('-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

/** Layer token dictionaries left-to-right; later parts win per key. Always well-formed. */
export function mergeTokens(...parts: Array<Partial<ManifestTokens> | undefined>): ManifestTokens {
  const acc: ManifestTokens = { colors: {}, spacing: {}, typography: {} }
  for (const part of parts) {
    if (!part) continue
    for (const group of GROUPS) {
      const dict = part[group]
      if (dict && Object.keys(dict).length > 0) acc[group] = { ...(acc[group] ?? {}), ...dict }
    }
  }
  return acc
}

export function parseDesignTokens(raw: unknown): Partial<ManifestTokens> {
  if (!isObject(raw)) return {}

  // Shape 1 — already grouped.
  if (looksGrouped(raw)) {
    const out: Partial<ManifestTokens> = {}
    for (const g of GROUPS) {
      const dict = raw[g]
      if (isObject(dict) && Object.keys(dict).length > 0) {
        out[g] = Object.fromEntries(
          Object.entries(dict).map(([k, v]) => [k, String(v)]),
        )
      }
    }
    return out
  }

  // Shape 2/3 — DTCG / Style Dictionary tree, or a flat primitive map.
  const collected: RawToken[] = []
  const flatEntries = Object.entries(raw).filter(
    ([, v]) => typeof v === 'string' || typeof v === 'number',
  )
  if (flatEntries.length === Object.keys(raw).length && flatEntries.length > 0) {
    for (const [key, value] of flatEntries) {
      collected.push({ path: key.split(/[./]/).flatMap((s) => s.split('-')), value })
    }
  } else {
    walk(raw, [], undefined, collected)
  }

  // Reference resolution — index by dotted path, then resolve up to a few hops.
  const byPath = new Map<string, RawToken>()
  for (const t of collected) byPath.set(t.path.join('.'), t)
  for (let pass = 0; pass < 5; pass++) {
    let changed = false
    for (const t of collected) {
      if (!t.ref) continue
      const target = byPath.get(t.ref) ?? byPath.get(t.ref.replace(/\//g, '.'))
      if (target && target.value !== undefined) {
        t.value = target.value
        t.type = t.type ?? target.type
        t.ref = target.ref
        changed = true
      } else {
        t.ref = undefined
      }
    }
    if (!changed) break
  }

  const result: Partial<ManifestTokens> = {}
  for (const t of collected) {
    if (t.value === undefined || t.value === null) continue
    let group = groupFromType(t.type) ?? groupFromName(t.path)
    const css = valueToCss(t.value, group)
    if (css === null) continue
    group = group ?? groupFromValue(css) ?? 'spacing'
    const name = tokenName(t.path)
    if (!name) continue
    ;(result[group] ??= {})[name] = css
  }
  return result
}
