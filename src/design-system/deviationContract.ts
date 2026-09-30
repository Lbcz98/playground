/**
 * The deviation contract the Exploratory prompts carry (phase 9D): what a request
 * may break, what must be declared, and where. Faithful prompts carry none of it —
 * a Faithful screen keeps every pattern and declares nothing.
 */

import { declarableRules, MAX_WHY_LENGTH, NODE_ONLY_RULES } from '@/shared/design-system/deviations'
import type { DesignSystemManifest } from '@/shared/design-system/manifest'
import { rulesOf } from '@/shared/design-system/rules'

const laws = (manifest: DesignSystemManifest): string =>
  rulesOf(manifest)
    .filter((r) => r.flexibility === 'law')
    .map((r) => `${r.title} (${r.id})`)
    .join('; ')

const patterns = (manifest: DesignSystemManifest): string =>
  declarableRules(manifest)
    .map((r) => `- ${r.id} — ${r.title}: ${r.statement}${NODE_ONLY_RULES.includes(r.id) ? ' (on its node only)' : ''}`)
    .join('\n')

/** For the Planner: which breaks to plan, and the "Deviation:" lines that record them. */
export function plannerDeviationContract(manifest: DesignSystemManifest): string {
  return `# Exploratory mode — declared deviations

This request may leave the design system's patterns. Plan what it needs, and say so.
- A LAW holds in every mode. It cannot be broken and cannot be declared: ${laws(manifest)}.
- A PATTERN may be broken only when the plan says which one and why. For every break, add a line
  "Deviation: <rule id> — <why, in one short sentence, in the language of the request>" right under the
  component it happens at, or on the "Screen:" line when it concerns the whole screen. A rule marked
  "on its node only" always goes under its component.
- Break only what the request needs; everything else keeps the patterns. A plan that breaks nothing has no
  "Deviation:" line, and never lists a pattern it does not really break.
- Keep to one of the layer models: composing a new overlay is not available yet.

Patterns that may be broken (id — what it is):
${patterns(manifest)}

`
}

/** For the Generator: the `deviation` field, when it is allowed, and the two ways a screen fails the audit. */
export function generatorDeviationContract(manifest: DesignSystemManifest): string {
  return `

# Exploratory mode — declared deviations

This screen may break a PATTERN of the design system, and only by declaring it. A LAW is never broken and never
declared: ${laws(manifest)}.

This mode adds one field to the node fields above: "deviation": { "ruleId": "<pattern id>", "why": "<the reason, one short
sentence in the language of the request, up to ${MAX_WHY_LENGTH} characters>" }.
- Put it on the node where the break happens; it covers that node and everything inside it. The plan's "Deviation:" lines say which.
- A break that belongs to the whole screen goes in "screen": { "model": …, "level": …, "deviation": [ { "ruleId": …, "why": … } ] }.
  A rule marked "on its node only" is never declared there: declare it on the node where it happens.
- Declare exactly the patterns the screen really breaks. A break that is not declared is an error, and so is a declaration
  that nothing breaks. Declaring a different rule does not cover the break.
- Never declare a law, and never declare a rule that is not in the list below.
- Keep to one of the layer models: composing a new overlay is not available yet.

Patterns that may be declared (id — what it is):
${patterns(manifest)}`
}
