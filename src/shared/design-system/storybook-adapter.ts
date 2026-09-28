/**
 * Storybook ingestion — the Adapter pattern.
 *
 * External design systems are imported by feeding us Storybook's `react-docgen`
 * JSON extraction. `parseStorybookDocgenWithReport` normalises that AST into our strict
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
  type ManifestScreenTemplate,
  type ManifestTokens,
  type TokenTierMap,
} from './manifest'
import { validateBlueprintAgainstManifest } from './manifest-zod'
import {
  mergeTokenTiers,
  mergeTokens,
  parseDesignTokenTiers,
  parseDesignTokensWithReport,
  type TokenWarning,
} from './token-adapter'
import { isComponentsManifest, literalOptions, readDocgenProp, unquoteLiteral } from './storybook-components-manifest'

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
  const opts = raw.map(unquoteLiteral).filter((s) => typeof s === 'string' && s.length > 0)
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

/** A react-docgen list type whose items are all text: `{}`, or `{ count }` for a tuple. */
function stringList(node: Record<string, unknown>): { count?: number } | undefined {
  const elements = Array.isArray(node.elements) ? node.elements : []
  const allText = elements.length > 0 && elements.every((e) => isObject(e) && e.name === 'string')
  if (node.name === 'Array' && allText) return {}
  if (node.name === 'tuple' && allText) return { count: elements.length }
  if (node.name === 'arrayOf' && isObject(node.value) && node.value.name === 'string') return {}
  return undefined
}

/** `{ title: string; subtitle?: string }[]` → its fields; any non-text field → undefined. */
function objectListFields(node: Record<string, unknown>): Record<string, ManifestProp> | undefined {
  const [item, ...more] = Array.isArray(node.elements) ? node.elements : []
  if (node.name !== 'Array' || more.length > 0 || !isObject(item) || item.name !== 'signature' || item.type !== 'object') return undefined
  const properties = isObject(item.signature) && Array.isArray(item.signature.properties) ? item.signature.properties : []
  const fields: Record<string, ManifestProp> = {}
  for (const p of properties) {
    if (!isObject(p) || typeof p.key !== 'string' || !isObject(p.value) || p.value.name !== 'string') return undefined
    fields[p.key] = { name: p.key, type: { name: 'string' }, required: p.value.required === true }
  }
  return Object.keys(fields).length > 0 ? fields : undefined
}

/** "from `48` to `456` in steps of `8`" / "on the 8pt scale" in a number prop's JSDoc → its min / max / step / grid. */
export function documentedRange(description: string | undefined): { min?: number; max?: number; step?: number; grid?: boolean } {
  if (!description) return {}
  const num = (s: string | undefined): number | undefined => (s !== undefined && Number.isFinite(Number(s)) ? Number(s) : undefined)
  const bounds = description.match(/\bfrom `(-?[\d.]+)` to `(-?[\d.]+)`/)
  const step = num(description.match(/\bsteps? of `([\d.]+)`/)?.[1])
  const min = num(bounds?.[1])
  const max = num(bounds?.[2])
  return {
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
    ...(step !== undefined && step > 0 ? { step } : {}),
    ...(/\bon the 8pt\s+scale\b/.test(description) ? { grid: true } : {}),
  }
}

function parseProp(name: string, raw: unknown, warn: Warn): ManifestProp | null {
  if (!isObject(raw)) return null

  const docgen = readDocgenProp(raw)
  if (docgen?.inherited) {
    warn('inherited from a node_modules type (a DOM attribute) — dropped', name)
    return null
  }
  // A Blueprint is data: it can't carry a callback, and it shouldn't reach for an
  // alias the component has already replaced.
  if (docgen?.kind === 'function') {
    warn('an event handler, which a Blueprint cannot carry — dropped', name)
    return null
  }
  if (docgen?.deprecated) {
    warn('@deprecated in the component — dropped, so screens use what replaced it', name)
    return null
  }

  const options =
    coerceOptions(raw.options) ?? literalOptions(raw.type) ?? literalOptions(raw.tsType) ?? undefined

  const typeNode = isObject(raw.type) ? raw.type : isObject(raw.tsType) ? raw.tsType : undefined
  const written = typeNode ? (typeof typeNode.raw === 'string' ? typeNode.raw : String(typeNode.name)) : ''
  // A list of text (`string[]`, `[string, string]`) or of text-only objects
  // (`{ title: string; subtitle?: string }[]`) is data a Blueprint carries as a
  // JSON array. Any other list, or a lone object, has a shape no Blueprint field
  // can describe — and a string in its place would break the component.
  const listNode = !options && docgen?.kind === 'array' ? typeNode : undefined
  const fields = listNode ? objectListFields(listNode) : undefined
  const list = listNode ? (fields ? {} : stringList(listNode)) : undefined
  if (listNode && !list) {
    warn(`a list of \`${written}\`, which a Blueprint field can't describe — left out`, name)
    return null
  }
  if (!options && docgen?.kind === 'object') {
    warn(`an object (\`${written}\`), which a Blueprint field can't describe — left out`, name)
    return null
  }
  if (!options && typeNode && docgen?.kind === 'unresolved') {
    if (typeNode.name !== 'union' && typeNode.name !== 'enum') {
      warn(`type \`${written}\` is one docgen can't expand, so nothing can check a value for it — left out`, name)
      return null
    }
    // A union with a free-text member is still text.
    warn(`type \`${written}\` has no literal values to check — accepted as free text`, name)
  }
  const typeName = options ? 'enum' : list ? 'array' : normalizeTypeName(typeNode?.name)

  const requiredFromType = isObject(typeNode) && typeNode.required === true
  const required = raw.required === true || requiredFromType

  // defaultValue: react-docgen `{ value }`, or Storybook `table.defaultValue.summary`
  let defaultValue: unknown
  if (isObject(raw.defaultValue) && 'value' in raw.defaultValue) {
    defaultValue = unquoteLiteral(raw.defaultValue.value)
  } else if (
    isObject(raw.table) &&
    isObject(raw.table.defaultValue) &&
    'summary' in raw.table.defaultValue
  ) {
    defaultValue = unquoteLiteral(raw.table.defaultValue.summary)
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

  const tokenGroup = typeName === 'boolean' || typeName === 'number' || list ? undefined : inferTokenGroup(name)

  // A component that resolves a default inside (so docgen sees none) states it in
  // its JSDoc — "Default `program`." — and that is the value it takes when unset.
  if (defaultValue === undefined && description) {
    const documented = description.match(/\bDefault `([^`]*)`/)?.[1]
    if (documented !== undefined) {
      if (typeName === 'boolean' && (documented === 'true' || documented === 'false')) defaultValue = documented === 'true'
      else if (typeName === 'number' && documented.trim() !== '' && !Number.isNaN(Number(documented))) defaultValue = Number(documented)
      else if (options ? options.includes(documented) : typeName === 'string') defaultValue = documented
    }
  }

  // A number's limits, stated the same way: "from `48` to `456` in steps of `8`".
  // Docgen sees only `number`; without these the validator can't hold a value to
  // the range the component clamps it into.
  const range = typeName === 'number' ? documentedRange(description) : {}

  const prop: ManifestProp = {
    name,
    type: { name: typeName, ...(typeof typeNode?.raw === 'string' ? { raw: typeNode.raw } : {}) },
    required,
    ...(docgen?.nullable ? { nullable: true } : {}),
    ...(defaultValue !== undefined && !list ? { defaultValue } : {}),
    ...(list?.count !== undefined ? { min: list.count, max: list.count } : {}),
    ...range,
    ...(options ? { options } : {}),
    ...(description ? { description } : {}),
    ...(tokenGroup ? { tokenGroup } : {}),
    ...(fields ? { fields } : {}),
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

/** One component a Storybook components manifest documents, under the name it imports as. */
export interface StorybookComponentSource {
  /** Its name in the imported manifest — qualified by its story when two share a name. */
  name: string
  /** The name its react-docgen output gives it, when that differs from `name`. */
  original: string
  entry: Record<string, unknown>
}

/**
 * Every component of Storybook 10's `manifests/components.json` — one per story
 * file's component, and one per subcomponent its story meta declares — under the
 * name the importer gives it. Two stories can document different components that
 * share a name (a primitive Button and a kit Button): both are kept, each named by
 * its source (`PrimitivesButton`, `UiKitButton`).
 */
export function storybookComponentSources(rawJson: {
  components: Record<string, Record<string, unknown>>
}): StorybookComponentSource[] {
  const found: { name: string; source: string; entry: Record<string, unknown> }[] = []
  for (const [key, entry] of Object.entries(rawJson.components)) {
    if (!isObject(entry)) continue
    found.push({ name: typeof entry.name === 'string' && entry.name ? entry.name : key, source: key, entry })
    if (isObject(entry.subcomponents)) {
      for (const [subKey, sub] of Object.entries(entry.subcomponents)) {
        const name = isObject(sub) && typeof sub.name === 'string' && sub.name ? sub.name : subKey
        if (isObject(sub)) found.push({ name, source: `${key}-${name}`, entry: sub })
      }
    }
  }
  const count = new Map<string, number>()
  for (const f of found) count.set(f.name, (count.get(f.name) ?? 0) + 1)
  const qualified = (source: string) =>
    source
      .split(/[^A-Za-z0-9]+/)
      .filter(Boolean)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join('')
  return found.map(({ name, source, entry }) => ({
    name: (count.get(name) ?? 0) > 1 ? qualified(source) : name,
    original: name,
    entry,
  }))
}

/**
 * Storybook 10's `manifests/components.json` → the docgen-map entries the rest of
 * the adapter reads. Entries Storybook could not document, and renamed clashes,
 * become warnings.
 */
function componentsManifestEntries(
  rawJson: { components: Record<string, Record<string, unknown>> },
  warnings: StorybookImportWarning[],
): [string, unknown][] {
  const out: [string, unknown][] = []
  for (const { name, original, entry } of storybookComponentSources(rawJson)) {
    const docgen = entry.reactDocgen
    if (!isObject(docgen)) {
      const why = isObject(entry.error) ? String(entry.error.message ?? entry.error.name) : 'no react-docgen output'
      warnings.push({ component: name, message: `skipped — ${why}` })
      continue
    }
    if (name !== original) {
      warnings.push({ component: name, message: `more than one component is named "${original}" — imported this one as "${name}"` })
    }
    const description =
      (typeof docgen.description === 'string' && docgen.description) ||
      (typeof entry.description === 'string' ? entry.description : '')
    out.push([name, { displayName: name, description, props: isObject(docgen.props) ? docgen.props : {} }])
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

const SCALE_GROUPS = ['spacing', 'radius'] as const

/**
 * A scale prop offers the step names its component takes (`gap: 'lg'`); a token
 * file names the same steps by path (`spacing-core-lg`). Record each step under
 * its own name too — preferring the core scale — so the frame rules (margins,
 * gutters, the 8pt grid) can measure what a Blueprint sets.
 */
function aliasScaleSteps(
  components: Record<string, ManifestComponent>,
  tokens: ManifestTokens,
  tiers: TokenTierMap,
  warnings: StorybookImportWarning[],
): void {
  for (const group of SCALE_GROUPS) {
    const dict = tokens[group]
    if (!dict || Object.keys(dict).length === 0) continue
    const unmatched = new Set<string>()
    for (const component of Object.values(components)) {
      for (const prop of Object.values(component.props)) {
        if (prop.tokenGroup !== group || !prop.options) continue
        for (const option of prop.options) {
          if (option in dict) continue
          const matches = Object.keys(dict).filter((name) => name.endsWith(`-${option}`))
          const pick = matches.find((name) => /(^|-)core-/.test(name)) ?? (matches.length === 1 ? matches[0] : undefined)
          if (!pick) {
            unmatched.add(option)
            continue
          }
          dict[option] = dict[pick]
          const tier = tiers[group]?.[pick]
          if (tier) tiers[group] = { ...tiers[group], [option]: tier }
        }
      }
    }
    for (const option of unmatched) {
      warnings.push({ component: 'tokens', prop: `${group}.${option}`, message: `"${option}" names no ${group} token, so the frame rules can't measure it` })
    }
  }
}

/** The manifest, plus everything the import accepted with a loss. */
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
  aliasScaleSteps(components, tokens, tiers, warnings)
  const manifest: DesignSystemManifest = {
    id: meta.id ?? slug(name),
    name,
    version: meta.version ?? versionFromJson ?? '0.0.0',
    tokens,
    components,
    ...(Object.keys(tiers).length > 0 ? { tokenTiers: { rule: TOKEN_TIER_RULE, tiers } } : {}),
  }
  const templates = screenTemplatesFrom(rawJson, manifest, warnings)
  return { manifest: templates.length > 0 ? { ...manifest, templates } : manifest, warnings }
}

/**
 * A Storybook export carries no notion of a reference screen on its own — a
 * `templates` array alongside `components` is our own extension
 * (`scripts/storybook/export-dtv.ts` writes one for the DTV system). Each entry
 * is validated against the very manifest it ships with, so a template invalid
 * against its own components can never reach the Planner (`templatesFor` in
 * `promptSpec.ts` reads `manifest.templates` with no further checking).
 */
function screenTemplatesFrom(
  rawJson: unknown,
  manifest: DesignSystemManifest,
  warnings: StorybookImportWarning[],
): ManifestScreenTemplate[] {
  const raw = isObject(rawJson) && Array.isArray(rawJson.templates) ? rawJson.templates : []
  const out: ManifestScreenTemplate[] = []
  const seen = new Set<string>()
  raw.forEach((entry: unknown, i: number) => {
    const label = isObject(entry) && typeof entry.id === 'string' ? entry.id : `#${i}`
    if (
      !isObject(entry) ||
      typeof entry.id !== 'string' ||
      typeof entry.name !== 'string' ||
      typeof entry.when !== 'string' ||
      !isObject(entry.blueprint)
    ) {
      warnings.push({ component: 'templates', prop: label, message: 'missing id, name, when or blueprint — skipped' })
      return
    }
    if (seen.has(entry.id)) {
      warnings.push({ component: 'templates', prop: entry.id, message: 'a second template with this id — kept the first' })
      return
    }
    const result = validateBlueprintAgainstManifest(entry.blueprint, manifest)
    if (!result.ok) {
      warnings.push({
        component: 'templates',
        prop: entry.id,
        message: `its blueprint does not pass validation against its own manifest — skipped (${result.errors[0]})`,
      })
      return
    }
    seen.add(entry.id)
    out.push({ id: entry.id, name: entry.name, when: entry.when, blueprint: entry.blueprint })
  })
  return out
}

/** A token the parse left out, in the importer's warning shape. */
export function tokenImportWarning(w: TokenWarning): StorybookImportWarning {
  return { component: 'tokens', prop: w.token, message: w.message }
}
