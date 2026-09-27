/**
 * Turns a Design System Manifest into (a) a machine-readable spec and (b) the LLM
 * system prompts.
 *
 * The Generator's system prompt opens with the GLOBAL KERNEL (`buildGlobalKernel`)
 * — the agent's unbreakable, design-system-agnostic laws: Blueprint JSON + tokens,
 * the 8pt grid, the 1280×720 canvas with its safe area / gutters / focus
 * alignment, registry strictness, the token tier rule (core → semantic →
 * components; `manifest.ts`) and the layer rule (Camadas: video → overlay →
 * content; `screen-layers.ts`). It is kept lean, and every number in it
 * comes from `shared/layout/frame.ts`, so the laws can never drift from what the
 * validator enforces. Everything specific to the active design system follows it,
 * compiled from the manifest (`designSystemBinding`, the component list).
 *
 * Spec §6 Step 3 ("Dynamic AI Schema Injection"): the Planner and Generator agents
 * must NEVER see a hardcoded schema. Every design-system detail here is compiled
 * from the *active* `DesignSystemManifest` that the orchestrator passes in, so the
 * model can only ever be told about components and token values that the active
 * system actually has.
 *
 * When no manifest is supplied we fall back to the built-in ScreenFlow manifest
 * (itself derived from `catalog.ts`), so existing callers are unaffected.
 *
 * Imported by the Electron main process — must stay free of React / DOM.
 */

import { MAX_NOTES, MAX_SCREENS, RENDER_TOOL_NAME } from '@/shared/blueprint'
import type { DesignSystemManifest, ManifestComponent, ManifestTokens } from '@/shared/design-system/manifest'
import {
  TOKEN_TIER_RULE,
  assignableTokenNames,
  defaultForProp,
  inferControl,
  isCoreToken,
  rootContainerId,
  semanticEquivalents,
  tokenTierRule,
  tokenNames,
  tokenTier,
} from '@/shared/design-system/manifest'
import { SCREENFLOW_MANIFEST } from '@/shared/design-system/screenflow-manifest'
import type { ManifestScreenTemplate } from '@/shared/design-system/manifest'
import { clearBackgroundFor, screenLayersOf, sidePropFor } from '@/shared/design-system/screen-layers'
import {
  FRAME,
  focusPropsFor,
  unfocusedValue,
  allowedSpacingNames,
  centeringPropsFor,
  stretchPropFor,
  onGridSpacingNames,
  spacingNameForPx,
  spacingPropFor,
  spacingPx,
} from '@/shared/layout/frame'

export interface PropSpec {
  name: string
  control: 'text' | 'textarea' | 'select' | 'boolean' | 'number' | 'list'
  /** What the prop is for, from the component's own docs — the model's only guide to an imported system. */
  description?: string
  /** Allowed values for a `select` prop. */
  options?: readonly string[]
  /** It also takes `null`. */
  nullable?: boolean
  /** Phase 7B: real token names, when this prop draws from a token scale. */
  tokenNames?: string[]
  default: unknown
  /** Number bounds and grid step, when the prop declares them. */
  min?: number
  max?: number
  step?: number
  /** A list of objects: each item's fields, `?` marking the optional ones. */
  fields?: string[]
}

export interface ComponentSpec {
  type: string
  category: string
  summary: string
  acceptsChildren: boolean
  /** Its only children, in order, each at most once — any may be left out. */
  slots?: string[]
  /** The only components it may sit directly inside. */
  parents?: string[]
  props: PropSpec[]
}

function specForComponent(component: ManifestComponent, manifest: DesignSystemManifest): ComponentSpec {
  const props: PropSpec[] = Object.values(component.props).map((prop) => {
    // Spacing values are cut to the 8pt grid, exactly as the validator compiles them.
    const group = prop.tokenGroup
    const spacing = group === 'spacing'
    // The token tier rule: the model is only ever shown tokens it may name — never core.
    const allNames = group ? assignableTokenNames(manifest, group) : []
    const names = spacing ? onGridSpacingNames(manifest, allNames) : allNames
    const allowed = group && prop.options ? prop.options.filter((o) => !isCoreToken(manifest, group, o)) : prop.options
    const options = spacing && allowed ? onGridSpacingNames(manifest, allowed) : allowed
    return {
      name: prop.name,
      control: inferControl(prop),
      ...(prop.description ? { description: prop.description.replace(/\s+/g, ' ').trim() } : {}),
      ...(prop.nullable ? { nullable: true } : {}),
      options,
      ...(names.length > 0 ? { tokenNames: names } : {}),
      default: prop.defaultValue,
      ...(prop.min !== undefined ? { min: prop.min } : {}),
      ...(prop.max !== undefined ? { max: prop.max } : {}),
      ...(prop.step !== undefined ? { step: prop.step } : {}),
      ...(prop.fields ? { fields: Object.values(prop.fields).map((f) => `${f.name}${f.required ? '' : '?'}`) } : {}),
    }
  })

  return {
    type: component.id,
    category: component.category ?? 'component',
    summary: component.description,
    acceptsChildren: component.acceptsChildren,
    ...(component.slots ? { slots: component.slots } : {}),
    ...(component.parents ? { parents: component.parents } : {}),
    props,
  }
}

export function getRegistrySpec(
  manifest: DesignSystemManifest = SCREENFLOW_MANIFEST,
): ComponentSpec[] {
  return Object.values(manifest.components).map((c) => specForComponent(c, manifest))
}

// ---------------------------------------------------------------------------
// Global kernel — the agent's unbreakable laws, design-system agnostic
// ---------------------------------------------------------------------------

const px = (n: number): string => `${n}px`

function kernelIntro(): string {
  return `You are an expert UI Engineering Agent. Your primary directive is to generate valid Blueprint JSON (DSL) layouts that strictly adhere to our design system's physical constraints and component registry.

You must never violate the following global architectural laws:`
}

function tokensLaw(): string {
  return `### 1. BLUEPRINT JSON FORMAT & TOKENS
* **Output:** You must generate valid Blueprint JSON DSL. Do not output React components, JSX, or raw HTML.
* **Tokens:** You are strictly forbidden from using raw pixel values (e.g., \`${px(FRAME.gutter)}\`) or HEX/RGB color codes for styling. All typography, colors, radii, spacing, and dimensions must be assigned using our global design tokens.`
}

function spatialLaw(): string {
  const [halfStep, oneAndHalfStep] = FRAME.offGridAllowed
  const examples = [1, 2, 3, 4, 5, 6, 8].map((n) => n * FRAME.grid).join(', ')
  return `### 2. THE SPATIAL PHYSICS & EXCEPTIONS
The application operates on a strict mathematical ${FRAME.grid}-point grid.
* Standard dimensions, margins, paddings, heights, and offsets MUST evaluate to a multiple of ${FRAME.grid} (e.g., ${examples}).
* **Exceptions:** \`${px(halfStep)}\` (half-step) and \`${px(oneAndHalfStep)}\` (1.5 step) are explicitly permitted for micro-spacing and tight component internals.
* Never output fractional pixels or any other off-grid values outside of the allowed ${FRAME.grid}pt scale and the ${px(halfStep)}/${px(oneAndHalfStep)} exceptions.`
}

/**
 * §3 as specified, with three bullets reworded to match the engine (approved by
 * the product owner): the engine locks the viewport and applies the safe area, and
 * it READS the TV focus — the model never declares a focus side, it only marks
 * the secondary group that follows it. A live run showed the model anchoring the
 * screen's primary CTAs to "give them focus", so the bullets say plainly that the
 * anchored group leaves the content flow and never holds initial focus.
 */
function macroLayoutLaw(): string {
  const { width, height } = FRAME.base
  return `### 3. MACRO-LAYOUT & ${width}×${height} CANVAS BOUNDARIES
When generating full screens or master containers, you must target the base HD canvas (the engine will handle the upscale switch).
* **Master Viewport:** The outermost container is strictly locked to **${px(width)} by ${px(height)}** by the engine — never try to size it yourself.
* **Safe Area Margins:** A strict **${px(FRAME.margin)} margin** applies on all outer edges (Top, Bottom, Left, Right). The engine applies it as the canvas safe area, so the outermost container adds no padding of its own. Content cannot breach this safe area.
* **Gutters:** The space between structural columns or module stacks must be exactly **${px(FRAME.gutter)}**.
* **Stretch:** The outermost container always stretches its children across the frame — its cross-axis alignment is "stretch". A module that belongs on the right or the left positions itself inside it (a row set to justify to the end or the start, or the component's own alignment prop); the outermost container itself never aligns to a side.
* **Dynamic Focus Alignment:** Master layouts do not use static center alignment. This is a TV canvas: something always holds focus, and the engine reads where it is — you never declare a focus side.
  * Initial focus lands on the first focusable element (a button or an input) in reading order — top to bottom, then left to right — within the screen's content. Keep the screen's primary actions (e.g. "Play", "Watch now", "Continue") in the content, placed where focus should start.
  * Optionally, mark ONE secondary floating cluster — quick actions or utility controls such as options, filters or help, never the screen's primary actions — with "anchor": true on a direct child of the outermost container. The engine lifts it out of the content flow into a bottom corner of the frame, and an anchored element never holds initial focus (except where the screen's level says focus starts on it — the third level's rounded button). If the focus is on the right — or nothing is focusable — the engine anchors it to the **Bottom-Right** (respecting the ${px(FRAME.margin)} margin); if the focus is on the left, it mirrors the alignment and anchors it to the **Left** margin, at the bottom.`
}

function registryLaw(): string {
  return `### 4. COMPONENT REGISTRY STRICTNESS
You must construct the UI using ONLY the provided Blueprint component definitions (which have been imported and mapped from our Storybook registry).
* Never use a prop the schema doesn't define — rely exclusively on the Blueprint schema properties provided in your context.

Compose, don't assume. Treat the components as building blocks and combine them freely to match what the user asks, including unconventional arrangements. Composition happens inside the frame, token, layer and focus laws, which always win. Placement rules on a component (which parent it needs, its slot order) still apply. A reference screen is a starting point, and the request can override it. If the request needs something the registry lacks, approximate it with the layout primitives and name what you approximated. Never invent a component.`
}

/**
 * The token tier rule — how tokens are tiered and which tier a screen may name. The
 * wording is `TOKEN_TIER_RULE`, the same text every manifest carries; the
 * validator rejects a blueprint that breaks it.
 */
function tokenTierLaw(): string {
  return `### 5. TOKEN TIERS
Design tokens are tiered, and the tier decides whether you may name a token. Follow this without exception:
* **Core:** ${TOKEN_TIER_RULE.core}
* **Semantic:** ${TOKEN_TIER_RULE.semantic}
* **Layout scale:** ${TOKEN_TIER_RULE.layout}
* A blueprint that names a core token or a raw value is rejected. When no semantic token matches a role exactly, pick the closest role — never fall back to a core token.`
}

/**
 * The layer rule (Camadas) — the rule the whole system rests on. The kernel states
 * it in general; the active system's models and levels follow in its binding.
 */
function screenLayerLaw(): string {
  return `### 6. SCREEN LAYERS — THE LAYER RULE (CAMADAS)
The whole design system rests on this rule. Every screen is three layers, bottom to top: **video → overlay → content**.
* **Your blueprint is the content layer only.** The engine paints the video and the overlay under it, so the outermost container stays transparent — never paint a full-screen background, gradient, shade or scrim yourself.
* **The overlay is never free-form.** Pick ONE layer model for the screen, and the engine paints that model's fixed combination of shades. Declare it next to "root": \`"screen": { "model": "<model id>", "level": <navigation level> }\`.
* **Pick the model by the screen type and by where its components sit.** A model that shades one side needs the content — and so the TV focus — on that side; a model without a side spans the frame.
* **Navigation levels limit what a screen shows.** A model fixes the level, and a level that shows one module holds exactly one content container as the only un-anchored child of the outermost container.
* **One document can hold several screens** (at most ${MAX_SCREENS}). The first is "root" (with its "screen"); every further one goes in \`"screens": [{ "id": "<unique id>", "name": "<short label>", "screen": { "model", "level" }, "root": {…} }]\`. When the user asks for options, versions or alternatives ("give me three"), return exactly that many screens, each a genuinely different composition of the same request — they need no links. Give every screen a short "name" ("Option A").
* **A prototype is clickable.** When the user asks for a flow, a prototype, or what happens when something is clicked, return one screen per step and put \`"goTo": "<screen id>"\` on the element (a button, a card, a menu item) that opens it. Links follow the levels: an element on a level N screen opens a level N+1 screen — Home (1) → the focused rail (2) → one interactivity (3) — never skipping a level, and every screen carries the model of its own level. Focus tells the pages apart: on Home the focus is on the main menu (the program button by default), and the interactivity buttons resting there link to the second-level screen (a focus on them IS that page); on the second level the focus is on one interactivity button, which links to the third-level screen; on the third level the focus starts on the rounded button. The home menu's buttons each own a rail: ${menuRolesLine()} On Home the focus starts on the ${screenLayersOf(SCREENFLOW_MANIFEST).menu?.initial ?? 'program'} button; when the Home rail sits on the left, the focus is on the left button that owns it. The rail holds exactly the interactivities the request asks for — one asked, one card; never pad it with a reference screen's other cards — and the second-level rail shows the same cards as the Home rail it is entered from. The main menu never carries a link. A back button (RoundedButton) always returns exactly one level (3 → 2, 2 → 1); a close button (CloseButton) closes everything and returns to Home — use each for its own job. Name the first screen's "id" next to "root" only when another screen links back to it. A screen nothing links to is an option, not a step. Options may differ in layer model — a left and a right variant, say — but every option stays on the level and the focus rule of the model it names.`
}

function menuRolesLine(): string {
  const menu = screenLayersOf(SCREENFLOW_MANIFEST).menu
  if (!menu) return ''
  return menu.roles.map((r) => `${r.name} (${menu.prop} "${r.item}") — its interactivity buttons sit on the ${r.side} and hold ${r.holds}`).join('; ') + '.'
}

/** The Generator's global kernel: identity + the six laws. No design-system specifics. */
export function buildGlobalKernel(): string {
  return [kernelIntro(), tokensLaw(), spatialLaw(), macroLayoutLaw(), registryLaw(), tokenTierLaw(), screenLayerLaw()].join('\n\n')
}

// ---------------------------------------------------------------------------
// Design-system binding — the laws mapped onto the active manifest's real names
// ---------------------------------------------------------------------------

function describeProp(p: PropSpec): string {
  const about = p.description ? ` — ${p.description}` : ''
  return `${propType(p)}${about}`
}

function propType(p: PropSpec): string {
  const def = JSON.stringify(p.default)
  if (p.options) return `      - ${p.name}: one of [${p.options.join(', ')}]${p.nullable ? ' or null' : ''} (default ${def})`
  if (p.tokenNames) {
    return `      - ${p.name}: a token name, one of [${p.tokenNames.join(', ')}] (default ${def})`
  }
  if (p.control === 'boolean') return `      - ${p.name}: boolean (default ${def})`
  if (p.control === 'number') {
    const rule = [
      p.step !== undefined ? `a multiple of ${p.step}` : '',
      p.min !== undefined && p.max !== undefined ? `from ${p.min} to ${p.max}` : '',
    ].filter(Boolean).join(' ')
    return `      - ${p.name}: number${rule ? `, ${rule}` : ''} (default ${def})`
  }
  if (p.control === 'list') {
    const count =
      p.min !== undefined && p.min === p.max ? `, exactly ${p.min}` : p.max !== undefined ? `, at most ${p.max}` : ''
    const item = p.fields ? `objects { ${p.fields.map((f) => `${f}: string`).join(', ')} }` : 'strings'
    return `      - ${p.name}: a JSON array of ${item}${count} (default ${def})`
  }
  // A text default is words on the screen — say so where the model reads the prop.
  const shown = typeof p.default === 'string' && p.default !== '' ? `, shown when left out — set "" for none` : ''
  return `      - ${p.name}: string (default ${def}${shown})`
}

/**
 * A component that takes its words as its React `children` (a Storybook import's
 * Text, Heading, Button) has a `children` PROP — not to be confused with a node's
 * "children", which is always a list of nodes.
 */
function textChildrenSpecifics(spec: ComponentSpec[]): string[] {
  if (!spec.some((c) => c.props.some((p) => p.name === 'children' && p.control !== 'list'))) return []
  return [
    `* **Text as children:** a component that shows words (its "children" prop says so below) takes them in that prop — "props": { "children": "Atualizado há 1 min" }. A node's own "children" is always a list of nodes, never text.`,
  ]
}

function describeComponent(c: ComponentSpec): string {
  return [
    `  <${c.type}> — ${c.summary}`,
    `    accepts children: ${
      c.slots
        ? `only ${c.slots.map((t) => `<${t}>`).join(', ')} — in that order, each at most once, any may be left out`
        : c.acceptsChildren
          ? 'yes'
          : 'no'
    }`,
    ...(c.parents ? [`    goes only directly inside: ${c.parents.map((t) => `<${t}>`).join(' or ')}`] : []),
    `    props:`,
    ...c.props.map(describeProp),
  ].join('\n')
}

function componentCatalogBrief(spec: ComponentSpec[]): string {
  return spec
    .map((c) => `  - <${c.type}>${c.acceptsChildren ? ' (container)' : ''}: ${c.summary}${listsBrief(c.props)}`)
    .join('\n')
}

/**
 * The planner reads no props, so a list prop — a capability like a carousel's
 * items — would stay invisible to it; name each one, its item shape and what it is for.
 */
function listsBrief(props: PropSpec[]): string {
  const lists = props.filter((p) => p.control === 'list' && p.name !== 'children')
  if (lists.length === 0) return ''
  const one = (p: PropSpec): string => {
    const items = p.fields ? `{${p.fields.join(', ')}}` : 'text'
    const about = p.description ? ` — ${p.description.split(/(?<=\.)\s/)[0]}` : ''
    return `${p.name} (${p.max !== undefined ? `up to ${p.max} ` : ''}${items} items)${about}`
  }
  return ` Lists: ${lists.map(one).join('; ')}`
}

/** Human label for a tier inside a token group. */
const TIER_LABEL = { semantic: 'semantic', layout: 'layout scale' } as const

/**
 * Every token name the active manifest lets a screen name, grouped (Phase 7B) and
 * split by token tier when the system is tiered. Core tokens are never listed.
 * Spacing is cut to the 8pt grid and shows each step's size, so the model can map
 * the kernel's pixel laws onto token names. Falls back to a plain admonition when
 * every group is empty.
 */
function tokenVocabulary(manifest: DesignSystemManifest): string {
  const named = (group: keyof ManifestTokens, names: string[]): string[] =>
    group !== 'spacing'
      ? names
      : onGridSpacingNames(manifest, names).map((name) => {
          const size = spacingPx(manifest, name)
          return size === null ? name : `${name} = ${px(size)}`
        })
  const groups: Array<keyof ManifestTokens> = ['spacing', 'colors', 'radius', 'shadow']
  const parts: string[] = []
  for (const group of groups) {
    const names = assignableTokenNames(manifest, group)
    if (names.length === 0) continue
    const tiered = names.filter((name) => tokenTier(manifest, group, name) !== undefined)
    if (tiered.length === 0) {
      const list = named(group, names)
      if (list.length > 0) parts.push(`${group} [${list.join(', ')}]`)
      continue
    }
    for (const tier of ['semantic', 'layout'] as const) {
      const list = named(group, names.filter((name) => tokenTier(manifest, group, name) === tier))
      if (list.length > 0) parts.push(`${group} — ${TIER_LABEL[tier]} [${list.join(', ')}]`)
    }
    const untiered = named(group, names.filter((name) => tokenTier(manifest, group, name) === undefined))
    if (untiered.length > 0) parts.push(`${group} [${untiered.join(', ')}]`)
  }
  return parts.length > 0 ? parts.join('; ') : 'named tokens only — never raw numbers'
}

/** How many core tokens a group holds, and the name families they share (`core-*`, `opacity-*`). */
function coreFamilies(manifest: DesignSystemManifest): { count: number; families: string[] } {
  const families = new Set<string>()
  let count = 0
  for (const [group, map] of Object.entries(tokenTierRule(manifest).tiers)) {
    for (const [name, tier] of Object.entries(map ?? {})) {
      if (tier !== 'core' || !(name in (manifest.tokens[group as keyof ManifestTokens] ?? {}))) continue
      count++
      families.add(`${name.split('-')[0]}-*`)
    }
  }
  return { count, families: [...families] }
}

/** Core colors that already have a semantic name — the translations the model most often needs. */
const MAX_TRANSLATIONS = 12
function coreTranslations(manifest: DesignSystemManifest): string[] {
  const out: string[] = []
  for (const name of tokenNames(manifest, 'colors')) {
    if (!isCoreToken(manifest, 'colors', name)) continue
    const twins = semanticEquivalents(manifest, 'colors', name)
    if (twins.length === 0 || twins.length > 2) continue
    out.push(`\`${name}\` → ${twins.map((t) => `\`${t}\``).join(' or ')}`)
    if (out.length === MAX_TRANSLATIONS) break
  }
  return out
}

/** The token tier rule mapped onto the active system's names — empty for an untiered system. */
function tokenTierSpecifics(manifest: DesignSystemManifest): string[] {
  const { count, families } = coreFamilies(manifest)
  if (count === 0) return []
  const tierRule = tokenTierRule(manifest)
  const lines = [
    `* **Token tiers:** only the semantic and layout-scale tokens listed above may be named. This system's ${count} core tokens (${families.join(', ')}) are never assigned.`,
  ]
  const translations = coreTranslations(manifest)
  if (translations.length > 0) {
    lines.push(`* **Core → semantic:** these core values already have a semantic name — name that instead: ${translations.join('; ')}.`)
  }
  const custom = (['core', 'semantic', 'layout'] as const).filter((tier) => tierRule.rule[tier] !== TOKEN_TIER_RULE[tier])
  for (const tier of custom) lines.push(`* **${tier} tier, as this system defines it:** ${tierRule.rule[tier]}`)
  return lines
}

/** The layer rule mapped onto the active system: its levels, its models, and the root props that obey it. */
function screenLayerSpecifics(manifest: DesignSystemManifest, container: string): string[] {
  const layers = screenLayersOf(manifest)
  if (layers.models.length === 0) return []
  const column = sidePropFor(manifest, { type: container })
  const row = sidePropFor(manifest, { type: container, props: { direction: 'horizontal' } })
  const clear = clearBackgroundFor(manifest, { type: container })
  const levelLimit = (maxModules: number | null, allowsAnchor: boolean): string =>
    `${maxModules === null ? 'No module limit' : `Shows at most ${maxModules} content module${maxModules === 1 ? '' : 's'}`}; ${allowsAnchor ? 'may anchor one cluster' : 'anchors nothing'}.`
  const lines = [
    `* **Layer rule:** ${layers.rule}`,
    `* **Navigation levels (screen.level):**`,
    ...layers.levels.map((l) => `  - ${l.level} · ${l.name} — ${l.rule} ${levelLimit(l.maxModules, l.allowsAnchor)}${l.rootEnd ? ' **The stack:** the outermost container is a column (direction vertical) that sits at the end of the frame (justify "end"), still stretching across it; a module that belongs on one side sits in a row inside it.' : ''}${l.initialFocus ? ` **Initial focus:** ${l.initialFocus.hint}` : ''}`),
    `* **Layer models (screen.model):**`,
    ...layers.models.map(
      (m) =>
        `  - "${m.id}" — ${m.name} · level ${m.level} · ${m.side ? `${m.side} side` : 'spans the frame'} · shades ${m.shades.join(' + ')}. ${m.use}`,
    ),
  ]
  if (column) {
    lines.push(
      `* **Content side:** under a right model the outermost <${container}> sets ${column.prop} "${column.values.right}"; under a left model, ${column.prop} "${column.values.left}"${
        row && row.prop !== column.prop ? ` (a horizontal <${container}>: ${row.prop})` : ''
      }.`,
    )
  }
  if (clear) {
    lines.push(`* **Transparent content layer:** the outermost <${container}> sets ${clear.prop} "${clear.clear}"; surfaces belong to the cards inside it.`)
  }
  return lines
}

/** The frame laws in the active system's own prop and token names — shared by both agents. */
/**
 * The focus rule in this system's own prop names: what puts an element in focus,
 * what rests it, and which components arrive focused unless told otherwise.
 */
function focusSpecific(manifest: DesignSystemManifest): string | null {
  const puts = new Map<string, string>()
  const rests = new Map<string, string>()
  const byDefault: string[] = []

  for (const component of Object.values(manifest.components)) {
    for (const prop of focusPropsFor(component)) {
      const resting = unfocusedValue(prop)
      const isState = prop.options?.includes('focus') ?? false
      puts.set(prop.name, isState ? `${prop.name} "focus"` : `${prop.name} (any value but ${JSON.stringify(resting)})`)
      rests.set(prop.name, `${prop.name} ${JSON.stringify(resting)}`)
      const fallback = defaultForProp(prop)
      const focusedByDefault = isState
        ? fallback === 'focus'
        : typeof fallback === 'string' && fallback !== resting
      if (focusedByDefault) {
        byDefault.push(`<${component.id}> focuses its ${JSON.stringify(fallback)} unless you set ${rests.get(prop.name)}`)
      }
    }
  }
  if (puts.size === 0) return null

  return (
    `* **One focus:** a TV screen has exactly one focused element — the one the viewer is on. ` +
    `${[...puts.values()].join(', or ')} puts an element in focus; every other element takes its resting value ` +
    `(${[...rests.values()].join(', ')}).` +
    (byDefault.length > 0 ? ` Note: ${byDefault.join('; ')}.` : '')
  )
}

function frameSpecifics(manifest: DesignSystemManifest, container: string): string[] {
  const component = manifest.components[container]
  const padding = component ? spacingPropFor(component, 'margin') : undefined
  const gap = component ? spacingPropFor(component, 'gutter') : undefined
  const zero = padding ? spacingNameForPx(manifest, allowedSpacingNames(manifest, padding), 0) : undefined
  const gutter = gap ? spacingNameForPx(manifest, allowedSpacingNames(manifest, gap), FRAME.gutter) : undefined
  const stretch = component ? stretchPropFor(component) : undefined
  const centering = component ? centeringPropsFor(component).filter((prop) => prop !== stretch).map((prop) => prop.name) : []

  return [
    `* **Safe area:** ${
      padding && zero
        ? `the outermost <${container}> sets ${padding.name} "${zero}".`
        : `the outermost <${container}> sets no padding.`
    }`,
    `* **Gutters:** ${
      gap && gutter
        ? `the outermost <${container}>, and any container whose children are all containers (stacked modules, columns), set ${gap.name} "${gutter}".`
        : `stacked modules and columns sit ${px(FRAME.gutter)} apart.`
    }`,
    `* **Stretch:** ${
      stretch
        ? `the outermost <${container}> keeps ${stretch.name} "stretch" — a module that belongs on one side positions itself inside it.`
        : `the outermost <${container}> spans the frame; a module that belongs on one side positions itself inside it.`
    }`,
    `* **No static centering:** ${
      centering.length > 0
        ? `the outermost <${container}> never sets ${centering.join(' or ')} to "center".`
        : `the outermost <${container}> is never centered.`
    }`,
    `* **Anchoring:** "anchor": true goes on a direct child of the outermost <${container}> — at most one per screen, and only on a secondary floating cluster, never the screen's primary actions — and never on the main menu or the interactivity buttons, which hold the focus in the content. The third level's rounded button is the one focus holder that is anchored.`,
    ...(focusSpecific(manifest) ? [focusSpecific(manifest) as string] : []),
  ]
}

function designSystemBinding(
  manifest: DesignSystemManifest,
  spec: ComponentSpec[],
  container: string,
): string {
  // A composed component (slots) or one of its parts (parents) is not a general
  // layout container, however it is built — the agent must not reach for it as one.
  const containers = spec.filter((c) => c.acceptsChildren && !c.slots && !c.parents).map((c) => c.type)
  const leaves = spec.filter((c) => !c.acceptsChildren).map((c) => c.type)
  const composed = spec.filter((c) => c.slots)

  return [
    `### 7. ACTIVE DESIGN SYSTEM — ${manifest.name} (v${manifest.version})`,
    `The laws above, mapped onto this system's registry and tokens.`,
    `* **Components:** only ${spec.map((c) => c.type).join(', ')}. The outermost container MUST be a <${container}>.`,
    `* **Layout:** there is no absolute positioning. Every layout is nested containers (${containers.join(', ') || container}), each a flexbox row or column: "gap" spaces its children, "padding" is inner spacing, "direction": "horizontal" makes a row. Only containers hold children${leaves.length ? `; ${leaves.join(', ')} are leaves` : ''}.`,
    ...textChildrenSpecifics(spec),
    `* **Defaults show:** a prop you leave out renders the default listed beside it — placeholder text included. Set a text prop to "" to leave its text off the screen.`,
    ...composed.map(
      (c) =>
        `* **<${c.type}> is composed:** its only children are ${c.slots!.map((t) => `<${t}>`).join(', ')} — in that order, each at most once. Leave out any it does not need; never put anything else inside it, and never use those parts anywhere but directly inside a <${c.type}>.`,
    ),
    `* **Tokens:** ${tokenVocabulary(manifest)}. A prop listed below as "a token name" takes exactly one of its listed names, or is omitted.`,
    ...tokenTierSpecifics(manifest),
    ...frameSpecifics(manifest, container),
    ...screenLayerSpecifics(manifest, container),
    `* **Structure:** group related content in a container, give cards a surface + border + radius + shadow, use text "variant" for hierarchy.`,
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

/**
 * The reference screens a design system ships with. Only the built-in one has
 * any: the templates are DTV screens, and offering them for an imported design
 * system would be describing components it does not have.
 */
/** The reference screens a design system ships — declared on the manifest itself, so an imported system carries its own. */
export function templatesFor(manifest: DesignSystemManifest): readonly ManifestScreenTemplate[] {
  return manifest.templates ?? []
}

/** The planner's template menu: what exists, and when each one is the right start. */
function templateSection(templates: readonly ManifestScreenTemplate[]): string {
  if (templates.length === 0) return ''
  return `# Reference screens

These screens are already built and already obey every law above. Start from one
whenever the request is that screen or a variation of it — it is faster and safer
than composing from nothing, and the next agent is given its JSON to adapt.

${templates.map((t) => `- ${t.id} — ${t.name}. ${t.when}`).join('\n')}

Name your choice on the first line, before the screen line:
Template: <id>, or "Template: none" when the request is a screen none of these fit.
Choosing one does not end your job: still write the plan, saying what changes.

`
}

/**
 * Step 1 of the pipeline — the Planner. Given the user's request and the "Product
 * Blueprint" (guidelines + a11y + layout patterns), it writes a short structural
 * plan in prose that already obeys the kernel's spatial and macro-layout laws. It
 * does NOT emit JSON.
 */
export function buildPlannerPrompt(
  manifest: DesignSystemManifest = SCREENFLOW_MANIFEST,
): string {
  const spec = getRegistrySpec(manifest)
  const container = rootContainerId(manifest) ?? spec.find((c) => c.acceptsChildren)?.type ?? 'Stack'
  const tokens = tokenVocabulary(manifest)
  const templates = templatesFor(manifest)
  const component = manifest.components[container]
  const padding = component ? spacingPropFor(component, 'margin') : undefined
  const gap = component ? spacingPropFor(component, 'gutter') : undefined
  const zero = padding ? spacingNameForPx(manifest, allowedSpacingNames(manifest, padding), 0) : undefined
  const gutter = gap ? spacingNameForPx(manifest, allowedSpacingNames(manifest, gap), FRAME.gutter) : undefined

  return `You are the PLANNER for ScreenFlow Studio. Given a request for a screen,
you write a short, concrete build plan — which components to use and how to nest
them in ${container}s. You do NOT write JSON or code; the next agent does that.

# Product Blueprint

Design system: ${manifest.name} (v${manifest.version})
- The primary layout tool is <${container}> — a flex row ("direction: horizontal")
  or column. Build every layout by nesting them. There is no absolute positioning,
  no grid.
- Design tokens available (spacing, colors, radius, shadow): ${tokens}.
- Components available:
${componentCatalogBrief(spec)}

# Global laws your plan must obey

${spatialLaw()}

${macroLayoutLaw()}

${tokenTierLaw()}

${screenLayerLaw()}

In ${manifest.name}:
${[...tokenTierSpecifics(manifest), ...frameSpecifics(manifest, container), ...screenLayerSpecifics(manifest, container)].join('\n')}

Accessibility rules:
- Heading hierarchy must be logical: one prominent heading as the screen title,
  smaller headings for sections, body/caption for supporting copy.
- Every button label must say what it does ("Create account", not "Submit").
- Use a muted tone for secondary text, never a faint custom color.
- Name every color by its role (primary text, elevated surface, default border),
  never by its look — the token tier rule allows semantic tokens only.

Common layout patterns:
- Card: a vertical container with padding, gap, a surface, a border, a radius and
  a small shadow.
- Equal columns / tiers: a horizontal container (align stretch) of child
  containers that each grow.
- Page header: a vertical container with a title then a muted body line.
- Section: a vertical container with a heading then its content.
- Floating action cluster: a horizontal container of secondary quick actions
  (options, help), anchored so it follows focus — never the screen's primary actions.

${templateSection(templates)}# Output format

First the template line, then the screen line — its layer model, its level, and why that model fits where
the content sits. Then a numbered list. Each line: the component, its role, its
nesting, and its text content; mark the anchored group. Keep it under ~15 lines.
When the request asks for several options, or for a clickable flow, plan every screen: a "Screens:" line
listing each one (its id, a short name, its model and level — and for a flow, which element links to which
screen), then the numbered list for each screen under its own "Screen <id>:" heading.
When you had to approximate something the registry lacks, or a law overrides part of the request, end the plan with a "Notes:" line saying so plainly, in the language of the request.
Example:

${templates.length > 0 ? 'Template: home\n' : ''}Screen: model "home", level 1 — a home screen whose content spans the frame.
1. Root ${container} (vertical, gap ${gutter ?? 'md'}, padding ${zero ?? 'none'}, align stretch, no background) — the content layer.
2.   Header ${container} (vertical, gap xs).
3.     A prominent title: "Choose your plan".
4.     A muted body line: "Switch or cancel at any time.".
5.   Card ${container} (vertical, gap md, padding lg, surface, bordered, radius lg, shadow sm).
6.     A heading: "Premium".
7.     A muted body line: "Every channel, live and on demand.".
8.     Primary button: "Start watching" — first focusable, so it holds initial focus.
9.   Help ${container} (horizontal, gap sm) — anchored, a secondary floating cluster.
10.    Ghost button: "Need help?".`
}

export type PromptOutputMode = 'tool' | 'json'

/**
 * Step 2 of the pipeline — the Generator's system prompt: the global kernel, then
 * the active design system's binding and component definitions, then the output
 * contract. It translates the Planner's prose into the strict Blueprint JSON.
 */
export function buildSystemPrompt(
  mode: PromptOutputMode = 'tool',
  manifest: DesignSystemManifest = SCREENFLOW_MANIFEST,
): string {
  const spec = getRegistrySpec(manifest)
  const container = rootContainerId(manifest) ?? spec.find((c) => c.acceptsChildren)?.type ?? 'Stack'

  const blueprint = `"version": 1,
  "screen": { "model": "<layer model id>", "level": <that model's level> },
  "root": { "type": "${container}", "props": { ... }, "children": [ ... ] }
  (only for several screens: "screens": [ { "id": "...", "name": "...", "screen": { ... }, "root": { ... } } ]),
  (only when there is something to tell the user: "notes": [ "..." ])`
  const output =
    mode === 'tool'
      ? `Return the Blueprint by calling the ${RENDER_TOOL_NAME} tool exactly once with:
{
  "blueprint": {
    ${blueprint.replaceAll('\n', '\n  ')}
  }
}`
      : `Respond with ONLY this JSON object and nothing else — no prose, no explanation,
no markdown fences:
{
  ${blueprint}
}`

  return `${buildGlobalKernel()}

${designSystemBinding(manifest, spec, container)}

# Components
${spec.map(describeComponent).join('\n\n')}

# Output
${output}
Omit props you don't need — defaults are applied. The document has exactly three
fields: "version", "screen" and "root" (plus "id"/"name" for the first screen and "screens" when the
request asks for several screens). Do not include an "id" field on any node —
besides "type", "props" and "children", the only node fields are "anchor" and "goTo".

Tell the user what they would otherwise not notice: when you approximated something the registry lacks, or a law overrode part of their request (focus starting somewhere other than where they asked, a level's one-module limit, a component that only goes inside another), add up to ${MAX_NOTES} short sentences to "notes" — a list of strings, in the language of the request. Say it plainly ("O mapa é aproximado por um cartão"). Omit "notes" when the result is exactly what was asked. Notes describe the result against the request — never your own corrections after a rejected attempt.`
}
