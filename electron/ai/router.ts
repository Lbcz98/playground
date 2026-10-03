/**
 * The router — step 0 of the pipeline (phase 9C): which mode a request runs in,
 * decided before the planner.
 *
 *   1. Explicit choice (Fidedigno / Exploratório / Os dois): no model call; the
 *      router only lists what the request's words already show.
 *   2. Deterministic signals (`readRequest`): exploration words, UI parts the
 *      design system doesn't have. Free.
 *   3. Auto: an LLM classifier proposes the rules in conflict (`classify.ts`).
 *
 * The mode comes from code: `decide` looks each proposed rule up in the book, reads
 * its level from there, and compares it with the signals. The classifier's own
 * `mode` is only logged.
 */

import type { RouterQuestion, ScreenMode } from '@/shared/blueprint'
import type { DesignSystemManifest, PatternRule } from '@/shared/design-system/manifest'
import type { RequestSignals } from '@/shared/design-system/request-signals'
import { ruleById } from '@/shared/design-system/rules'

export interface ClassifierConflict {
  ruleId: string
  why?: string
}

export interface ClassifierReply {
  summary: string
  mode: string
  conflicts: ClassifierConflict[]
  faithfulAlternative?: string
}

export type RouteDecision =
  | { kind: 'go'; mode: ScreenMode; notices: string[]; faithfulAlternative?: string }
  | { kind: 'ask'; question: RouterQuestion }

/** The plan's wording for the Auto-mode question. */
export const CONFLICT_QUESTION = 'Esse pedido foge dos padrões do design system, você deseja prosseguir'

/** Whether the request's own words already point outside the patterns. */
export function flagged(signals: RequestSignals): boolean {
  return signals.exploration.length > 0 || signals.unknown.length > 0
}

/**
 * The decision table:
 *   law in conflict                         → the law holds in both modes: say which, offer the faithful alternative
 *   a rule the book doesn't have            → ask
 *   pattern in conflict, signals agree      → Exploratory
 *   pattern xor signals (they disagree)     → ask
 *   only conventions                        → Faithful, with a note
 *   nothing                                 → Faithful
 */
export function decide(signals: RequestSignals, reply: ClassifierReply, manifest: DesignSystemManifest): RouteDecision {
  const known: { rule: PatternRule; why?: string }[] = []
  let unknownRule = false
  for (const conflict of reply.conflicts) {
    const rule = ruleById(manifest, conflict.ruleId)
    if (rule) known.push({ rule, why: conflict.why })
    else unknownRule = true
  }
  const at = (level: PatternRule['flexibility']) => known.filter((k) => k.rule.flexibility === level)
  const laws = at('law')
  const patterns = at('pattern')
  const notices = at('convention').map(({ rule, why }) => `Convention noted: "${rule.title}"${why ? ` — ${why}` : ''}.`)

  if (laws.length > 0) {
    return {
      kind: 'ask',
      question: {
        kind: 'law',
        text: `Esse pedido esbarra em ${laws.length === 1 ? 'uma lei' : 'leis'} do design system, que vale${laws.length === 1 ? '' : 'm'} nos dois modos: ${laws.map((l) => `"${l.rule.title}"`).join(', ')}.`,
        why: laws.find((l) => l.why)?.why,
        rules: laws.map(({ rule }) => brief(rule)),
        choices: ['faithful'],
        faithfulAlternative: reply.faithfulAlternative,
      },
    }
  }
  const signal = flagged(signals)
  if (!unknownRule && patterns.length > 0 && signal) {
    // Exploratory starts from the faithful alternative and edits it.
    return { kind: 'go', mode: 'exploratory', notices, ...(reply.faithfulAlternative ? { faithfulAlternative: reply.faithfulAlternative } : {}) }
  }
  if (unknownRule || patterns.length > 0 || signal) return { kind: 'ask', question: conflictQuestion(patterns, reply.faithfulAlternative) }
  return { kind: 'go', mode: 'faithful', notices }
}

/** The Auto-mode question, with the first conflict's `why` line when there is one. */
export function conflictQuestion(
  patterns: { rule: PatternRule; why?: string }[],
  faithfulAlternative?: string,
): RouterQuestion {
  return {
    kind: 'conflict',
    text: CONFLICT_QUESTION,
    why: patterns.find((p) => p.why)?.why,
    rules: patterns.map(({ rule }) => brief(rule)),
    // Three buttons: follow the patterns, explore beyond them, or both side by side (9F). A law question offers none of
    // the last two: the law holds in both modes, so the two screens would be the same.
    choices: ['faithful', 'exploratory', 'both'],
    faithfulAlternative,
  }
}

/**
 * An explicit mode: no model call. The router only lists the conflicts the words
 * show — a UI part the system doesn't have runs into the component API law.
 */
export function explicitNotices(signals: RequestSignals, manifest: DesignSystemManifest): string[] {
  if (signals.unknown.length === 0) return []
  const law = ruleById(manifest, 'component.api')
  return [
    `${manifest.name} has no ${signals.unknown.join(', ')}; the screen approximates ${signals.unknown.length === 1 ? 'it' : 'them'} with its own components${law ? ` (law: "${law.title}")` : ''}.`,
  ]
}

function brief(rule: PatternRule): RouterQuestion['rules'][number] {
  return { id: rule.id, title: rule.title, flexibility: rule.flexibility }
}
