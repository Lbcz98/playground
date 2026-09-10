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

export interface DesignSystemManifest {
  id: string
  name: string
  version: string
  tokens: ManifestTokens
  components: Record<string, ManifestComponent>
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

export const manifestZodSchema: z.ZodType<DesignSystemManifest> = z
  .object({
    id: idSchema,
    name: shortStr,
    version: z.string().min(1).max(60),
    tokens: tokensSchema,
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
