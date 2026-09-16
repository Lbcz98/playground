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

export type ManifestControlKind = 'text' | 'textarea' | 'select' | 'boolean' | 'number'

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
}

export interface ManifestComponent {
  /** Stable key — also the `type` used on Blueprint nodes and CanvasNodes. */
  id: string
  name: string
  description: string
  category?: string
  /** Whether this component slot may contain child nodes. */
  acceptsChildren: boolean
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
 * The layer rule. Tokens live in tiers, and the tier decides who may name a token:
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
export const TOKEN_LAYER_RULE: Record<TokenTier, string> = {
  core: 'Raw values (a hex color, a pixel size). They exist only so other tokens can point at them. Never assign one — not even when its value is exactly what you want.',
  semantic:
    'Intent (primary text, elevated surface, default border, live status, focus glow), each an alias to a core value. Every color you assign is a semantic token chosen by the element’s role, never by its look: white text is the primary-text token.',
  layout:
    'The grid spacing steps and the radius steps. Assign them only to layout props — padding, gap, corner radius.',
}

export type TokenTierMap = Partial<Record<keyof ManifestTokens, Record<string, TokenTier>>>

export interface ManifestTokenLayers {
  /** The rule, tier by tier, as the agents read it. */
  rule: Record<TokenTier, string>
  /** The tier of every tiered token, per group. A token missing here has no tier and is assignable. */
  tiers: TokenTierMap
}

export interface DesignSystemManifest {
  id: string
  name: string
  version: string
  tokens: ManifestTokens
  components: Record<string, ManifestComponent>
  /**
   * The layer rule for this system's tokens. Optional so manifests saved before it
   * existed still load; without it, tiers are inferred from `core` / `semantic`
   * segments in the token names (`tokenLayers`).
   */
  layers?: ManifestTokenLayers
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
    control: z.enum(['text', 'textarea', 'select', 'boolean', 'number']).optional(),
  })
  .strict()

const componentSchema: z.ZodType<ManifestComponent> = z
  .object({
    id: idSchema,
    name: shortStr,
    description: z.string().max(MAX_STR),
    category: shortStr.optional(),
    acceptsChildren: z.boolean(),
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

const layersSchema: z.ZodType<ManifestTokenLayers> = z
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

export const manifestZodSchema: z.ZodType<DesignSystemManifest> = z
  .object({
    id: idSchema,
    name: shortStr,
    version: z.string().min(1).max(60),
    tokens: tokensSchema,
    layers: layersSchema.optional(),
    components: z
      .record(componentSchema)
      .refine((c) => Object.keys(c).length >= 1, { message: 'a manifest needs at least one component' })
      .refine((c) => Object.keys(c).length <= MAX_COMPONENTS, {
        message: `a manifest may declare at most ${MAX_COMPONENTS} components`,
      }),
  })
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
    default:
      return 'text'
  }
}

/** A safe default value for a prop — its declared default, else a type-appropriate zero. */
export function defaultForProp(prop: ManifestProp): unknown {
  if (prop.defaultValue !== undefined) return prop.defaultValue
  if (prop.options && prop.options.length > 0) return prop.options[0]
  switch (prop.type.name) {
    case 'boolean':
      return false
    case 'number':
      return 0
    default:
      return ''
  }
}

/** The full default props object for a component (every declared prop present). */
export function deriveDefaultProps(component: ManifestComponent): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const prop of Object.values(component.props)) out[prop.name] = defaultForProp(prop)
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
export function rootContainerId(manifest: DesignSystemManifest): string | null {
  const entries = Object.values(manifest.components)
  const stack = entries.find((c) => c.id === 'Stack' && c.acceptsChildren)
  if (stack) return stack.id
  return entries.find((c) => c.acceptsChildren)?.id ?? null
}

// ---------------------------------------------------------------------------
// The layer rule
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
 * Tiers read from token names alone, for manifests saved without `layers`. Only a
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

const inferredLayers = new WeakMap<DesignSystemManifest, ManifestTokenLayers>()

/** The manifest's layer rule: the declared one, or one inferred from its token names. */
export function tokenLayers(manifest: DesignSystemManifest): ManifestTokenLayers {
  if (manifest.layers) return manifest.layers
  let layers = inferredLayers.get(manifest)
  if (!layers) {
    layers = { rule: TOKEN_LAYER_RULE, tiers: inferTokenTiers(manifest.tokens) }
    inferredLayers.set(manifest, layers)
  }
  return layers
}

export function tokenTier(
  manifest: DesignSystemManifest,
  group: keyof ManifestTokens,
  name: string,
): TokenTier | undefined {
  return tokenLayers(manifest).tiers[group]?.[name]
}

export function isCoreToken(
  manifest: DesignSystemManifest,
  group: keyof ManifestTokens,
  value: unknown,
): boolean {
  return typeof value === 'string' && tokenTier(manifest, group, value) === 'core'
}

/** The names a prop drawing from `group` may take under the layer rule: every token but core. */
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
