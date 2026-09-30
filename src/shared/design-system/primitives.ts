/**
 * The Exploratory vocabulary (phase 9E): the three primitives and `Proposal`.
 *
 * Code, not manifest data — every design system, built-in or imported, gets the
 * same vocabulary, and a Faithful screen never sees it. Not to be confused with
 * `src/design-system/primitives.ts`, which holds the raw token values (and is the
 * one file the token lint allows raw values in); nothing here is a raw value.
 */

/** The primitive node types: layout and text built only from the active system's tokens. */
export const PRIMITIVE_TYPES = ['primitive:Box', 'primitive:Stack', 'primitive:Text'] as const
export type PrimitiveType = (typeof PRIMITIVE_TYPES)[number]

/** A component the registry lacks, described for the design system to build — never rendered as the real thing. */
export const PROPOSAL_TYPE = 'Proposal'

/**
 * The primitive budget (plan: decided after the first real runs, calibrated in 9G).
 * Checked on the interpreted tree. `primitive:Text` counts like the others.
 */
/** The longest chain of primitives nested in primitives. */
export const PRIMITIVE_MAX_CHAIN = 3
/** The most primitives one screen may use. */
export const PRIMITIVE_MAX_PER_SCREEN = 6

/** Every node type only an Exploratory screen may use. */
export const EXPLORATORY_TYPES: readonly string[] = [...PRIMITIVE_TYPES, PROPOSAL_TYPE]

export const isPrimitive = (type: unknown): type is PrimitiveType =>
  typeof type === 'string' && (PRIMITIVE_TYPES as readonly string[]).includes(type)
