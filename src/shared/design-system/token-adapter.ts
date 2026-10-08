/**
 * Design-token ingestion — the Adapter pattern, token half.
 *
 * `parseDesignTokens` normalises a design-token export into our `ManifestTokens`
 * shape (flat `Record<name, cssValue>` per semantic group). It targets:
 *
 *   - W3C Design Tokens (DTCG):        { color: { brand: { $value, $type } } }
 *
 * `$type` is inherited from the nearest ancestor group; `{dot.path}` / `$aliasOf`
 * references are resolved. Every token is categorised into colors / spacing /
 * typography / radius / shadow by its type first, then by name/path heuristics,
 * then by what its value looks like.
 *
 * Framework-free — usable from the Electron main process.
 */

import type { ManifestTokens, TokenTier, TokenTierMap } from './manifest'
import { rawTierFor } from './manifest'
import { hexWithAlpha, isAlpha } from './color-alpha'
import { isSpringSpec, springToCss } from './spring'

export type TokenGroup = keyof ManifestTokens

const GROUPS: TokenGroup[] = ['colors', 'spacing', 'typography', 'radius', 'shadow', 'gradients', 'motion']

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

// ---------------------------------------------------------------------------
// Group detection
// ---------------------------------------------------------------------------

/** A leading path segment matching this just names the token's group — we drop it. */
const GROUP_PREFIX =
  /^(colou?rs?|palette|spac(e|ing)|sizes?|sizing|dimensions?|gaps?|typ(o|ography)?|fonts?|text|radi(us|i)|corners?|rounded|border-?radius|shadows?|elevations?|box-?shadow|gradients?|motion)$/i

function groupFromType(type: string | undefined): TokenGroup | null {
  switch ((type ?? '').toLowerCase().replace(/[\s_-]/g, '')) {
    case 'color':
      return 'colors'
    case 'gradient':
      return 'gradients'
    case 'duration':
    case 'cubicbezier':
    case 'spring':
    case 'transition':
      return 'motion'
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
  if (/gradient/.test(p)) return 'gradients'
  if (/\bmotion\b|easing|duration|transition/.test(p)) return 'motion'
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
  if (/^(repeating-)?(linear|radial|conic)-gradient\(/.test(v)) return 'gradients'
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
  if (group === 'motion') {
    if (isSpringSpec(raw)) return springToCss(raw)
    if (Array.isArray(raw) && raw.length === 4 && raw.every((n) => typeof n === 'number')) return `cubic-bezier(${raw.join(', ')})`
    return null
  }
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
  /** The reference as written, kept for the report once `ref` has been followed. */
  alias?: string
  /** A `{path}` reference that pointed at nothing — the token has no usable value. */
  unresolved?: boolean
  /** Read from the tree: under a `semantic` group, or beside one (`core`, `opacity`…). */
  tier?: 'core' | 'semantic'
  /** A gradient's CSS angle, from `$extensions["com.screenflow.css"].angle` (DTCG carries none). */
  angle?: string
  /** An alpha variant's share of the colour it aliases, from `$extensions["com.screenflow.css"].alpha`. */
  alpha?: number
}

/** The vendor key a DTCG file uses for CSS-only hints. */
const CSS_EXTENSION = 'com.screenflow.css'
/** DTCG gradients carry no angle; CSS draws them top to bottom unless the token says otherwise. */
const DEFAULT_GRADIENT_ANGLE = '180deg'

/**
 * DTCG gradient stops → `linear-gradient(...)`. A stop's colour may be an alias,
 * resolved through `color`; null when any stop is unusable.
 */
function gradientToCss(stops: unknown, angle: string | undefined, color: (v: unknown) => string | null): string | null {
  if (!Array.isArray(stops) || stops.length < 2) return null
  const parts: string[] = []
  for (const stop of stops) {
    if (!isObject(stop) || typeof stop.position !== 'number') return null
    const c = color(stop.color)
    if (!c) return null
    parts.push(`${c} ${Number((stop.position * 100).toFixed(2))}%`)
  }
  return `linear-gradient(${angle ?? DEFAULT_GRADIENT_ANGLE}, ${parts.join(', ')})`
}

/** A group named like this holds the intent tier. */
const SEMANTIC_KEY = /^semantic$/i
/** A group named like this holds raw values, even without a `semantic` sibling. */
const RAW_KEY = /^(core|primitives?|palette|refs?|references?)$/i

function isTokenNode(node: Record<string, unknown>): boolean {
  return '$value' in node || '$aliasOf' in node
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
  inheritedTier: RawToken['tier'],
  out: RawToken[],
): void {
  if (!isObject(node)) return

  if (isTokenNode(node)) {
    const rawValue = node.$value
    const alias = typeof node.$aliasOf === 'string' ? node.$aliasOf : refString(rawValue)
    const type = node.$type ?? inheritedType
    const ext = isObject(node.$extensions) ? node.$extensions[CSS_EXTENSION] : undefined
    const angle = isObject(ext) && typeof ext.angle === 'string' ? ext.angle : undefined
    out.push({
      path,
      value: rawValue,
      type: typeof type === 'string' ? type : undefined,
      ref: alias,
      alias,
      tier: inheritedTier,
      angle,
      alpha: isObject(ext) && isAlpha(ext.alpha) ? ext.alpha : undefined,
    })
    return
  }

  const groupType = node.$type
  const nextType = typeof groupType === 'string' ? groupType : inheritedType
  const children = Object.entries(node).filter(([key]) => !key.startsWith('$'))
  // In a group that has a `semantic` child, every other child is the raw tier.
  const hasSemantic = children.some(([key]) => SEMANTIC_KEY.test(key))

  for (const [key, child] of children) {
    let tier = inheritedTier
    if (!tier) {
      if (SEMANTIC_KEY.test(key)) tier = 'semantic'
      else if (hasSemantic || RAW_KEY.test(key)) tier = 'core'
    }
    walk(child, [...path, key], nextType, tier, out)
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

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

/** A token the import had to leave out, and why. */
export interface TokenWarning {
  token: string
  message: string
}

interface ParsedTokens {
  tokens: Partial<ManifestTokens>
  tiers: TokenTierMap
  warnings: TokenWarning[]
}

function parse(raw: unknown): ParsedTokens {
  if (!isObject(raw)) return { tokens: {}, tiers: {}, warnings: [] }

  const collected: RawToken[] = []
  walk(raw, [], undefined, undefined, collected)

  // Reference resolution — index by dotted path, then resolve up to a few hops.
  const byPath = new Map<string, RawToken>()
  for (const t of collected) byPath.set(t.path.join('.'), t)
  const lookup = (ref: string): RawToken | undefined => byPath.get(ref) ?? byPath.get(ref.replace(/\//g, '.'))

  // Alpha variants first: `{base}` + alpha becomes the literal `#RRGGBBAA` a
  // manifest needs (global.css keeps the same pair live as a color-mix), so every
  // alias and gradient stop that points at one reads a finished colour.
  const literalColor = (t: RawToken, depth = 0): string | null => {
    if (depth > 8) return null
    const target = t.ref ? lookup(t.ref) : undefined
    const base = t.ref ? (target ? literalColor(target, depth + 1) : null) : typeof t.value === 'string' ? t.value : null
    if (base === null || t.alpha === undefined) return base
    return hexWithAlpha(base, t.alpha)
  }
  const mixed = collected.filter((t) => t.alpha !== undefined && t.ref).map((t) => [t, literalColor(t)] as const)
  for (const [t, value] of mixed) {
    t.ref = undefined
    if (value === null) t.unresolved = true
    else t.value = value
  }
  for (let pass = 0; pass < 5; pass++) {
    let changed = false
    for (const t of collected) {
      if (!t.ref) continue
      const target = byPath.get(t.ref) ?? byPath.get(t.ref.replace(/\//g, '.'))
      if (target && target.value !== undefined) {
        t.value = target.value
        t.type = t.type ?? target.type
        t.angle = t.angle ?? target.angle
        t.ref = target.ref
        t.unresolved = target.unresolved
        changed = true
      } else {
        t.ref = undefined
        t.unresolved = true
      }
    }
    if (!changed) break
  }

  const result: Partial<ManifestTokens> = {}
  const tiers: Partial<Record<TokenGroup, Record<string, TokenTier>>> = {}
  const warnings: TokenWarning[] = []
  for (const t of collected) {
    const token = t.path.join('.')
    // A reference into a part of the file we didn't read is not a CSS value.
    if (t.unresolved) {
      const exists = t.alias !== undefined && (byPath.has(t.alias) || byPath.has(t.alias.replace(/\//g, '.')))
      const why = exists ? 'leads to a token that does not resolve' : 'points at no token in the file'
      warnings.push({ token, message: `its alias {${t.alias}} ${why} — left out` })
      continue
    }
    if (t.value === undefined || t.value === null) continue
    let group = groupFromType(t.type) ?? groupFromName(t.path)
    const css =
      group === 'gradients' && Array.isArray(t.value)
        ? gradientToCss(t.value, t.angle, (v) => {
            const ref = refString(v)
            const hit = ref ? (byPath.get(ref) ?? byPath.get(ref.replace(/\//g, '.'))) : undefined
            const value = ref ? hit?.value : v
            return typeof value === 'string' && !hit?.unresolved ? value : null
          })
        : valueToCss(t.value, group)
    if (css === null) {
      warnings.push({ token, message: `its value ${JSON.stringify(t.value)} is not a CSS value — left out` })
      continue
    }
    group = group ?? groupFromValue(css) ?? 'spacing'
    const name = tokenName(t.path)
    if (!name) continue
    ;(result[group] ??= {})[name] = css
    if (t.tier) (tiers[group] ??= {})[name] = t.tier === 'core' ? rawTierFor(group) : 'semantic'
  }

  // A group is tiered only when it has a semantic layer to point components at.
  const tiered: TokenTierMap = {}
  for (const group of GROUPS) {
    const map = tiers[group]
    if (map && Object.values(map).includes('semantic')) tiered[group] = map
  }
  return { tokens: result, tiers: tiered, warnings }
}

export function parseDesignTokens(raw: unknown): Partial<ManifestTokens> {
  return parse(raw).tokens
}

/** `parseDesignTokens`, plus every token the parse had to leave out and why. */
export function parseDesignTokensWithReport(raw: unknown): {
  tokens: Partial<ManifestTokens>
  warnings: TokenWarning[]
} {
  const { tokens, warnings } = parse(raw)
  return { tokens, warnings }
}

/**
 * The token-tier tier of every token in an export: `semantic` under a `semantic`
 * group, `core` beside one (or under `core` / `primitives` / `palette`), and
 * `layout` for raw spacing and radius steps. Empty for a group with no semantic layer.
 */
export function parseDesignTokenTiers(raw: unknown): TokenTierMap {
  return parse(raw).tiers
}

/** Combine tier maps left-to-right; later parts win per token. */
export function mergeTokenTiers(...parts: Array<TokenTierMap | undefined>): TokenTierMap {
  const acc: TokenTierMap = {}
  for (const part of parts) {
    if (!part) continue
    for (const group of GROUPS) {
      const map = part[group]
      if (map && Object.keys(map).length > 0) acc[group] = { ...(acc[group] ?? {}), ...map }
    }
  }
  return acc
}
