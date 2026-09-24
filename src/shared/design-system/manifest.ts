/**
 * Design System Manifest — the source of truth for ONE imported design system.
 *
 * The Canvas, the Property Inspector and the AI orchestrator all operate strictly
 * against the currently *active* manifest; none of them may reference a component,
 * prop value or token that the active manifest does not declare.
 *
 * The shape reconciles two things:
 *   - Storybook's `react-docgen` extraction format (per-prop `type` / `options` /
 *     `defaultValue` / `required`) — see `storybook-adapter.ts`
 *   - a top-level identity (`id` / `name` / `version`) and a semantic `tokens`
 *     dictionary that gets injected into the DOM as CSS custom properties
 *
 * This module is framework-free (no React, no DOM) so it can be imported by the
 * renderer, the interpreter AND the Electron main process.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** A prop's declared type, mirroring react-docgen's `type` node. */
export interface ManifestPropType {
  /** 'string' | 'boolean' | 'number' | 'enum' | 'node' | 'func' | 'object' | … */
  name: string
  /** The raw source annotation, when the extractor preserved it. */
  raw?: string
}

export type ManifestControlKind = 'text' | 'textarea' | 'select' | 'boolean' | 'number' | 'list'

export interface ManifestProp {
  name: string
  type: ManifestPropType
  required: boolean
  defaultValue?: unknown
  /**
   * Allowed values for an enum/union prop — this is where variant enums like
   * `['primary', 'secondary']` are captured. Drives both the Inspector `<Select>`
   * and the dynamically-compiled Zod enum.
   */
  options?: string[]
  description?: string
  /** When set, this prop's values come from a named token scale. */
  tokenGroup?: keyof ManifestTokens
  /** Inspector control hint. Inferred from `type` / `options` when omitted. */
  control?: ManifestControlKind
  /** It also takes `null` — for a focus prop, "focus is elsewhere". */
  nullable?: boolean
  /** For a number prop: the smallest value allowed. For a list (`array`): the fewest items. */
  min?: number
  /** For a number prop: the largest value allowed. For a list (`array`): the most items. */
  max?: number
  /** For a number prop: values must be a whole multiple of this (a grid step). */
  step?: number
}

export interface ManifestComponent {
  /** Stable key — also the `type` used on Blueprint nodes and CanvasNodes. */
  id: string
  name: string
  description: string
  category?: string
  /** Whether this component slot may contain child nodes. */
  acceptsChildren: boolean
  /**
   * The only components that may sit directly inside this one — in this order,
   * each at most once, and any of them may be left out. Absent: any child goes.
   */
  slots?: string[]
  /** The only components this one may sit directly inside. Absent: anywhere. */
  parents?: string[]
  props: Record<string, ManifestProp>
  /** Storybook module export path — metadata only for now. */
  storybookPath?: string
}

/** Semantic token dictionary — maps to CSS custom properties at runtime. */
export interface ManifestTokens {
  colors: Record<string, string>
  spacing: Record<string, string>
  typography: Record<string, string>
  radius?: Record<string, string>
  shadow?: Record<string, string>
}

/**
 * The token tier rule. Tokens live in tiers, and the tier decides who may name a token:
 *   - `core` holds a raw value (a hex, a px). Only other tokens point at it —
 *     never a component, never a generated screen.
 *   - `semantic` names an intent (primary text, elevated surface) and aliases core.
 *     It is what components and screens name.
 *   - `layout` is a layout scale (the grid spacing steps, the radius steps), named
 *     only by layout props: padding, gap, corner radius.
 * Enforced in code by `npm run tokens:audit` and, for generated screens, by
 * `manifest-zod.ts` (a core token is rejected) and `promptSpec.ts`.
 */
export type TokenTier = 'core' | 'semantic' | 'layout'

export const TOKEN_TIERS: readonly TokenTier[] = ['core', 'semantic', 'layout']

/** What each tier holds and who may name it — the words the agents are given. */
export const TOKEN_TIER_RULE: Record<TokenTier, string> = {
  core: 'Raw values (a hex color, a pixel size). They exist only so other tokens can point at them. Never assign one — not even when its value is exactly what you want.',
  semantic:
    'Intent (primary text, elevated surface, default border, live status, focus glow), each an alias to a core value. Every color you assign is a semantic token chosen by the element’s role, never by its look: white text is the primary-text token.',
  layout:
    'The grid spacing steps and the radius steps. Assign them only to layout props — padding, gap, corner radius.',
}

export type TokenTierMap = Partial<Record<keyof ManifestTokens, Record<string, TokenTier>>>

export interface ManifestTokenTiers {
  /** The rule, tier by tier, as the agents read it. */
  rule: Record<TokenTier, string>
  /** The tier of every tiered token, per group. A token missing here has no tier and is assignable. */
  tiers: TokenTierMap
}

/**
 * The layer rule (Camadas) — the rule the whole system is built on. Every screen
 * is three layers, bottom to top: the video, an overlay, and the content. The
 * overlay is never free-form: each screen type has one fixed combination of shade
 * pieces, and each screen sits on a navigation level that limits what it shows.
 * The DTV rule itself lives in `screen-layers.ts`.
 */
export type ScreenLayer = 'video' | 'overlay' | 'content'

export const SCREEN_LAYER_STACK: readonly ScreenLayer[] = ['video', 'overlay', 'content']

/** The shade pieces an overlay combination is built from (Figma: Sombras). */
export type ShadeId = 'scrim' | 'bottom' | 'bottom-right' | 'bottom-left' | 'right' | 'left' | 'top-right'

export const SHADE_IDS: readonly ShadeId[] = [
  'scrim',
  'bottom',
  'bottom-right',
  'bottom-left',
  'right',
  'left',
  'top-right',
]

export type NavigationLevel = 0 | 1 | 2 | 3

export const NAVIGATION_LEVELS: readonly NavigationLevel[] = [0, 1, 2, 3]

export type ScreenSide = 'left' | 'right'

export interface ManifestNavigationLevel {
  level: NavigationLevel
  name: string
  /** What a screen on this level shows, as the agents read it. */
  rule: string
  /** The most content modules (un-anchored children of the root) it shows; null for no limit. */
  maxModules: number | null
  /** Whether it may anchor a floating cluster. */
  allowsAnchor: boolean
  /**
   * Where the TV focus starts on a screen of this level — the page is told by its
   * focus (focus on the channel button = Home, on a rail card = the second level,
   * on the rounded button = the third). Absent: the level says nothing about focus.
   */
  initialFocus?: ManifestInitialFocus
}

export interface ManifestInitialFocus {
  /** The components that may hold the focus (any one of them). */
  on: string[]
  /** The value its focus prop must have, when the component has several focusable parts (a menu's `focusedItem`). */
  value?: string
  /** The rule, as the agents read it. */
  hint: string
  /** The screen must contain one of `on` — a level whose page is told by it (the second and third levels). */
  required?: boolean
}

export interface ManifestScreenModel {
  /** What a blueprint names in `screen.model`. */
  id: string
  name: string
  level: NavigationLevel
  /** The side its content sits on, when its shades favour one. */
  side?: ScreenSide
  /** Its shade pieces, bottom to top. */
  shades: ShadeId[]
  /** When to pick it, as the agents read it. */
  use: string
}

export interface ManifestScreenLayers {
  /** The rule, as the agents read it. */
  rule: string
  stack: ScreenLayer[]
  /** The CSS custom property that paints each shade — a semantic token. */
  shades: Record<ShadeId, string>
  levels: ManifestNavigationLevel[]
  models: ManifestScreenModel[]
}

/** What a screen declares under the layer rule: its model and its navigation level. */
export interface ScreenSpec {
  model: string
  level: NavigationLevel
}

/**
 * A reference screen the agent can start a prototype from — `SCREEN_TEMPLATES`
 * (`src/shared/templates`) for the built-in system, or whatever a Storybook
 * export carries under `templates`. `blueprint` is a `BlueprintDocument`, kept
 * untyped here so this module stays free of a dependency on `shared/blueprint`
 * (which itself depends on this one, for `ScreenSpec`); the importer validates
 * it with `validateBlueprintAgainstManifest` before keeping it, and
 * `ScreenTemplate` (`shared/templates/types.ts`) is the typed shape everywhere
 * that already has a `BlueprintDocument` to work with. Typed as the bare
 * minimum (`object`, not `Record<string, unknown>`) so a real `BlueprintDocument`
 * — which has no index signature — is assignable to it without a cast.
 */
export interface ManifestScreenTemplate {
  /** Stable id — the planner names it on a `Template:` line. */
  id: string
  name: string
  /** One line the planner reads to choose between templates. */
  when: string
  blueprint: object
}

export interface DesignSystemManifest {
  id: string
  name: string
  version: string
  tokens: ManifestTokens
  components: Record<string, ManifestComponent>
  /**
   * The token tier rule for this system's tokens. Optional so manifests saved before it
   * existed still load; without it, tiers are inferred from `core` / `semantic`
   * segments in the token names (`tokenTierRule`).
   */
  tokenTiers?: ManifestTokenTiers
  /**
   * The layer rule for this system's screens. Optional; without it, the DTV rule
   * applies (`screenLayersOf` in `screen-layers.ts`).
   */
  screenLayers?: ManifestScreenLayers
  /**
   * Reference screens for the Planner to start from (`templatesFor` reads this).
   * Optional; an imported system with none composes every screen from scratch.
   */
  templates?: readonly ManifestScreenTemplate[]
}

// ---------------------------------------------------------------------------
// Runtime validation — used for IPC payloads and imported files
// ---------------------------------------------------------------------------

// Bounds so a hostile or oversized manifest can't bloat the IPC channel or the
// LLM prompt. Generous enough for real Storybook libraries.
const MAX_COMPONENTS = 200
const MAX_PROPS_PER_COMPONENT = 60
const MAX_OPTIONS = 100
const MAX_STR = 4000

const idSchema = z.string().min(1).max(120)
const shortStr = z.string().max(200)

const propTypeSchema: z.ZodType<ManifestPropType> = z
  .object({
    name: z.string().min(1).max(120),
    raw: z.string().max(MAX_STR).optional(),
  })
  .strict()

const propSchema: z.ZodType<ManifestProp> = z
  .object({
    name: z.string().min(1).max(120),
    type: propTypeSchema,
    required: z.boolean(),
    defaultValue: z.unknown().optional(),
    options: z.array(z.string().max(200)).max(MAX_OPTIONS).optional(),
    description: z.string().max(MAX_STR).optional(),
    tokenGroup: z.enum(['colors', 'spacing', 'typography', 'radius', 'shadow']).optional(),
    control: z.enum(['text', 'textarea', 'select', 'boolean', 'number', 'list']).optional(),
    nullable: z.boolean().optional(),
    min: z.number().finite().optional(),
    max: z.number().finite().optional(),
    step: z.number().finite().positive().optional(),
  })
  .strict()

const componentSchema: z.ZodType<ManifestComponent> = z
  .object({
    id: idSchema,
    name: shortStr,
    description: z.string().max(MAX_STR),
    category: shortStr.optional(),
    acceptsChildren: z.boolean(),
    slots: z.array(idSchema).max(MAX_COMPONENTS).optional(),
    parents: z.array(idSchema).max(MAX_COMPONENTS).optional(),
    props: z.record(propSchema).refine((p) => Object.keys(p).length <= MAX_PROPS_PER_COMPONENT, {
      message: `a component may declare at most ${MAX_PROPS_PER_COMPONENT} props`,
    }),
    storybookPath: z.string().max(MAX_STR).optional(),
  })
  .strict()

const tokenGroupSchema = z.record(z.string().max(MAX_STR))

const tokensSchema: z.ZodType<ManifestTokens> = z
  .object({
    colors: tokenGroupSchema,
    spacing: tokenGroupSchema,
    typography: tokenGroupSchema,
    radius: tokenGroupSchema.optional(),
    shadow: tokenGroupSchema.optional(),
  })
  .strict()

const tierSchema = z.enum(['core', 'semantic', 'layout'])

const tokenTiersSchema: z.ZodType<ManifestTokenTiers> = z
  .object({
    rule: z
      .object({
        core: z.string().max(MAX_STR),
        semantic: z.string().max(MAX_STR),
        layout: z.string().max(MAX_STR),
      })
      .strict(),
    tiers: z
      .object({
        colors: z.record(tierSchema).optional(),
        spacing: z.record(tierSchema).optional(),
        typography: z.record(tierSchema).optional(),
        radius: z.record(tierSchema).optional(),
        shadow: z.record(tierSchema).optional(),
      })
      .strict(),
  })
  .strict()

const MAX_MODELS = 40
const MAX_TEMPLATES = 40

const manifestScreenTemplateSchema: z.ZodType<ManifestScreenTemplate> = z
  .object({
    id: idSchema,
    name: shortStr,
    when: z.string().min(1).max(400),
    blueprint: z.record(z.unknown()),
  })
  .strict()

const levelSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])
const shadeSchema = z.enum(SHADE_IDS as [ShadeId, ...ShadeId[]])

const screenLayersSchema: z.ZodType<ManifestScreenLayers> = z
  .object({
    rule: z.string().max(MAX_STR),
    stack: z.array(z.enum(SCREEN_LAYER_STACK as [ScreenLayer, ...ScreenLayer[]])).max(SCREEN_LAYER_STACK.length),
    shades: z
      .object(Object.fromEntries(SHADE_IDS.map((id) => [id, z.string().min(1).max(200)])) as Record<ShadeId, z.ZodString>)
      .strict(),
    levels: z
      .array(
        z
          .object({
            level: levelSchema,
            name: shortStr,
            rule: z.string().max(MAX_STR),
            maxModules: z.number().int().min(0).nullable(),
            allowsAnchor: z.boolean(),
            initialFocus: z
              .object({
                on: z.array(idSchema).min(1).max(8),
                value: shortStr.optional(),
                hint: z.string().max(MAX_STR),
                required: z.boolean().optional(),
              })
              .strict()
              .optional(),
          })
          .strict(),
      )
      .max(NAVIGATION_LEVELS.length),
    models: z
      .array(
        z
          .object({
            id: idSchema,
            name: shortStr,
            level: levelSchema,
            side: z.enum(['left', 'right']).optional(),
            shades: z.array(shadeSchema).min(1).max(SHADE_IDS.length),
            use: z.string().max(MAX_STR),
          })
          .strict(),
      )
      .max(MAX_MODELS),
  })
  .strict()
  .superRefine((layers, ctx) => {
    const ids = new Set<string>()
    const levels = new Set(layers.levels.map((l) => l.level))
    for (const model of layers.models) {
      if (ids.has(model.id)) ctx.addIssue({ code: 'custom', message: `duplicate layer model "${model.id}"` })
      ids.add(model.id)
      if (!levels.has(model.level)) {
        ctx.addIssue({ code: 'custom', message: `layer model "${model.id}" is on level ${model.level}, which the rule doesn't define` })
      }
    }
  })

/** Manifests saved before the rename carried the token tiers under `layers`. */
function migrateLegacyKeys(value: unknown): unknown {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return value
  const { layers, ...rest } = value as Record<string, unknown>
  if (layers === undefined || 'tokenTiers' in rest) return value
  return { ...rest, tokenTiers: layers }
}

export const manifestZodSchema: z.ZodType<DesignSystemManifest> = z.preprocess(
  migrateLegacyKeys,
  z
    .object({
      id: idSchema,
      name: shortStr,
      version: z.string().min(1).max(60),
      tokens: tokensSchema,
      tokenTiers: tokenTiersSchema.optional(),
      screenLayers: screenLayersSchema.optional(),
      templates: z.array(manifestScreenTemplateSchema).max(MAX_TEMPLATES).optional(),
      components: z
        .record(componentSchema)
        .refine((c) => Object.keys(c).length >= 1, { message: 'a manifest needs at least one component' })
        .refine((c) => Object.keys(c).length <= MAX_COMPONENTS, {
          message: `a manifest may declare at most ${MAX_COMPONENTS} components`,
        }),
    })
    .strict(),
) as z.ZodType<DesignSystemManifest>

export const screenSpecSchema: z.ZodType<ScreenSpec> = z
  .object({ model: z.string().min(1).max(120), level: levelSchema })
  .strict()

export function isDesignSystemManifest(value: unknown): value is DesignSystemManifest {
  return manifestZodSchema.safeParse(value).success
}

// ---------------------------------------------------------------------------
// Small shared helpers
// ---------------------------------------------------------------------------

/** Infer the Inspector control for a prop when the manifest didn't specify one. */
export function inferControl(prop: ManifestProp): ManifestControlKind {
  if (prop.control) return prop.control
  if (prop.options && prop.options.length > 0) return 'select'
  switch (prop.type.name) {
    case 'boolean':
      return 'boolean'
    case 'number':
      return 'number'
    case 'array':
      return 'list'
    default:
      return 'text'
  }
}

/**
 * A prop's default: its declared one. An optional prop that declares none stays
 * unset — the component then does what it does without it (no background, its
 * own internal default) — and only a required one gets a type-appropriate stand-in.
 */
export function defaultForProp(prop: ManifestProp): unknown {
  if (prop.defaultValue !== undefined) return prop.defaultValue
  if (!prop.required) return undefined
  if (prop.options && prop.options.length > 0) return prop.options[0]
  switch (prop.type.name) {
    case 'boolean':
      return false
    case 'number':
      return 0
    case 'array':
      return []
    default:
      return ''
  }
}

/** The full default props object for a component (every declared prop present). */
export function deriveDefaultProps(component: ManifestComponent): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const prop of Object.values(component.props)) {
    const value = defaultForProp(prop)
    if (value !== undefined) out[prop.name] = value
  }
  return out
}

/** Prettify a prop name for a control label: "helpText" -> "Help text". */
export function propLabel(prop: ManifestProp): string {
  const spaced = prop.name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/** The token names available in a manifest's group, e.g. `['brand', 'ink', …]`. */
export function tokenNames(
  manifest: DesignSystemManifest,
  group: keyof ManifestTokens,
): string[] {
  return Object.keys(manifest.tokens[group] ?? {})
}

/** Total count of tokens across every group. */
export function tokenCount(tokens: ManifestTokens): number {
  return (
    Object.keys(tokens.colors).length +
    Object.keys(tokens.spacing).length +
    Object.keys(tokens.typography).length +
    Object.keys(tokens.radius ?? {}).length +
    Object.keys(tokens.shadow ?? {}).length
  )
}

/** The component every Blueprint root must be — the first container in the manifest. */
// ---------------------------------------------------------------------------
// Placement — which component may sit directly inside which
// ---------------------------------------------------------------------------

/**
 * Why a <childType> can't sit directly inside a <parentType>, or null when it can.
 * One rule for the validator, the interpreter, the palette and the agent's prompt,
 * so none of them can disagree about a composed component's structure.
 */
export function placementError(
  manifest: DesignSystemManifest,
  parentType: string,
  childType: string,
): string | null {
  const parent = manifest.components[parentType]
  const child = manifest.components[childType]
  if (!parent || !child) return null
  return placementProblem(parent, child)
}

/** `placementError` for two components already in hand (the palette has registry entries, not a manifest). */
export function placementProblem(parent: ManifestComponent, child: ManifestComponent): string | null {
  if (!parent.acceptsChildren) return `<${parent.id}> cannot have children.`
  if (parent.slots && !parent.slots.includes(child.id)) {
    return `<${parent.id}> only takes ${slotList(parent.slots)}, not <${child.id}>.`
  }
  if (child.parents && !child.parents.includes(parent.id)) {
    return `<${child.id}> only goes directly inside ${child.parents.map((p) => `<${p}>`).join(' or ')}, not <${parent.id}>.`
  }
  return null
}

/** Whether one more <child> can go into <parent> as its children stand now — placement, and at most one of each slot. */
export function canAddChild(parent: ManifestComponent, child: ManifestComponent, siblingTypes: string[]): boolean {
  if (placementProblem(parent, child)) return false
  return !(parent.slots && siblingTypes.includes(child.id))
}

/** Problems with the ORDER and COUNT of a slotted component's children (types already allowed). */
export function slotOrderErrors(component: ManifestComponent, childTypes: string[]): string[] {
  const slots = component.slots
  if (!slots) return []
  const errors: string[] = []
  const seen = new Set<string>()
  let last = -1
  for (const type of childTypes) {
    const at = slots.indexOf(type)
    if (at === -1) continue
    if (seen.has(type)) errors.push(`<${component.id}> takes at most one <${type}>.`)
    else if (at < last) errors.push(`<${component.id}>'s children go in the order ${slotList(slots)}; <${type}> is out of place.`)
    seen.add(type)
    last = Math.max(last, at)
  }
  return errors
}

/** Where a new <childType> belongs among a slotted parent's current children, so order holds. */
export function slotInsertIndex(component: ManifestComponent, siblingTypes: string[], childType: string): number {
  const slots = component.slots
  if (!slots) return siblingTypes.length
  const rank = slots.indexOf(childType)
  const after = siblingTypes.findIndex((type) => slots.indexOf(type) > rank)
  return after === -1 ? siblingTypes.length : after
}

function slotList(slots: string[]): string {
  return `${slots.map((s) => `<${s}>`).join(', ')} (in that order, each at most once — any may be left out)`
}

export function rootContainerId(manifest: DesignSystemManifest): string | null {
  const entries = Object.values(manifest.components)
  const stack = entries.find((c) => c.id === 'Stack' && c.acceptsChildren)
  if (stack) return stack.id
  // Never a component that only lives inside another, like a card's zones.
  return entries.find((c) => c.acceptsChildren && !c.parents)?.id ?? null
}

// ---------------------------------------------------------------------------
// The token tier rule
// ---------------------------------------------------------------------------

export const TOKEN_GROUPS: ReadonlyArray<keyof ManifestTokens> = [
  'colors',
  'spacing',
  'typography',
  'radius',
  'shadow',
]

const LAYOUT_GROUPS: ReadonlySet<keyof ManifestTokens> = new Set(['spacing', 'radius'])
const SEMANTIC_SEGMENT = /(^|-)semantic(-|$)/
const CORE_SEGMENT = /(^|-)(core|primitives?|palette|ref)(-|$)/

/** The tier a raw-value token takes in `group`: spacing and radius steps stay nameable by layout props. */
export function rawTierFor(group: keyof ManifestTokens): TokenTier {
  return LAYOUT_GROUPS.has(group) ? 'layout' : 'core'
}

/**
 * Tiers read from token names alone, for manifests saved without `tokenTiers`. Only a
 * group that has semantic tokens gets tiers, so a system without a semantic layer
 * stays unrestricted.
 */
export function inferTokenTiers(tokens: ManifestTokens): TokenTierMap {
  const out: TokenTierMap = {}
  for (const group of TOKEN_GROUPS) {
    const names = Object.keys(tokens[group] ?? {})
    if (!names.some((name) => SEMANTIC_SEGMENT.test(name))) continue
    const tiers: Record<string, TokenTier> = {}
    for (const name of names) {
      if (SEMANTIC_SEGMENT.test(name)) tiers[name] = 'semantic'
      else if (CORE_SEGMENT.test(name)) tiers[name] = rawTierFor(group)
    }
    out[group] = tiers
  }
  return out
}

const inferredTiers = new WeakMap<DesignSystemManifest, ManifestTokenTiers>()

/** The manifest's token tier rule: the declared one, or one inferred from its token names. */
export function tokenTierRule(manifest: DesignSystemManifest): ManifestTokenTiers {
  if (manifest.tokenTiers) return manifest.tokenTiers
  let tiers = inferredTiers.get(manifest)
  if (!tiers) {
    tiers = { rule: TOKEN_TIER_RULE, tiers: inferTokenTiers(manifest.tokens) }
    inferredTiers.set(manifest, tiers)
  }
  return tiers
}

export function tokenTier(
  manifest: DesignSystemManifest,
  group: keyof ManifestTokens,
  name: string,
): TokenTier | undefined {
  return tokenTierRule(manifest).tiers[group]?.[name]
}

export function isCoreToken(
  manifest: DesignSystemManifest,
  group: keyof ManifestTokens,
  value: unknown,
): boolean {
  return typeof value === 'string' && tokenTier(manifest, group, value) === 'core'
}

/** The names a prop drawing from `group` may take under the token tier rule: every token but core. */
export function assignableTokenNames(
  manifest: DesignSystemManifest,
  group: keyof ManifestTokens,
): string[] {
  return tokenNames(manifest, group).filter((name) => tokenTier(manifest, group, name) !== 'core')
}

/** The semantic tokens holding exactly `name`'s value — what to name instead of a core token. */
export function semanticEquivalents(
  manifest: DesignSystemManifest,
  group: keyof ManifestTokens,
  name: string,
): string[] {
  const dict = manifest.tokens[group] ?? {}
  const value = dict[name]
  if (value === undefined) return []
  const same = (other: string): boolean => other.trim().toLowerCase() === value.trim().toLowerCase()
  return Object.keys(dict).filter(
    (other) => other !== name && tokenTier(manifest, group, other) === 'semantic' && same(dict[other]),
  )
}
