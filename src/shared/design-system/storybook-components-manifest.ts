/**
 * Storybook 10's components manifest — `manifests/components.json`, written by
 * `storybook build` when `features.componentsManifest` is on.
 *
 * Each entry is a story file's component with its react-docgen output
 * (`reactDocgen.props[name].tsType`) and any `subcomponents` the story meta
 * declares. Two readers share this file:
 *
 * - `scripts/storybook/export-manifest.ts` turns a build into the committed
 *   snapshot the catalog parity tests diff against;
 * - `storybook-adapter.ts` imports an external design system from the same shape.
 *
 * The part both need is `literalOptions`: react-docgen writes a TS literal union
 * as a tree (`union` / `literal`, and `Extract` / `Exclude` around them), and the
 * option list a Blueprint may use is the set that tree resolves to.
 *
 * Framework-free — usable from the Electron main process and from scripts.
 */

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * What a prop's type resolved to. `unresolved` is a type react-docgen could not
 * follow (it wrote `unknown`, or a named alias it did not expand), so no option
 * list can be trusted for it.
 */
export type DocgenPropKind =
  | 'enum'
  | 'string'
  | 'number'
  | 'boolean'
  | 'node'
  | 'function'
  | 'array'
  | 'object'
  | 'unresolved'

export interface DocgenProp {
  /** The type as written in the source, e.g. `'default' | 'focus'`. */
  type: string
  kind: DocgenPropKind
  /** The literal values, when `kind` is `enum`. */
  options?: string[]
  required: boolean
  /** The default as react-docgen printed it, quotes stripped. */
  defaultValue?: string
  description: string
  /** Its JSDoc carries `@deprecated` — an alias kept for old call sites. */
  deprecated?: true
  /** Declared in a `node_modules` type (react-docgen-typescript only) — an inherited DOM prop. */
  inherited?: true
}

export interface DocgenComponent {
  name: string
  description: string
  props: Record<string, DocgenProp>
  /** Why Storybook could not document it (no `component` in the story meta, a parse error…). */
  error?: string
}

export interface SnapshotComponent extends DocgenComponent {
  /** Storybook title, e.g. `UI Kit/Content Card`. */
  title: string
  /** Every story id under that title, sorted. */
  stories: string[]
  subcomponents: Record<string, DocgenComponent>
}

/** The committed, machine-independent record of what Storybook documents. */
export interface StorybookSnapshot {
  v: 1
  docgen: string
  /** Keyed by the Storybook component id (the title slug, e.g. `ui-kit-content-card`). */
  components: Record<string, SnapshotComponent>
}

// ---------------------------------------------------------------------------
// Literal unions
// ---------------------------------------------------------------------------

/** A string literal's value: react-docgen keeps the quotes and the escapes as written. */
export function unquoteLiteral(value: unknown): string {
  const text = String(value)
  const m = text.match(/^(['"`])(.*)\1$/s)
  if (!m) return text
  return m[2].replace(/\\(.)/g, (_, c: string) => ({ n: '\n', t: '\t', r: '\r' })[c] ?? c)
}

const NULLISH = new Set(['null', 'undefined', 'void'])

/**
 * The literal values a react-docgen `tsType` resolves to, in source order, or
 * `null` when any part of it is not a literal (a `string` member, an unexpanded
 * alias, `unknown`). `null`/`undefined` members are ignored — they make a prop
 * optional, they are not options.
 */
export function literalOptions(tsType: unknown): string[] | null {
  if (!isObject(tsType)) return null
  const elements = Array.isArray(tsType.elements) ? tsType.elements : []
  switch (tsType.name) {
    case 'literal':
      return [unquoteLiteral(tsType.value)]
    case 'enum': {
      // PropTypes `oneOf` — `{ name: 'enum', value: [{ value: "'a'" }, …] }`.
      if (!Array.isArray(tsType.value)) return null
      const out = tsType.value
        .map((entry) => unquoteLiteral(isObject(entry) ? entry.value : entry))
        .filter((option) => option !== '' && !NULLISH.has(option))
      return out.length > 0 ? out : null
    }
    case 'union': {
      const out: string[] = []
      for (const element of elements) {
        if (isObject(element) && NULLISH.has(String(element.name))) continue
        const options = literalOptions(element)
        if (!options) return null
        for (const option of options) if (!out.includes(option)) out.push(option)
      }
      return out.length > 0 ? out : null
    }
    case 'Extract': {
      const [from, keep] = elements.map(literalOptions)
      if (!from || !keep) return null
      const kept = from.filter((option) => keep.includes(option))
      return kept.length > 0 ? kept : null
    }
    case 'Exclude': {
      const [from, drop] = elements.map(literalOptions)
      if (!from || !drop) return null
      const left = from.filter((option) => !drop.includes(option))
      return left.length > 0 ? left : null
    }
    default:
      return null
  }
}

function kindOf(tsType: Record<string, unknown>): DocgenPropKind {
  switch (tsType.name) {
    case 'string':
      return 'string'
    case 'number':
      return 'number'
    case 'boolean':
    case 'bool':
      return 'boolean'
    case 'ReactNode':
    case 'ReactElement':
    case 'JSX.Element':
    case 'node':
    case 'element':
      return 'node'
    case 'signature':
    case 'func':
    case 'Function':
      return tsType.type === 'object' ? 'object' : 'function'
    case 'Array':
    case 'arrayOf':
      return 'array'
    default:
      return 'unresolved'
  }
}

function inheritedFromNodeModules(raw: Record<string, unknown>): boolean {
  const files: unknown[] = []
  if (isObject(raw.parent)) files.push(raw.parent.fileName)
  if (Array.isArray(raw.declarations)) {
    for (const d of raw.declarations) if (isObject(d)) files.push(d.fileName)
  }
  return files.length > 0 && files.every((f) => typeof f === 'string' && f.includes('node_modules'))
}

/** One react-docgen prop entry → `DocgenProp`. Reads `tsType` (TS source) or `type` (PropTypes). */
export function readDocgenProp(raw: unknown): DocgenProp | null {
  if (!isObject(raw)) return null
  const tsType = isObject(raw.tsType) ? raw.tsType : isObject(raw.type) ? raw.type : undefined
  const options = tsType ? literalOptions(tsType) : null
  const kind: DocgenPropKind = options ? 'enum' : tsType ? kindOf(tsType) : 'unresolved'
  const typeText = tsType
    ? typeof tsType.raw === 'string'
      ? tsType.raw
      : String(tsType.name ?? 'unknown')
    : 'unknown'
  const description = typeof raw.description === 'string' ? raw.description.trim() : ''
  const defaultValue =
    isObject(raw.defaultValue) && raw.defaultValue.value !== undefined
      ? unquoteLiteral(raw.defaultValue.value)
      : undefined
  return {
    type: typeText,
    kind,
    ...(options ? { options } : {}),
    required: raw.required === true,
    ...(defaultValue !== undefined ? { defaultValue } : {}),
    description,
    ...(/@deprecated\b/.test(description) ? { deprecated: true as const } : {}),
    ...(inheritedFromNodeModules(raw) ? { inherited: true as const } : {}),
  }
}

/** A react-docgen block (`{ displayName, description, props }`) → `DocgenComponent`. */
export function readDocgenComponent(name: string, docgen: unknown, error?: unknown): DocgenComponent {
  const props: Record<string, DocgenProp> = {}
  const rawProps = isObject(docgen) && isObject(docgen.props) ? docgen.props : {}
  for (const key of Object.keys(rawProps).sort()) {
    const prop = readDocgenProp(rawProps[key])
    if (prop) props[key] = prop
  }
  const description = isObject(docgen) && typeof docgen.description === 'string' ? docgen.description.trim() : ''
  const errorText = isObject(error) ? String(error.message ?? error.name ?? 'error') : undefined
  return { name, description, props, ...(errorText ? { error: errorText } : {}) }
}

// ---------------------------------------------------------------------------
// The manifest itself
// ---------------------------------------------------------------------------

/** Is this Storybook's `manifests/components.json` (as opposed to a docgen map or argTypes)? */
export function isComponentsManifest(
  raw: unknown,
): raw is { v: number; components: Record<string, Record<string, unknown>>; meta?: Record<string, unknown> } {
  if (!isObject(raw) || typeof raw.v !== 'number' || !isObject(raw.components)) return false
  return Object.values(raw.components).some(
    (entry) => isObject(entry) && ('reactDocgen' in entry || ('stories' in entry && 'path' in entry)),
  )
}

/** The documented components of a components manifest, subcomponents flattened in after their parent. */
export function componentsOf(raw: unknown): DocgenComponent[] {
  if (!isComponentsManifest(raw)) return []
  const out: DocgenComponent[] = []
  for (const entry of Object.values(raw.components)) {
    const name = typeof entry.name === 'string' ? entry.name : ''
    if (!name) continue
    out.push(readDocgenComponent(name, entry.reactDocgen, entry.error))
    if (isObject(entry.subcomponents)) {
      for (const [subName, sub] of Object.entries(entry.subcomponents)) {
        if (!isObject(sub)) continue
        out.push(readDocgenComponent(typeof sub.name === 'string' ? sub.name : subName, sub.reactDocgen, sub.error))
      }
    }
  }
  return out
}

/**
 * A Storybook build (`index.json` + `manifests/components.json`) → the snapshot.
 * Absolute paths and story snippets are dropped so the result is the same on any
 * machine; keys are sorted so a rebuild with no source change is byte-identical.
 */
export function snapshotFromStorybook(index: unknown, manifest: unknown): StorybookSnapshot {
  if (!isComponentsManifest(manifest)) {
    throw new Error('Not a Storybook components manifest (manifests/components.json). Is `features.componentsManifest` on?')
  }
  const entries = isObject(index) && isObject(index.entries) ? Object.values(index.entries) : []
  const storiesByComponent = new Map<string, { title: string; ids: string[] }>()
  for (const entry of entries) {
    if (!isObject(entry) || entry.type !== 'story' || typeof entry.id !== 'string') continue
    const componentId = entry.id.split('--')[0]
    const record = storiesByComponent.get(componentId) ?? { title: String(entry.title ?? ''), ids: [] }
    record.ids.push(entry.id)
    storiesByComponent.set(componentId, record)
  }

  const components: Record<string, SnapshotComponent> = {}
  for (const id of Object.keys(manifest.components).sort()) {
    const entry = manifest.components[id]
    const name = typeof entry.name === 'string' ? entry.name : id
    const subcomponents: Record<string, DocgenComponent> = {}
    if (isObject(entry.subcomponents)) {
      for (const subName of Object.keys(entry.subcomponents).sort()) {
        const sub = entry.subcomponents[subName]
        if (isObject(sub)) subcomponents[subName] = readDocgenComponent(subName, sub.reactDocgen, sub.error)
      }
    }
    const stories = storiesByComponent.get(id)
    components[id] = {
      ...readDocgenComponent(name, entry.reactDocgen, entry.error),
      title: stories?.title ?? '',
      stories: [...(stories?.ids ?? [])].sort(),
      subcomponents,
    }
  }

  const docgen = isObject(manifest.meta) && typeof manifest.meta.docgen === 'string' ? manifest.meta.docgen : 'unknown'
  return { v: 1, docgen, components }
}
