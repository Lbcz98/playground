/**
 * One interaction-state vocabulary for every interactive component.
 *
 * Components used to spell this four ways (`state`, `status`, a `focus` boolean,
 * `bugFocused`). Each now takes `interactionState` — a subset of the union below —
 * and keeps its old prop working as a deprecated alias: the new prop wins, a
 * legacy value maps onto it, and development builds warn once per component and
 * prop so callers can migrate incrementally.
 */

export type InteractionState = 'default' | 'focus' | 'selected' | 'loading' | 'disabled'

const warned = new Set<string>()

/** Warns once per `component.legacy` pair, in development only. */
export function warnDeprecated(component: string, legacy: string, replacement: string): void {
  if (!import.meta.env.DEV) return
  const key = `${component}.${legacy}`
  if (warned.has(key)) return
  warned.add(key)
  console.warn(`[${component}] \`${legacy}\` is deprecated and will be removed. Use \`${replacement}\` instead.`)
}

/** Test-only: forget which deprecations already warned. */
export function resetDeprecationWarnings(): void {
  warned.clear()
}

/** The new prop wins; otherwise a legacy value maps in (and warns once); otherwise the fallback. */
export function resolveInteractionState<S extends InteractionState>(
  component: string,
  interactionState: S | undefined,
  legacy: { prop: string; value: S | undefined },
  fallback: S,
): S {
  if (legacy.value !== undefined) warnDeprecated(component, legacy.prop, 'interactionState')
  return interactionState ?? legacy.value ?? fallback
}

/** Maps a legacy `focus` boolean onto the state vocabulary; `undefined` stays unset. */
export function fromFocusFlag(focus: boolean | undefined): 'default' | 'focus' | undefined {
  return focus === undefined ? undefined : focus ? 'focus' : 'default'
}
