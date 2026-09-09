/**
 * Component catalog — the pure-data half of the design system.
 *
 * Everything here is framework-agnostic (Zod schemas, token enums, metadata) so it
 * can be imported by the renderer, the interpreter AND the Electron main process
 * (which builds the LLM system prompt from it). The React `render` functions live
 * in `registry.tsx`, which composes this catalog with them.
 *
 * The registry is a CLOSED set: adding a component = adding one entry here.
 */

import { z } from 'zod'
import {
  BUTTON_VARIANTS,
  CONTROL_SIZES,
  RADIUS_TOKENS,
  SHADOW_TOKENS,
  SPACE_TOKENS,
  STACK_ALIGN,
  STACK_DIRECTIONS,
  STACK_JUSTIFY,
  SURFACE_TOKENS,
  TEXT_TONES,
  TEXT_VARIANTS,
} from './tokens'

// ---------------------------------------------------------------------------
// Inspector control metadata (drives the properties panel UI)
// ---------------------------------------------------------------------------

export type Control =
  | { kind: 'text'; label: string }
  | { kind: 'textarea'; label: string }
  | { kind: 'boolean'; label: string }
  | { kind: 'select'; label: string; options: readonly string[] }

export type ComponentCategory = 'layout' | 'content' | 'form'

export interface CatalogEntry {
  type: string
  label: string
  category: ComponentCategory
  /** One-line purpose, used in the LLM system prompt. */
  summary: string
  /** Whether this component slot may contain child nodes. */
  acceptsChildren: boolean
  schema: z.ZodTypeAny
  defaultProps: Record<string, unknown>
  controls: Record<string, Control>
}

const spaceEnum = z.enum(SPACE_TOKENS)
const radiusEnum = z.enum(RADIUS_TOKENS)
const shadowEnum = z.enum(SHADOW_TOKENS)

// ===========================================================================
// Schemas — `.strict()` so any unknown prop is rejected, every value a token.
// ===========================================================================

export const stackSchema = z
  .object({
    direction: z.enum(STACK_DIRECTIONS).default('vertical'),
    gap: spaceEnum.default('md'),
    padding: spaceEnum.default('none'),
    align: z.enum(STACK_ALIGN).default('stretch'),
    justify: z.enum(STACK_JUSTIFY).default('start'),
    surface: z.enum(SURFACE_TOKENS).default('none'),
    radius: radiusEnum.default('none'),
    shadow: shadowEnum.default('none'),
    bordered: z.boolean().default(false),
    grow: z.boolean().default(false),
  })
  .strict()
export type StackProps = z.infer<typeof stackSchema>

export const textSchema = z
  .object({
    content: z.string().default('Text'),
    variant: z.enum(TEXT_VARIANTS).default('body'),
    tone: z.enum(TEXT_TONES).default('default'),
    align: z.enum(['start', 'center', 'end']).default('start'),
  })
  .strict()
export type TextProps = z.infer<typeof textSchema>

export const buttonSchema = z
  .object({
    label: z.string().default('Button'),
    variant: z.enum(BUTTON_VARIANTS).default('primary'),
    size: z.enum(CONTROL_SIZES).default('md'),
    fullWidth: z.boolean().default(false),
    disabled: z.boolean().default(false),
  })
  .strict()
export type ButtonProps = z.infer<typeof buttonSchema>

export const inputSchema = z
  .object({
    label: z.string().default(''),
    placeholder: z.string().default('Enter text'),
    size: z.enum(CONTROL_SIZES).default('md'),
    state: z.enum(['default', 'error']).default('default'),
    helpText: z.string().default(''),
  })
  .strict()
export type InputProps = z.infer<typeof inputSchema>

// ===========================================================================
// Catalog
// ===========================================================================

export const Catalog = {
  Stack: {
    type: 'Stack',
    label: 'Stack',
    category: 'layout',
    summary:
      'The only layout primitive. A flexbox row or column with token-based gap and padding. Nest Stacks to build any layout — there is no absolute positioning.',
    acceptsChildren: true,
    schema: stackSchema,
    defaultProps: stackSchema.parse({}),
    controls: {
      direction: { kind: 'select', label: 'Direction', options: STACK_DIRECTIONS },
      gap: { kind: 'select', label: 'Gap', options: SPACE_TOKENS },
      padding: { kind: 'select', label: 'Padding', options: SPACE_TOKENS },
      align: { kind: 'select', label: 'Align', options: STACK_ALIGN },
      justify: { kind: 'select', label: 'Justify', options: STACK_JUSTIFY },
      surface: { kind: 'select', label: 'Surface', options: SURFACE_TOKENS },
      radius: { kind: 'select', label: 'Radius', options: RADIUS_TOKENS },
      shadow: { kind: 'select', label: 'Shadow', options: SHADOW_TOKENS },
      bordered: { kind: 'boolean', label: 'Border' },
      grow: { kind: 'boolean', label: 'Fill available space' },
    },
  },
  Text: {
    type: 'Text',
    label: 'Text',
    category: 'content',
    summary: 'A single run of text. Pick a variant for size/weight; the element (h1–h3/p/span) follows.',
    acceptsChildren: false,
    schema: textSchema,
    defaultProps: textSchema.parse({}),
    controls: {
      content: { kind: 'textarea', label: 'Content' },
      variant: { kind: 'select', label: 'Variant', options: TEXT_VARIANTS },
      tone: { kind: 'select', label: 'Tone', options: TEXT_TONES },
      align: { kind: 'select', label: 'Align', options: ['start', 'center', 'end'] },
    },
  },
  Button: {
    type: 'Button',
    label: 'Button',
    category: 'form',
    summary: 'A call-to-action button. Text-only label, no children.',
    acceptsChildren: false,
    schema: buttonSchema,
    defaultProps: buttonSchema.parse({}),
    controls: {
      label: { kind: 'text', label: 'Label' },
      variant: { kind: 'select', label: 'Variant', options: BUTTON_VARIANTS },
      size: { kind: 'select', label: 'Size', options: CONTROL_SIZES },
      fullWidth: { kind: 'boolean', label: 'Full width' },
      disabled: { kind: 'boolean', label: 'Disabled' },
    },
  },
  Input: {
    type: 'Input',
    label: 'Input',
    category: 'form',
    summary: 'A single-line text field with an optional label and help text.',
    acceptsChildren: false,
    schema: inputSchema,
    defaultProps: inputSchema.parse({}),
    controls: {
      label: { kind: 'text', label: 'Label' },
      placeholder: { kind: 'text', label: 'Placeholder' },
      size: { kind: 'select', label: 'Size', options: CONTROL_SIZES },
      state: { kind: 'select', label: 'State', options: ['default', 'error'] },
      helpText: { kind: 'text', label: 'Help text' },
    },
  },
} as const satisfies Record<string, CatalogEntry>

export type CatalogType = keyof typeof Catalog

export const CATALOG_TYPES = Object.keys(Catalog) as CatalogType[]

export function isCatalogType(type: string): type is CatalogType {
  return Object.prototype.hasOwnProperty.call(Catalog, type)
}

export function getCatalogEntry(type: string): CatalogEntry | null {
  return isCatalogType(type) ? Catalog[type] : null
}
