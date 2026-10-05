/**
 * Blueprint → TSX — the handoff exporter.
 *
 * A validated Blueprint is a typed tree of kit components with token props, so it
 * has exactly one faithful reading as code: each node becomes an element of the
 * component it names, each prop an attribute, each child a child. No model is
 * involved and nothing is invented — a node the kit map does not know is an error,
 * not a guess, and the TypeScript compiler holds the result to the real props.
 *
 * What the exported file is:
 *   - one component per screen, composed from `Screen` (the frame) and the kit;
 *   - the root's `anchor` children become `Screen`'s `anchored` slot, on the side
 *     the layer model favours — what the canvas works out at render time is decided
 *     here, once, and written down;
 *   - a declared deviation travels as a comment the code-side lint can read:
 *     `@deviation <ruleId>: <why>` in a JSX comment on a node, or in the component's
 *     doc for the screen and its root;
 *   - `goTo` links are listed in the component's doc — wiring them is the dev's call.
 *
 * What it refuses, so nothing ships half-built: primitives and `Proposal` (the
 * Exploratory vocabulary has no kit component yet) and a composed overlay.
 *
 * Framework-free: it builds a string, so it runs in the app, in a script and in tests.
 */

import type { BlueprintDocument, BlueprintNode, BlueprintScreen } from '@/shared/blueprint'
import type { RuleDeviation, ScreenSpec } from '@/shared/design-system/manifest'
import {
  COMPOSED_MODEL,
  DEFAULT_SCREEN_MODEL,
  DTV_SCREEN_LAYERS,
  screenModel,
} from '@/shared/design-system/screen-layers'
import { DTV_KIT, SCREEN_IMPORT, type KitImport } from './kit'

export class TsxExportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TsxExportError'
  }
}

export interface TsxExportOptions {
  /** The component name of the first screen. Default: the document's name, else `Screen`. */
  componentName?: string
  /** Rewrites a module path, e.g. `@/ui-kit/MainMenu` → `@globo/dtv-kit/MainMenu`. Default: as is. */
  resolveModule?: (module: string) => string
  /** The kit map. Default: the DTV kit. */
  kit?: Readonly<Record<string, KitImport>>
}

export interface ExportedScreen {
  /** The screen's id in the document (what `goTo` names). */
  id: string
  /** The exported component's name. */
  component: string
}

export interface TsxExport {
  code: string
  screens: ExportedScreen[]
}

/** Wide enough to read, narrow enough that a diff stays local. */
const LINE_WIDTH = 100
const INDENT = '  '
const at = (depth: number): string => INDENT.repeat(depth)

// ---------------------------------------------------------------------------
// Names and values
// ---------------------------------------------------------------------------

function pascal(text: string): string {
  const words = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
  const name = words.map((w) => w[0].toUpperCase() + w.slice(1)).join('')
  if (!name) return ''
  return /^[A-Za-z]/.test(name) ? name : `Screen${name}`
}

/** A value as a TypeScript literal, the way the kit's own code writes it (single quotes, bare keys). */
function literal(value: unknown): string {
  if (typeof value === 'string') {
    const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')
    return `'${escaped}'`
  }
  if (Array.isArray(value)) return `[${value.map(literal).join(', ')}]`
  if (value !== null && typeof value === 'object') {
    const fields = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : literal(k)}: ${literal(v)}`)
    return fields.length > 0 ? `{ ${fields.join(', ')} }` : '{}'
  }
  return JSON.stringify(value) ?? 'undefined'
}

/** A prop as a JSX attribute: `name="text"`, `name`, or `name={…}`. */
function attribute(name: string, value: unknown): string | null {
  if (value === undefined) return null
  if (typeof value === 'string') {
    // A JSX attribute string has no escapes, so anything that would need one goes in braces.
    return /["\\\n\r{}<>&]/.test(value) ? `${name}={${literal(value)}}` : `${name}="${value}"`
  }
  if (value === true) return name
  return `${name}={${literal(value)}}`
}

/** One line of free text that cannot close the comment it sits in. */
function commentSafe(text: string): string {
  return text.replace(/\*\//g, '* /').replace(/\s+/g, ' ').trim()
}

function deviationText(deviation: RuleDeviation): string {
  return `@deviation ${deviation.ruleId}: ${commentSafe(deviation.why)}`
}

// ---------------------------------------------------------------------------
// Nodes
// ---------------------------------------------------------------------------

interface Context {
  kit: Readonly<Record<string, KitImport>>
  /** module → the names imported from it */
  imports: Map<string, Set<string>>
  /** the `goTo` links of the screen being written, as doc lines */
  links: string[]
  /** screen id → the component exported for it, so a link can name its target */
  components: ReadonlyMap<string, string>
}

function use(ctx: Context, entry: KitImport): void {
  const names = ctx.imports.get(entry.module) ?? new Set<string>()
  names.add(entry.name)
  ctx.imports.set(entry.module, names)
}

function labelOf(node: BlueprintNode): string {
  const props = node.props ?? {}
  const text = props.title ?? props.label ?? props.name ?? props.programTitle
  return typeof text === 'string' ? ` "${commentSafe(text)}"` : ''
}

function render(node: BlueprintNode, depth: number, ctx: Context, path: string): string[] {
  if (node.type.startsWith('primitive:') || node.type === 'Proposal') {
    throw new TsxExportError(
      `${path}: <${node.type}> is Exploratory vocabulary with no kit component yet, so the exporter does not write it. ` +
        'Replace it with a kit component, or build it by hand.',
    )
  }
  const entry = ctx.kit[node.type]
  if (!entry) {
    throw new TsxExportError(
      `${path}: <${node.type}> is not in the kit map (${Object.keys(ctx.kit).sort().join(', ')}). ` +
        'A blueprint written against the built-in catalog has to be translated to the kit’s names first.',
    )
  }
  use(ctx, entry)
  if (node.goTo) {
    const target = ctx.components.get(node.goTo)
    ctx.links.push(`${node.type}${labelOf(node)} → ${node.goTo}${target ? ` (${target})` : ''}`)
  }

  const pad = at(depth)
  const tag = entry.name
  const attrs = Object.entries(node.props ?? {})
    .map(([name, value]) => attribute(name, value))
    .filter((a): a is string => a !== null)
  const children = node.children ?? []
  const selfClosing = children.length === 0

  const oneLine = `${pad}<${tag}${attrs.length ? ` ${attrs.join(' ')}` : ''}`
  const lines: string[] = []
  if (attrs.length <= 1 || oneLine.length + (selfClosing ? 3 : 1) <= LINE_WIDTH) {
    lines.push(`${oneLine}${selfClosing ? ' />' : '>'}`)
  } else {
    lines.push(`${pad}<${tag}`, ...attrs.map((a) => `${pad}${INDENT}${a}`), `${pad}${selfClosing ? '/>' : '>'}`)
  }
  if (selfClosing) return lines

  children.forEach((child, index) => {
    if (child.deviation) lines.push(`${at(depth + 1)}{/* ${deviationText(child.deviation)} */}`)
    lines.push(...render(child, depth + 1, ctx, `${path} › ${child.type}[${index}]`))
  })
  lines.push(`${pad}</${tag}>`)
  return lines
}

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------

function screenDoc(component: string, spec: ScreenSpec, root: BlueprintNode, links: readonly string[], notes: readonly string[]): string[] {
  const lines = ['/**', ` * ${component} — layer model \`${spec.model}\`, level ${spec.level}.`]
  for (const deviation of spec.deviation ?? []) lines.push(` * ${deviationText(deviation)}`)
  if (root.deviation) lines.push(` * ${deviationText(root.deviation)}`)
  if (links.length > 0) {
    lines.push(' *', ' * Links (wire them to your navigation):')
    for (const link of links) lines.push(` *   ${commentSafe(link)}`)
  }
  if (notes.length > 0) {
    lines.push(' *', ' * Notes from the generation:')
    for (const note of notes) lines.push(` *   ${commentSafe(note)}`)
  }
  lines.push(' */')
  return lines
}

function exportScreen(
  component: string,
  specIn: ScreenSpec | undefined,
  root: BlueprintNode,
  ctx: Context,
  notes: readonly string[],
): string[] {
  const spec: ScreenSpec = specIn ?? { model: DEFAULT_SCREEN_MODEL, level: 1 }
  if (spec.model === COMPOSED_MODEL) {
    throw new TsxExportError(`${component}: a composed overlay has no kit model to name, so the exporter does not write it.`)
  }
  const model = screenModel(DTV_SCREEN_LAYERS, spec.model)
  if (!model) throw new TsxExportError(`${component}: "${spec.model}" is not a layer model of the DTV rule.`)

  ctx.links = []
  const anchored = (root.children ?? []).filter((child) => child.anchor)
  const content: BlueprintNode = { ...root, children: (root.children ?? []).filter((child) => !child.anchor) }

  const body = render(content, 3, ctx, `${component} › ${root.type}`)

  // The anchored group: one plain element sits straight in the slot, anything else in a fragment.
  const lone = anchored.length === 1 && !anchored[0].deviation
  const anchoredBlock = (): string[] => {
    if (lone) {
      const whole = render(anchored[0], 0, ctx, `${component} › ${anchored[0].type}[anchored]`)
      if (whole.length === 1) return [`${at(3)}anchored={${whole[0]}}`]
      return [`${at(3)}anchored={`, ...whole.map((l) => `${at(4)}${l}`), `${at(3)}}`]
    }
    const inner = anchored.flatMap((node, index) => [
      ...(node.deviation ? [`${at(5)}{/* ${deviationText(node.deviation)} */}`] : []),
      ...render(node, 5, ctx, `${component} › ${node.type}[anchored ${index}]`),
    ])
    return [`${at(3)}anchored={`, `${at(4)}<>`, ...inner, `${at(4)}</>`, `${at(3)}}`]
  }
  const anchoredLines = anchored.length > 0 ? anchoredBlock() : []

  use(ctx, SCREEN_IMPORT)
  // What the canvas reads off the rendered screen, decided once: the model's side, else the right.
  const attrs = [`model="${model.id}"`, `level={${spec.level}}`, ...(model.side === 'left' ? ['focusSide="left"'] : [])]

  const out = screenDoc(component, spec, root, ctx.links, notes)
  out.push(`export function ${component}(): ReactNode {`, `${at(1)}return (`)
  if (anchoredLines.length === 0) {
    out.push(`${at(2)}<Screen ${attrs.join(' ')}>`)
  } else {
    out.push(`${at(2)}<Screen`, ...attrs.map((a) => `${at(3)}${a}`), ...anchoredLines, `${at(2)}>`)
  }
  out.push(...body, `${at(2)}</Screen>`, `${at(1)})`, '}')
  return out
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

export function exportBlueprintToTsx(doc: BlueprintDocument, options: TsxExportOptions = {}): TsxExport {
  const kit = options.kit ?? DTV_KIT
  const resolve = options.resolveModule ?? ((module: string) => module)
  const components = new Map<string, string>()
  const ctx: Context = { kit, imports: new Map(), links: [], components }

  const reserved = new Set<string>(['Screen', 'ReactNode', ...Object.values(kit).map((k) => k.name)])
  const taken = new Set<string>()
  const nameFor = (wanted: string): string => {
    let base = pascal(wanted) || 'Screen'
    if (reserved.has(base)) base = `${base}View`
    let name = base
    for (let n = 2; taken.has(name); n++) name = `${base}${n}`
    taken.add(name)
    return name
  }

  const entries = [
    { id: doc.id ?? 'screen-1', name: options.componentName ?? doc.name ?? doc.id ?? 'Screen', spec: doc.screen, root: doc.root },
    ...(doc.screens ?? []).map((s: BlueprintScreen) => ({ id: s.id, name: s.name ?? s.id, spec: s.screen, root: s.root })),
  ]

  // Every screen is named before any is written, so a link can name the component it opens.
  const screens: ExportedScreen[] = entries.map((entry) => {
    const component = nameFor(entry.name)
    components.set(entry.id, component)
    return { id: entry.id, component }
  })
  const blocks = entries.map((entry, index) => {
    const notes = index === 0 ? (doc.notes ?? []) : []
    return exportScreen(screens[index].component, entry.spec, entry.root, ctx, notes).join('\n')
  })

  const modules = [...ctx.imports.entries()]
    .map(([module, names]) => ({ module: resolve(module), names: [...names].sort() }))
    .sort((a, b) => a.module.localeCompare(b.module))
  const header = [
    '// Generated by ScreenFlow Studio from a validated Blueprint. Edit freely: it is yours now.',
    "import type { ReactNode } from 'react'",
    ...modules.map(({ module, names }) => `import { ${names.join(', ')} } from '${module}'`),
  ]

  const code = [...header, '', blocks.join('\n\n'), '', `export default ${screens[0].component}`, ''].join('\n')
  return { code, screens }
}
