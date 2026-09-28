/**
 * Semantic token dictionary.
 *
 * These string unions are the *only* values the canvas, the inspector and the AI
 * agent may use. Every registry prop that affects appearance is typed as one of
 * these unions, and the Zod schemas in `registry.tsx` enforce them at runtime,
 * including on LLM output.
 */

import { spacingScale, radiusScale, shadowScale } from './primitives'

// ---------------------------------------------------------------------------
// Scales (derived from primitives so they can never drift out of sync)
// ---------------------------------------------------------------------------

export type SpaceToken = keyof typeof spacingScale
export const SPACE_TOKENS = Object.keys(spacingScale) as [SpaceToken, ...SpaceToken[]]

export type RadiusToken = keyof typeof radiusScale
export const RADIUS_TOKENS = Object.keys(radiusScale) as [RadiusToken, ...RadiusToken[]]

export type ShadowToken = keyof typeof shadowScale
export const SHADOW_TOKENS = Object.keys(shadowScale) as [ShadowToken, ...ShadowToken[]]

// ---------------------------------------------------------------------------
// Semantic color roles
// ---------------------------------------------------------------------------

export const COLOR_ROLES = [
  'page',
  'surface',
  'subtle',
  'line',
  'line-strong',
  'ink',
  'ink-muted',
  'ink-inverse',
  'brand',
  'brand-hover',
  'brand-subtle',
  'brand-strong',
  'danger',
  'danger-hover',
  'danger-subtle',
  'success',
  'success-subtle',
] as const

// ---------------------------------------------------------------------------
// Higher-level presentation tokens used by components
// ---------------------------------------------------------------------------

export const SURFACE_TOKENS = ['none', 'surface', 'subtle', 'brand-subtle'] as const
export type SurfaceToken = (typeof SURFACE_TOKENS)[number]

export const TEXT_VARIANTS = ['display', 'title', 'heading', 'body', 'caption'] as const

export const TEXT_TONES = ['default', 'muted', 'inverse', 'brand'] as const

export const CONTROL_SIZES = ['sm', 'md', 'lg'] as const

export const BUTTON_VARIANTS = ['primary', 'secondary', 'ghost', 'danger'] as const
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number]

export const STACK_DIRECTIONS = ['vertical', 'horizontal'] as const

export const STACK_ALIGN = ['start', 'center', 'end', 'stretch'] as const
export type StackAlign = (typeof STACK_ALIGN)[number]

export const STACK_JUSTIFY = ['start', 'center', 'end', 'between'] as const
export type StackJustify = (typeof STACK_JUSTIFY)[number]

// ---------------------------------------------------------------------------
// Token -> Tailwind class maps.
// Full literal class strings only, so Tailwind's scanner keeps them in the build
// and no dynamic string concatenation is required.
// ---------------------------------------------------------------------------

// Written out rather than built from SPACE_TOKENS: Tailwind only ships a class
// it can see as a literal string in the source.
export const GAP_CLASS: Record<SpaceToken, string> = {
  none: 'gap-none',
  '3xs': 'gap-3xs',
  '2xs': 'gap-2xs',
  xs: 'gap-xs',
  sm: 'gap-sm',
  md: 'gap-md',
  lg: 'gap-lg',
  xl: 'gap-xl',
  '2xl': 'gap-2xl',
  '3xl': 'gap-3xl',
  '4xl': 'gap-4xl',
  '5xl': 'gap-5xl',
  '6xl': 'gap-6xl',
}

export const PADDING_CLASS: Record<SpaceToken, string> = {
  none: 'p-none',
  '3xs': 'p-3xs',
  '2xs': 'p-2xs',
  xs: 'p-xs',
  sm: 'p-sm',
  md: 'p-md',
  lg: 'p-lg',
  xl: 'p-xl',
  '2xl': 'p-2xl',
  '3xl': 'p-3xl',
  '4xl': 'p-4xl',
  '5xl': 'p-5xl',
  '6xl': 'p-6xl',
}

export const RADIUS_CLASS: Record<RadiusToken, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
}

export const SURFACE_CLASS: Record<SurfaceToken, string> = {
  none: 'bg-transparent',
  surface: 'bg-surface',
  subtle: 'bg-subtle',
  'brand-subtle': 'bg-brand-subtle',
}

export const SHADOW_CLASS: Record<ShadowToken, string> = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
}
