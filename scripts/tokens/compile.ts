/**
 * DTCG → CSS compiler for `tokens/tokens.json`, the Design ↔ Engineering contract.
 *
 * Pure: parsed JSON in, file contents out. `scripts/build-tokens.ts` does the I/O.
 * Strict on purpose — a broken alias, a malformed value, an unknown `$type` or two
 * tokens that flatten to the same CSS name fail the build rather than ship a
 * `var()` that resolves to nothing.
 *
 *   - Every token becomes one custom property on `:root`, named by its path
 *     (`typography.fontFamily.primary` → `--typography-font-family-primary`).
 *   - `{dot.path}` aliases stay live as `var(--dot-path)`, so a core change
 *     flows through every semantic token that points at it.
 *   - `typography` composites become `.text-*` utility classes instead.
 */

import { frameSpec } from '../../src/design-system/primitives'
import { isSpringSpec, springToCss } from '../../src/shared/design-system/spring'

/** Paths are relative to the project root. */
export const TOKENS_SOURCE = 'tokens/tokens.json'
export const TOKEN_OUTPUTS = {
  css: 'src/styles/global.css',
  ts: 'src/styles/global-tokens.ts',
  names: 'src/primitives/token-names.ts',
} as const

export interface CompiledTokens {
  css: string
  ts: string
  names: string
}

/**
 * The name families the primitives take as props, each the part of a custom
 * property after its prefix. Written out as literal unions in
 * `src/primitives/token-names.ts`, because react-docgen — and so Storybook's
 * components manifest — can't read a type derived from `CssVar`.
 * `src/primitives/tokens.ts` proves each one equals its derived twin.
 */
export const NAME_FAMILIES: ReadonlyArray<{ type: string; prefix: string; doc: string }> = [
  { type: 'SpacingStep', prefix: '--dimension-spacing-core-', doc: 'A step of the spacing scale.' },
  { type: 'RadiusStep', prefix: '--dimension-radius-core-', doc: 'A step of the radius scale.' },
  { type: 'SurfaceColor', prefix: '--color-semantic-functional-background-', doc: 'A functional background role.' },
  { type: 'BorderColor', prefix: '--color-semantic-functional-border-', doc: 'A functional border role.' },
  { type: 'StatusColor', prefix: '--color-semantic-functional-status-', doc: 'A status colour.' },
  { type: 'TextRole', prefix: '--color-semantic-functional-text-', doc: 'A functional text role.' },
  { type: 'OpacityRole', prefix: '--opacity-semantic-', doc: 'A semantic opacity role.' },
]

type Json = Record<string, unknown>

interface Token {
  path: string[]
  type: string
  value: unknown
  description?: string
  extensions?: Json
}

/** Vendor key for platform hints DTCG has no field for (e.g. a gradient's angle). */
export const CSS_EXTENSION = 'com.screenflow.css'

const SUPPORTED_TYPES = new Set([
  'color',
  'dimension',
  'duration',
  'cubicBezier',
  'spring',
  'number',
  'fontWeight',
  'fontFamily',
  'gradient',
  'typography',
])

const DEFAULT_GRADIENT_ANGLE = '180deg'

/**
 * The token names the typeface; CSS needs a resolution chain. `'<Family> Variable'`
 * is the self-hosted @fontsource-variable copy, `'<Family>'` a locally-installed
 * one, and the tail keeps an unresolved family off the browser default — SERIF.
 */
const FONT_FALLBACK = [
  '-apple-system',
  'BlinkMacSystemFont',
  "'Segoe UI'",
  'Roboto',
  "'Helvetica Neue'",
  'Arial',
  'sans-serif',
]

const ALIAS = /^\{([^{}]+)\}$/
const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const DIMENSION = /^-?(?:\d+|\d*\.\d+)(?:px|rem|em|%)$/
const ANGLE = /^-?(?:\d+|\d*\.\d+)deg$/
const DURATION = /^(?:\d+|\d*\.\d+)(?:ms|s)$/

const TYPOGRAPHY_PROPERTIES = ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight']

function isObject(v: unknown): v is Json {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** `fontFamily` → `font-family`; kebab segments pass through. */
function kebab(segment: string): string {
  return segment.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

export function cssVarName(path: string[]): string {
  return `--${path.map(kebab).join('-')}`
}

/** `typography.body-sm.bold` → `text-body-sm-bold`. */
export function textClassName(path: string[]): string {
  return `text-${path.slice(1).map(kebab).join('-')}`
}

function where(path: string[]): string {
  return path.join('.')
}

/** Every token in document order, with `$type` inherited from the nearest group. */
export function collectTokens(root: Json): Token[] {
  const tokens: Token[] = []
  const visit = (node: Json, path: string[], inheritedType: string | undefined): void => {
    const type = typeof node.$type === 'string' ? node.$type : inheritedType
    if ('$value' in node) {
      if (!type) throw new Error(`${where(path)}: no $type (set it on the token or a parent group)`)
      if (!SUPPORTED_TYPES.has(type)) throw new Error(`${where(path)}: unsupported $type "${type}"`)
      tokens.push({
        path,
        type,
        value: node.$value,
        description: typeof node.$description === 'string' ? node.$description : undefined,
        extensions: isObject(node.$extensions) ? node.$extensions : undefined,
      })
      return
    }
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$')) continue
      if (!isObject(child)) throw new Error(`${where([...path, key])}: expected a token or a group`)
      visit(child, [...path, key], type)
    }
  }
  visit(root, [], undefined)
  return tokens
}

export function compileTokens(root: unknown): CompiledTokens {
  if (!isObject(root)) throw new Error('tokens.json must be a JSON object')
  const tokens = collectTokens(root)
  const byPath = new Map(tokens.map((t) => [where(t.path), t]))

  /** A `{dot.path}` alias as `var()`, or null when `raw` is a literal. */
  const aliasVar = (raw: unknown, from: string[], expected: string[]): string | null => {
    if (typeof raw !== 'string') return null
    const match = ALIAS.exec(raw)
    if (!match) return null
    const target = byPath.get(match[1])
    if (!target) throw new Error(`${where(from)}: alias ${raw} points at no token`)
    if (!expected.includes(target.type)) {
      throw new Error(`${where(from)}: alias ${raw} is a ${target.type}, expected ${expected.join(' or ')}`)
    }
    return `var(${cssVarName(target.path)})`
  }

  const literal = (type: string, raw: unknown, path: string[]): string => {
    const fail = (what: string): never => {
      throw new Error(`${where(path)}: ${what}, got ${JSON.stringify(raw)}`)
    }
    switch (type) {
      case 'color':
        return typeof raw === 'string' && HEX_COLOR.test(raw) ? raw : fail('expected a hex color')
      case 'dimension':
        return typeof raw === 'string' && DIMENSION.test(raw) ? raw : fail('expected a dimension like "16px"')
      case 'duration':
        return typeof raw === 'string' && DURATION.test(raw) ? raw : fail('expected a duration like "1500ms"')
      case 'spring':
        return isSpringSpec(raw)
          ? springToCss(raw)
          : fail('expected { duration: "800ms", stiffness, damping, mass? } with positive numbers')
      case 'cubicBezier': {
        const ok =
          Array.isArray(raw) && raw.length === 4 && raw.every((n) => typeof n === 'number' && Number.isFinite(n))
        if (!ok) return fail('expected four numbers [x1, y1, x2, y2]')
        return `cubic-bezier(${(raw as number[]).join(', ')})`
      }
      case 'number':
      case 'fontWeight':
        return typeof raw === 'number' && Number.isFinite(raw) ? String(raw) : fail('expected a number')
      case 'fontFamily': {
        const families = Array.isArray(raw) ? raw : [raw]
        if (families.length === 0 || !families.every((f) => typeof f === 'string' && f.length > 0)) {
          return fail('expected a family name or a list of them')
        }
        const [primary, ...rest] = families as string[]
        return [`'${primary} Variable'`, `'${primary}'`, ...rest.map((f) => `'${f}'`), ...FONT_FALLBACK].join(', ')
      }
      case 'gradient': {
        if (!Array.isArray(raw) || raw.length < 2) return fail('expected at least two gradient stops')
        const hint = token(path).extensions?.[CSS_EXTENSION]
        const angle = isObject(hint) && hint.angle !== undefined ? hint.angle : DEFAULT_GRADIENT_ANGLE
        if (typeof angle !== 'string' || !ANGLE.test(angle)) return fail(`expected ${CSS_EXTENSION}.angle like "135deg"`)
        const stops = raw.map((stop) => {
          if (!isObject(stop) || typeof stop.position !== 'number' || stop.position < 0 || stop.position > 1) {
            return fail('expected stops shaped { color, position: 0..1 }')
          }
          const color = aliasVar(stop.color, path, ['color']) ?? literal('color', stop.color, path)
          return `${color} ${Number((stop.position * 100).toFixed(2))}%`
        })
        return `linear-gradient(${angle}, ${stops.join(', ')})`
      }
      default:
        return fail(`$type ${type} has no single CSS value`)
    }
  }

  const token = (path: string[]): Token => byPath.get(where(path))!

  const vars: Array<{ token: Token; name: string; value: string }> = []
  const classes: Array<{ token: Token; name: string; declarations: string[] }> = []
  const seen = new Map<string, string>()
  const claim = (name: string, path: string[]): void => {
    const owner = seen.get(name)
    if (owner) throw new Error(`${where(path)}: compiles to ${name}, already used by ${owner}`)
    seen.set(name, where(path))
  }

  for (const t of tokens) {
    if (t.type === 'typography') {
      if (!isObject(t.value)) throw new Error(`${where(t.path)}: expected a typography object`)
      const name = textClassName(t.path)
      claim(`.${name}`, t.path)
      const declarations = TYPOGRAPHY_PROPERTIES.flatMap((prop) => {
        if (!(prop in (t.value as Json))) return []
        const raw = (t.value as Json)[prop]
        const type = prop === 'fontFamily' ? 'fontFamily' : prop === 'fontWeight' ? 'fontWeight' : prop === 'lineHeight' ? 'number' : 'dimension'
        const value = aliasVar(raw, t.path, [type]) ?? literal(type, raw, t.path)
        return [`${kebab(prop)}: ${value};`]
      })
      const unknown = Object.keys(t.value).filter((k) => !TYPOGRAPHY_PROPERTIES.includes(k))
      if (unknown.length) throw new Error(`${where(t.path)}: unsupported typography keys ${unknown.join(', ')}`)
      classes.push({ token: t, name, declarations })
      continue
    }
    const name = cssVarName(t.path)
    claim(name, t.path)
    vars.push({ token: t, name, value: aliasVar(t.value, t.path, [t.type]) ?? literal(t.type, t.value, t.path) })
  }

  return {
    css: renderCss(vars, classes),
    ts: renderTs(vars.map((v) => v.name), classes.map((c) => c.name)),
    names: renderNames(vars),
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const GENERATED_BY = 'GENERATED by `npm run tokens:build` from tokens/tokens.json — do not edit.'

function comment(text: string): string {
  return `/* ${text.replace(/\*\//g, '* /')} */`
}

function humanize(segment: string): string {
  return kebab(segment)
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** Section header for a token: its group path, at most three levels deep. */
function sectionOf(path: string[]): string {
  return path.slice(0, -1).slice(0, 3).map(humanize).join(' · ')
}

function renderCss(
  vars: Array<{ token: Token; name: string; value: string }>,
  classes: Array<{ token: Token; name: string; declarations: string[] }>,
): string {
  const lines = [
    '/*',
    ` * ${GENERATED_BY}`,
    ' * Change tokens.json and run the build instead; `npm test` fails while this is stale.',
    ' */',
    '',
    ':root {',
  ]
  let section = ''
  for (const { token, name, value } of vars) {
    const next = sectionOf(token.path)
    if (next !== section) {
      if (section) lines.push('')
      lines.push(`  ${comment(`===== ${next} =====`)}`)
      section = next
    }
    if (token.description) lines.push(`  ${comment(token.description)}`)
    lines.push(`  ${name}: ${value};`)
  }
  lines.push('}')

  if (classes.length) {
    lines.push('', comment('===== Typography · Utility Classes ====='))
    for (const { token, name, declarations } of classes) {
      lines.push('')
      if (token.description) lines.push(comment(token.description))
      lines.push(`.${name} {`, ...declarations.map((d) => `  ${d}`), '}')
    }
  }
  return lines.join('\n') + '\n'
}

function renderTs(varNames: string[], classNames: string[]): string {
  const list = (items: string[]): string => items.map((item) => `  '${item}',`).join('\n')
  return `// ${GENERATED_BY}

/** Every custom property \`global.css\` defines on \`:root\`. */
export const CSS_VARS = [
${list(varNames)}
] as const

export type CssVar = (typeof CSS_VARS)[number]

/** Every \`.text-*\` utility class \`global.css\` defines, without the \`text-\` prefix. */
export type TextStyle =
${union(classNames.map((name) => name.replace(/^text-/, '')))}

export const TEXT_STYLES = [
${list(classNames.map((name) => name.replace(/^text-/, '')))}
] as const satisfies readonly TextStyle[]
`
}

/** A literal union, one member per line. */
function union(items: string[]): string {
  return items.map((item) => `  | '${item}'`).join('\n')
}

/** On the layout grid: a multiple of it, or one of the allowed exceptions (frameSpec). */
function onGrid(px: number): boolean {
  return px % frameSpec.grid === 0 || (frameSpec.offGridAllowed as readonly number[]).includes(px)
}

function renderNames(vars: ReadonlyArray<{ name: string; value: string }>): string {
  const after = (prefix: string) => vars.filter((v) => v.name.startsWith(prefix)).map((v) => ({ ...v, rest: v.name.slice(prefix.length) }))
  const block = (type: string, doc: string, names: string[]) => `/** ${doc} */\nexport type ${type} =\n${union(names)}\n`
  const blocks = NAME_FAMILIES.map((f) => block(f.type, f.doc, after(f.prefix).map((v) => v.rest)))
  const spacing = after('--dimension-spacing-core-')
  const grid = spacing.filter((v) => onGrid(parseFloat(v.value))).map((v) => v.rest)
  const text = after('--color-semantic-functional-text-').map((v) => v.rest)
  const status = after('--color-semantic-functional-status-').map((v) => `status-${v.rest}`)
  blocks.push(block('GridSpacing', 'A spacing step on the layout grid (frameSpec: multiples of 8, plus 4 and 12).', grid))
  blocks.push(block('TextColor', 'A text role, or a status colour as `status-<name>`.', [...text, ...status]))
  return `// ${GENERATED_BY}\n//\n// The prop names primitives take, written out so Storybook's docgen can read them.\n\n${blocks.join('\n')}`
}
