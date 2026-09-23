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
import {
  mergeTokenTiers,
  mergeTokens,
  parseDesignTokenTiers,
  parseDesignTokensWithReport,
  type TokenWarning,
} from './token-adapter'
import { isComponentsManifest, literalOptions, readDocgenProp } from './storybook-components-manifest'

export interface StorybookAdapterMeta {
  id?: string
  name?: string
  version?: string
  /** Optional token dictionary to attach (docgen JSON never carries tokens). */
  tokens?: Partial<ManifestTokens>
}

/** Something the import accepted with a loss the author should know about. */
export interface StorybookImportWarning {
  /** The component — or `tokens`, with the token's path as `prop`. */
  component: string
  prop?: string
  message: string
}

export interface StorybookImportReport {
  manifest: DesignSystemManifest
  warnings: StorybookImportWarning[]
}

type Warn = (message: string, prop?: string) => void

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
    // A union with no literal options to capture — nothing to build an enum from.
    case 'enum':
    case 'union':
      return 'string'
    case 'string':
      return 'string'
    default:
      return typeof name === 'string' && name ? name : 'string'
  }
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

function parseProp(name: string, raw: unknown, warn: Warn): ManifestProp | null {
  if (!isObject(raw)) return null

  const docgen = readDocgenProp(raw)
  if (docgen?.inherited) {
    warn('inherited from a node_modules type (a DOM attribute) — dropped', name)
    return null
  }

  const options =
    coerceOptions(raw.options) ?? literalOptions(raw.type) ?? literalOptions(raw.tsType) ?? undefined

  const typeNode = isObject(raw.type) ? raw.type : isObject(raw.tsType) ? raw.tsType : undefined
  const typeName = options ? 'enum' : normalizeTypeName(typeNode?.name)
  if (!options && typeNode && docgen?.kind === 'unresolved') {
    const written = typeof typeNode.raw === 'string' ? typeNode.raw : String(typeNode.name)
    warn(`type \`${written}\` has no literal values to check — accepted as free text`, name)
  }

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

function propsFromComponent(raw: Record<string, unknown>, warn: Warn): Record<string, ManifestProp> {
  const source =
    (isObject(raw.props) && raw.props) ||
    (isObject(raw.argTypes) && raw.argTypes) ||
    (isObject(raw.__docgenInfo) && isObject(raw.__docgenInfo.props) && raw.__docgenInfo.props) ||
    {}

  const out: Record<string, ManifestProp> = {}
  for (const [name, value] of Object.entries(source)) {
    if (name.startsWith('__')) continue
    const parsed = parseProp(name, value, warn)
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

/**
 * Storybook 10's `manifests/components.json` → the docgen-map entries the rest of
 * the adapter reads: one per component, and one per subcomponent its story meta
 * declares. Entries Storybook could not document become warnings.
 */
function componentsManifestEntries(
  rawJson: { components: Record<string, Record<string, unknown>> },
  warnings: StorybookImportWarning[],
): [string, unknown][] {
  const out: [string, unknown][] = []
  const add = (name: string, entry: Record<string, unknown>) => {
    const docgen = entry.reactDocgen
    if (!isObject(docgen)) {
      const why = isObject(entry.error) ? String(entry.error.message ?? entry.error.name) : 'no react-docgen output'
      warnings.push({ component: name, message: `skipped — ${why}` })
      return
    }
    const description =
      (typeof docgen.description === 'string' && docgen.description) ||
      (typeof entry.description === 'string' ? entry.description : '')
    out.push([name, { displayName: name, description, props: isObject(docgen.props) ? docgen.props : {} }])
  }
  for (const [key, entry] of Object.entries(rawJson.components)) {
    if (!isObject(entry)) continue
    add(typeof entry.name === 'string' && entry.name ? entry.name : key, entry)
    if (isObject(entry.subcomponents)) {
      for (const [subKey, sub] of Object.entries(entry.subcomponents)) {
        if (isObject(sub)) add(typeof sub.name === 'string' && sub.name ? sub.name : subKey, sub)
      }
    }
  }
  return out
}

function collectComponents(
  rawJson: unknown,
  warnings: StorybookImportWarning[],
): Record<string, ManifestComponent> {
  // Accept: Storybook's components manifest, a top-level array,
  // `{ components: [...] | {...} }`, or a flat docgen map.
  let entries: [string, unknown][] = []

  if (isComponentsManifest(rawJson)) {
    entries = componentsManifestEntries(rawJson, warnings)
  } else if (Array.isArray(rawJson)) {
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
    if (seen.has(id)) {
      warnings.push({ component: name, message: `a second component named "${id}" — kept the first` })
      continue
    }
    seen.add(id)

    const warn: Warn = (message, prop) => warnings.push({ component: id, ...(prop ? { prop } : {}), message })
    const props = propsFromComponent(raw, warn)
    if (Object.keys(props).length === 0) warn('documents no props — a Blueprint can only place it as is')

    out[id] = {
      id,
      name,
      description: typeof raw.description === 'string' ? raw.description : '',
      acceptsChildren: childKeys(raw),
      props,
    }
  }

  return out
}

// ---------------------------------------------------------------------------

/** `parseStorybookDocgen`, plus everything the import accepted with a loss. */
export function parseStorybookDocgenWithReport(
  rawJson: unknown,
  meta: StorybookAdapterMeta = {},
): StorybookImportReport {
  const warnings: StorybookImportWarning[] = []
  const components = collectComponents(rawJson, warnings)
  if (Object.keys(components).length === 0) {
    const docsOnly = isObject(rawJson) && !('components' in rawJson) && ('docs' in rawJson || 'entries' in rawJson)
    throw new Error(
      docsOnly
        ? 'This looks like a Storybook docs or index file, which carries no component docgen. Import manifests/components.json instead.'
        : 'No component definitions found in the Storybook JSON (expected manifests/components.json, react-docgen `props` or Storybook `argTypes`).',
    )
  }

  const nameFromJson =
    isObject(rawJson) && typeof rawJson.name === 'string' ? rawJson.name : undefined
  const versionFromJson =
    isObject(rawJson) && typeof rawJson.version === 'string' ? rawJson.version : undefined

  const name = meta.name ?? nameFromJson ?? 'Imported design system'
  const exports = tokenExports(rawJson)
  const parsedTokens = exports.map((c) => parseDesignTokensWithReport(c))
  warnings.push(...parsedTokens.flatMap((p) => p.warnings.map(tokenImportWarning)))
  const tokens = mergeTokens(...parsedTokens.map((p) => p.tokens), meta.tokens)
  // The token tier rule travels with the tokens when the export has a semantic tier.
  const tiers = mergeTokenTiers(
    ...exports.map((c) => parseDesignTokenTiers(c)),
    meta.tokens ? inferTokenTiers(mergeTokens(meta.tokens)) : undefined,
  )
  const manifest: DesignSystemManifest = {
    id: meta.id ?? slug(name),
    name,
    version: meta.version ?? versionFromJson ?? '0.0.0',
    tokens,
    components,
    ...(Object.keys(tiers).length > 0 ? { tokenTiers: { rule: TOKEN_TIER_RULE, tiers } } : {}),
  }
  return { manifest, warnings }
}

/** A token the parse left out, in the importer's warning shape. */
export function tokenImportWarning(w: TokenWarning): StorybookImportWarning {
  return { component: 'tokens', prop: w.token, message: w.message }
}

export function parseStorybookDocgen(
  rawJson: unknown,
  meta: StorybookAdapterMeta = {},
): DesignSystemManifest {
  return parseStorybookDocgenWithReport(rawJson, meta).manifest
}
