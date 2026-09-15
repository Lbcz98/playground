/**
 * The token vocabulary primitives accept as props.
 *
 * Every name is derived from `CssVar` in `src/styles/global-tokens.ts`, which is
 * generated from `tokens/tokens.json`: a prop can only name a custom property
 * `global.css` really defines, and dropping a token from the contract breaks
 * the build of every primitive that used it.
 */

import { CSS_VARS, type CssVar } from '@/styles/global-tokens'

/** The part of each `CssVar` that follows `Prefix`. */
type NamesAfter<Prefix extends string, Var extends string = CssVar> = Var extends `${Prefix}${infer Name}`
  ? Name
  : never

const SPACING = '--dimension-spacing-core-'
const RADIUS = '--dimension-radius-core-'
const FUNCTIONAL = '--color-semantic-functional-'

export type SpacingStep = NamesAfter<typeof SPACING>
export type RadiusStep = NamesAfter<typeof RADIUS>
export type SurfaceColor = NamesAfter<`${typeof FUNCTIONAL}background-`>
export type BorderColor = NamesAfter<`${typeof FUNCTIONAL}border-`>
export type StatusColor = NamesAfter<`${typeof FUNCTIONAL}status-`>
/** A functional text role (`primary`, `secondary`, …) or a status colour as `status-<name>`. */
export type TextColor = NamesAfter<`${typeof FUNCTIONAL}text-`> | `status-${StatusColor}`

/**
 * Spacing steps off the layout grid (frame.ts rule 2: multiples of 8, plus the
 * 4 and 12 exceptions) — today, only `md`. Layout props refuse them
 * at the type level; primitives.test.tsx recomputes this list from tokens.json
 * so it can't drift.
 */
export const OFF_GRID_SPACING = ['md'] as const satisfies readonly SpacingStep[]
export type GridSpacing = Exclude<SpacingStep, (typeof OFF_GRID_SPACING)[number]>

function namesAfter(prefix: string): string[] {
  return CSS_VARS.filter((name) => name.startsWith(prefix)).map((name) => name.slice(prefix.length))
}

/** Grid spacing steps, smallest first. */
export const GRID_SPACING = namesAfter(SPACING).filter(
  (name) => !(OFF_GRID_SPACING as readonly string[]).includes(name),
) as GridSpacing[]

/** Radius steps, smallest first. */
export const RADIUS_STEPS = namesAfter(RADIUS) as RadiusStep[]

export function cssVar(name: CssVar): string {
  return `var(${name})`
}

export function spacing(step: GridSpacing): string {
  return cssVar(`${SPACING}${step}`)
}

export function radius(step: RadiusStep): string {
  return cssVar(`${RADIUS}${step}`)
}

export function surface(role: SurfaceColor): string {
  return cssVar(`${FUNCTIONAL}background-${role}`)
}

export function borderColor(role: BorderColor): string {
  return cssVar(`${FUNCTIONAL}border-${role}`)
}

function isStatus(role: TextColor): role is `status-${StatusColor}` {
  return role.startsWith('status-')
}

export function textColor(role: TextColor | 'inherit'): string {
  if (role === 'inherit') return 'inherit'
  return isStatus(role) ? cssVar(`${FUNCTIONAL}${role}`) : cssVar(`${FUNCTIONAL}text-${role}`)
}
