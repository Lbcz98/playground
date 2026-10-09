/**
 * Where focus may be on a screen — `focus.single` and `level.initial-focus` — decided here and only here.
 *
 * Three readers ask it, each saying what holds the focus in its own medium and phrasing the findings for it:
 * the source (scripts/check-laws.ts), the blueprint (frame.ts) and the page drawn in Chromium (scripts/flow-probe.ts).
 */
import type { ManifestNavigationLevel } from '@/shared/design-system/manifest'

/**
 * Kit components with a `"focus"` value that is a look, not the TV focus: a label drawn inside a focused button. The
 * kit draws no focus ring for them, and the manifest cannot tell them apart (LabelVideo even defaults to `"focus"`).
 */
export const FOCUS_LOOK_ONLY: readonly string[] = ['LabelVideo']

/** One element that holds the focus: its kit component, and the value of the prop that focuses it when the reader knows it. */
export interface Holder {
  component: string
  value?: unknown
}

export type FocusFinding<T extends Holder> =
  | { ruleId: 'focus.single'; focused: T[] }
  | { ruleId: 'level.initial-focus'; code: 'wrong'; wrong: T[] }
  | { ruleId: 'level.initial-focus'; code: 'nothing-focused' | 'missing' }

/** What the reader knows beyond what holds the focus. */
export interface FocusContext {
  /**
   * The viewer just entered this level (a walk knows; one screen alone does not). Entered, the focus is where the
   * level starts (`on`); moved inside the level, or not known, it may also be on what the level `accepts`.
   */
  entered?: boolean
  /** Every component on screen, focused or not, when the reader sees them (the blueprint does; the page does not). */
  present?: ReadonlySet<string>
  /**
   * The screen declares `@deviation level.initial-focus` (a pattern; `focus.single` is a law and cannot be). A reader whose
   * medium judges declarations itself (the blueprint validator: it also reports one declared for nothing) leaves this out.
   */
  declared?: boolean
}

export function focusFindings<T extends Holder>(focused: T[], level: ManifestNavigationLevel | undefined, { entered, present, declared }: FocusContext = {}): FocusFinding<T>[] {
  const out: FocusFinding<T>[] = []
  // Level 0 is the clean broadcast: the viewer is on nothing, so it may have no focus (one at most).
  if (focused.length > 1 || (focused.length === 0 && level?.level !== 0)) out.push({ ruleId: 'focus.single', focused })

  const start = level?.initialFocus
  if (!start || declared) return out
  const right = (f: T): boolean =>
    (start.on.includes(f.component) && (start.value === undefined || f.value === start.value)) || (!entered && !!start.accepts?.includes(f.component))
  const wrong = focused.filter((f) => !right(f))
  if (wrong.length > 0) out.push({ ruleId: 'level.initial-focus', code: 'wrong', wrong })
  else if (present && focused.length === 0 && start.on.some((id) => present.has(id))) out.push({ ruleId: 'level.initial-focus', code: 'nothing-focused' })
  else if (present && start.required && !start.on.some((id) => present.has(id))) out.push({ ruleId: 'level.initial-focus', code: 'missing' })
  return out
}
