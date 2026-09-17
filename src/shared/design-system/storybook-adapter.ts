/**
 * Storybook ingestion — the Adapter pattern.
 *
 * External design systems are imported by feeding us Storybook's `react-docgen`
 * JSON extraction. `parseStorybookDocgen` normalises that AST into our strict
 * `DesignSystemManifest`: it drops individual story metadata and keeps only the
 * component definitions and their prop schemas (`argTypes` / docgen `props`).
 *
 * The `options` array is the important capture — that's where variant enums like
 * `['primary', 'secondary']` live, and they flow straight through to the Inspector
 * `<Select>` controls and the dynamically-compiled Zod validator.
 *
 * Storybook/react-docgen JSON has drifted across versions; this adapter targets
 * the two common shapes (a react-docgen `props` map, and a Storybook `argTypes`
 * map) and is deliberately best-effort. `storybook-adapter.test.ts` pins the
 * contract we support.
 *
 * Framework-free — usable from the Electron main process.
 */

import {
  TOKEN_TIER_RULE,
  inferTokenTiers,
  type DesignSystemManifest,
  type ManifestComponent,
  type ManifestProp,
  type ManifestTokens,
} from './manifest'
import { mergeTokenTiers, mergeTokens, parseDesignTokenTiers, parseDesignTokens } from './token-adapter'

export interface StorybookAdapterMeta {
  id?: string
  name?: string
  version?: string
  /** Optional token dictionary to attach (docgen JSON never carries tokens). */
  tokens?: Partial<ManifestTokens>
}

// ---------------------------------------------------------------------------

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

function slug(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120) || 'imported'
  )
}

/** The token exports carried in the same JSON as the component docgen. */
function tokenExports(rawJson: unknown): Record<string, unknown>[] {
  if (!isObject(rawJson)) return []
  const candidates: unknown[] = [
    rawJson.tokens,
    rawJson.$tokens,
    rawJson.designTokens,
    isObject(rawJson.parameters) ? rawJson.parameters.designToken : undefined,
    isObject(rawJson.parameters) ? rawJson.parameters.designTokens : undefined,
  ]
  return candidates.filter(isObject)
}

/** Strip the surrounding quotes react-docgen puts around string-literal values. */
function unquote(value: unknown): string {
  if (typeof value !== 'string') return String(value)
  const m = value.match(/^['"](.*)['"]$/)
  return m ? m[1] : value
}

function normalizeTypeName(name: unknown): string {
  switch (name) {
    case 'bool':
    case 'boolean':
      return 'boolean'
    case 'number':
      return 'number'
    case 'enum':
    case 'union':
      return 'enum'
    case 'string':
      return 'string'
    default:
      return typeof name === 'string' && name ? name : 'string'
  }
}

/** Pull enum options out of a react-docgen `type` node, if it is one. */
function optionsFromDocgenType(type: unknown): string[] | undefined {
  if (!isObject(type)) return undefined
  const value = type.value
  if (!Array.isArray(value)) return undefined
  const opts = value
    .map((entry) => {
      if (isObject(entry) && 'value' in entry) return unquote(entry.value)
      return unquote(entry)
    })
    .filter((s): s is string => typeof s === 'string' && s.length > 0 && s !== 'undefined' && s !== 'null')
  return opts.length > 0 ? opts : undefined
}

function coerceOptions(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const opts = raw.map(unquote).filter((s) => typeof s === 'string' && s.length > 0)
  return opts.length > 0 ? opts : undefined
}

/** Guess which token scale a prop draws from, by its name. Undefined = not token-typed. */
function inferTokenGroup(name: string): keyof ManifestTokens | undefined {
  const n = name.toLowerCase()
  if (/radius|rounded|corner/.test(n)) return 'radius'
  if (/shadow|elevation/.test(n)) return 'shadow'
  if (/colou?r|background|\bbg\b|foreground|\bfg\b|fill|stroke|tint|accent/.test(n)) return 'colors'
  if (/padding|margin|\bgap\b|spacing|\bspace\b|inset/.test(n)) return 'spacing'
  if (/font(size|family|weight)?|leading|line-?height|letter-?spacing/.test(n)) return 'typography'
  return undefined
}

// ---------------------------------------------------------------------------
// Prop extraction — handles both `props` (react-docgen) and `argTypes` (Storybook)
// ---------------------------------------------------------------------------

function parseProp(name: string, raw: unknown): ManifestProp | null {
  if (!isObject(raw)) return null

  const options =
    coerceOptions(raw.options) ??
    optionsFromDocgenType(raw.type) ??
    optionsFromDocgenType(isObject(raw.tsType) ? raw.tsType : undefined)

  const typeNode = isObject(raw.type) ? raw.type : isObject(raw.tsType) ? raw.tsType : undefined
  const typeName = options ? 'enum' : normalizeTypeName(typeNode?.name)

  const requiredFromType = isObject(typeNode) && typeNode.required === true
  const required = raw.required === true || requiredFromType

  // defaultValue: react-docgen `{ value }`, or Storybook `table.defaultValue.summary`
  let defaultValue: unknown
  if (isObject(raw.defaultValue) && 'value' in raw.defaultValue) {
    defaultValue = unquote(raw.defaultValue.value)
  } else if (
    isObject(raw.table) &&
    isObject(raw.table.defaultValue) &&
    'summary' in raw.table.defaultValue
  ) {
    defaultValue = unquote(raw.table.defaultValue.summary)
  }
  if (typeName === 'boolean' && typeof defaultValue === 'string') {
    defaultValue = defaultValue === 'true'
  }
  if (typeName === 'number' && typeof defaultValue === 'string' && defaultValue.trim() !== '') {
    const n = Number(defaultValue)
    defaultValue = Number.isNaN(n) ? undefined : n
  }

  const description =
    typeof raw.description === 'string'
      ? raw.description
      : isObject(raw.table) && typeof raw.table.description === 'string'
        ? raw.table.description
        : undefined

  const tokenGroup = typeName === 'boolean' || typeName === 'number' ? undefined : inferTokenGroup(name)

  const prop: ManifestProp = {
    name,
    type: { name: typeName, ...(typeof typeNode?.raw === 'string' ? { raw: typeNode.raw } : {}) },
    required,
    ...(defaultValue !== undefined ? { defaultValue } : {}),
    ...(options ? { options } : {}),
    ...(description ? { description } : {}),
    ...(tokenGroup ? { tokenGroup } : {}),
  }
  return prop
}

function propsFromComponent(raw: Record<string, unknown>): Record<string, ManifestProp> {
  const source =
    (isObject(raw.props) && raw.props) ||
    (isObject(raw.argTypes) && raw.argTypes) ||
    (isObject(raw.__docgenInfo) && isObject(raw.__docgenInfo.props) && raw.__docgenInfo.props) ||
    {}

  const out: Record<string, ManifestProp> = {}
  for (const [name, value] of Object.entries(source)) {
    if (name.startsWith('__')) continue
    const parsed = parseProp(name, value)
    if (parsed) out[name] = parsed
  }
  return out
}

// ---------------------------------------------------------------------------
// Component discovery
// ---------------------------------------------------------------------------

/** Does this entry look like a component definition rather than story metadata? */
function looksLikeComponent(raw: unknown): raw is Record<string, unknown> {
  if (!isObject(raw)) return false
  if ('props' in raw || 'argTypes' in raw || '__docgenInfo' in raw) return true
  // Story metadata typically has these and no prop schema.
  if ('parameters' in raw || 'stories' in raw || 'storyFn' in raw) return false
  return false
}

function componentName(key: string, raw: Record<string, unknown>): string {
  if (typeof raw.displayName === 'string' && raw.displayName) return raw.displayName
  if (typeof raw.name === 'string' && raw.name) return raw.name
  if (typeof raw.title === 'string' && raw.title) return raw.title.split('/').pop() || raw.title
  // Storybook story ids look like "components-button--primary"
  const base = key.split('--')[0].split('/').pop() ?? key
  return base
}

function childKeys(raw: Record<string, unknown>): boolean {
  const props = raw.props ?? raw.argTypes
  if (isObject(props) && ('children' in props || 'child' in props)) return true
  return false
}

function collectComponents(rawJson: unknown): Record<string, ManifestComponent> {
  // Accept: top-level array, `{ components: [...] | {...} }`, or a flat docgen map.
  let entries: [string, unknown][] = []

  if (Array.isArray(rawJson)) {
    entries = rawJson.map((v, i) => [String((isObject(v) && (v.displayName ?? v.name)) || i), v])
  } else if (isObject(rawJson) && (Array.isArray(rawJson.components) || isObject(rawJson.components))) {
    const comps = rawJson.components
    entries = Array.isArray(comps)
      ? comps.map((v, i) => [String((isObject(v) && (v.displayName ?? v.name)) || i), v])
      : Object.entries(comps as Record<string, unknown>)
  } else if (isObject(rawJson)) {
    entries = Object.entries(rawJson)
  }

  const out: Record<string, ManifestComponent> = {}
  const seen = new Set<string>()

  for (const [key, raw] of entries) {
    if (!looksLikeComponent(raw)) continue
    const name = componentName(key, raw)
    const id = name.replace(/[^A-Za-z0-9_]/g, '') || slug(key)
    if (seen.has(id)) continue
    seen.add(id)

    out[id] = {
      id,
      name,
      description: typeof raw.description === 'string' ? raw.description : '',
      acceptsChildren: childKeys(raw),
      props: propsFromComponent(raw),
    }
  }

  return out
}

// ---------------------------------------------------------------------------

export function parseStorybookDocgen(
  rawJson: unknown,
  meta: StorybookAdapterMeta = {},
): DesignSystemManifest {
  const components = collectComponents(rawJson)
  if (Object.keys(components).length === 0) {
    throw new Error(
      'No component definitions found in the Storybook JSON (expected react-docgen `props` or Storybook `argTypes`).',
    )
  }

  const nameFromJson =
    isObject(rawJson) && typeof rawJson.name === 'string' ? rawJson.name : undefined
  const versionFromJson =
    isObject(rawJson) && typeof rawJson.version === 'string' ? rawJson.version : undefined

  const name = meta.name ?? nameFromJson ?? 'Imported design system'
  const exports = tokenExports(rawJson)
  const tokens = mergeTokens(...exports.map((c) => parseDesignTokens(c)), meta.tokens)
  // The token tier rule travels with the tokens when the export has a semantic tier.
  const tiers = mergeTokenTiers(
    ...exports.map((c) => parseDesignTokenTiers(c)),
    meta.tokens ? inferTokenTiers(mergeTokens(meta.tokens)) : undefined,
  )
  return {
    id: meta.id ?? slug(name),
    name,
    version: meta.version ?? versionFromJson ?? '0.0.0',
    tokens,
    components,
    ...(Object.keys(tiers).length > 0 ? { tokenTiers: { rule: TOKEN_TIER_RULE, tiers } } : {}),
  }
}
