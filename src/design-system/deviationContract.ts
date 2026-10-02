/**
 * The deviation contract the Exploratory prompts carry (phase 9D): what a request
 * may break, what must be declared, and where. Faithful prompts carry none of it —
 * a Faithful screen keeps every pattern and declares nothing.
 */

import { declarableRules, MAX_WHY_LENGTH, ruleScope } from '@/shared/design-system/deviations'
import type { ScreenMode } from '@/shared/blueprint'
import type { DesignSystemManifest } from '@/shared/design-system/manifest'
import { rulesOf } from '@/shared/design-system/rules'
import { SHADE_IDS } from '@/shared/design-system/manifest'
import { MAX_PROPOSED_PROPS } from '@/shared/design-system/manifest-zod'
import { PRIMITIVE_MAX_CHAIN, PRIMITIVE_MAX_PER_SCREEN, PRIMITIVE_TYPES, withVocabulary } from '@/shared/design-system/primitives'

const laws = (manifest: DesignSystemManifest): string =>
  rulesOf(manifest)
    .filter((r) => r.flexibility === 'law')
    .map((r) => `${r.title} (${r.id})`)
    .join('; ')

const patterns = (manifest: DesignSystemManifest): string =>
  declarableRules(manifest)
    .map((r) => `- ${r.id} — ${r.title}: ${r.statement}${ruleScope(r.id) === 'node' ? ' (on its node only)' : ''}`)
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
- Break a pattern only when the request needs it; never invent a position or layout the request doesn't ask
  for; if unsure, conform. Everything else keeps the patterns. A plan that breaks nothing has no
  "Deviation:" line, and never lists a pattern it does not really break.
- A new overlay is composed, not invented: "screen": { "model": "composed", "level": <its level>, "shades": [ <from ${SHADE_IDS.map((s) => `"${s}"`).join(', ')}, each once> ], "deviation": [ { "ruleId": "layers.overlay-model", "why": … } ] }. Any other model name must be one of the layer models.

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
- Break a pattern only when the request needs it; never invent a position or layout the request doesn't ask for; if unsure, conform.
- Declare exactly the patterns the screen really breaks. A break that is not declared is an error, and so is a declaration
  that nothing breaks. Declaring a different rule does not cover the break.
- Never declare a law, and never declare a rule that is not in the list below.
- A new overlay is composed, not invented: "screen": { "model": "composed", "level": <its level>, "shades": [ <from ${SHADE_IDS.map((s) => `"${s}"`).join(', ')}, each once> ], "deviation": [ { "ruleId": "layers.overlay-model", "why": … } ] }. Any other model name must be one of the layer models.

Patterns that may be declared (id — what it is):
${patterns(manifest)}`
}

// ── The Exploratory vocabulary (phase 9E) ───────────────────────────────────────────────────────

/** One primitive's props as the prompt shows them: a token prop says its group; an enum lists its values. */
function primitiveProps(manifest: DesignSystemManifest, type: string): string {
  const component = withVocabulary(manifest).components[type]
  return Object.values(component.props)
    .map((p) => {
      if (p.options && p.tokenGroup) return `${p.name} (${p.options.join(' | ')})`
      if (p.tokenGroup) return `${p.name} (a ${p.tokenGroup} token, same names as the components use)`
      if (p.options) return `${p.name} (${p.options.join(' | ')})`
      return `${p.name}${p.required ? ' (required text)' : ''}`
    })
    .join(', ')
}

/** For the Planner: when a primitive or a Proposal is the answer, and the lines that record it. */
export function plannerVocabularyContract(): string {
  return `# Exploratory mode — beyond the registry

Prefer the registry's components, recomposed. Only when none of them expresses the need:
- a small piece the registry lacks (a coloured title, a wrapper that groups pieces) is a PRIMITIVE —
  ${PRIMITIVE_TYPES.join(', ')}. For each, add a line "Primitive: <type> — considered <the components you
  looked at, by name> — <why none of them does it>".
- a part the registry has no component for (one with props of its own) is a PROPOSAL — add a line "Proposal:
  <what it is> — <its props: name: type, …>". It is shown as a placeholder, not built. If your notes would say
  "the registry has no X", that is a Proposal for X, not an approximation with other components.
At most ${PRIMITIVE_MAX_CHAIN} primitives inside each other and ${PRIMITIVE_MAX_PER_SCREEN} per screen, text included: past that, it is a Proposal.
A request that fits the registry uses no primitive and no Proposal.
Example — for the request "${PROPOSAL_EXAMPLE_REQUEST}", the registry has no slider, so the plan carries:
  Proposal: Volume slider — a horizontal track with a handle that shows the current level — props: level: number, muted: boolean
and no line that approximates it with a row of buttons.

`
}

/** For the Generator: the vocabulary, the "reuse" contract, the budget and the Proposal shape. */
export function generatorVocabularyContract(manifest: DesignSystemManifest): string {
  const components = Object.keys(manifest.components).join(', ')
  return `

# Exploratory mode — beyond the registry

Prefer the registry's components. Use the vocabulary below only when no component expresses the need; a
request that fits the registry uses none of it. The laws hold for it exactly as for components: tokens only
(never a hex, px or rgb), the semantic tier, the 8pt grid, only the props listed.

Primitives — each carries "reuse": { "considered": "<the registry components you looked at, by id, comma-separated>",
"why": "<why none of them expresses the need, in the language of the request>" }. "considered" names real
components (${components}); a primitive without a valid "reuse" is an error.
${PRIMITIVE_TYPES.map((t) => `- ${t}: ${primitiveProps(manifest, t)}${withVocabulary(manifest).components[t].acceptsChildren ? '; holds children' : '; no children'}`).join('\n')}
Budget: at most ${PRIMITIVE_MAX_CHAIN} primitives nested in primitives, and ${PRIMITIVE_MAX_PER_SCREEN} per screen, primitive:Text included.
Past it, the need is a new component: group it into one Proposal.

Proposal — a component the registry lacks, shown as a placeholder and never built. If your notes would say "the registry has no X",
declare a Proposal for X instead of approximating it with other components:
{ "type": "Proposal", "props": { "description": "<what it is and does>", "proposedApi": { "<propName>": "<short type or description>" } },
  "deviation": { "ruleId": "registry.new-component", "why": "<why the registry lacks it>" } }
proposedApi has 1 to ${MAX_PROPOSED_PROPS} props, each an identifier (letters and digits) with a short string. A Proposal has no children and
declares registry.new-component — nothing else, on its own node.`
}


// ── A part the registry lacks, per mode (phase 9G, C2) ──────────────────────────────────────────
// Faithful approximates with the components it has and says so (its text is byte-identical to before); Exploratory
// declares a Proposal instead — so the two modes never share a sentence that contradicts the other's rule.

/** The request a worked Proposal example answers: a part the registry verifiably has no component for (no slider). */
export const PROPOSAL_EXAMPLE_REQUEST = 'a volume slider on the clean broadcast'

/** The Generator kernel's last sentence on a part the registry lacks. */
export function registryLackSentence(mode: ScreenMode | undefined): string {
  return mode === 'exploratory'
    ? 'If the request needs a part the registry lacks, declare a Proposal for it (see "Exploratory mode — beyond the registry" below) instead of approximating it with other components. Never build a component of your own.'
    : 'If the request needs something the registry lacks, approximate it with the layout primitives and name what you approximated. Never invent a component.'
}

/** The planner's closing sentence on notes. */
export function plannerNotesSentence(mode: ScreenMode | undefined): string {
  return mode === 'exploratory'
    ? 'When the need is not in the registry, the plan carries a "Proposal:" line (see above), not a "Notes:" line about approximating it. When a law overrides part of the request, end the plan with a "Notes:" line saying so plainly, in the language of the request.'
    : 'When you had to approximate something the registry lacks, or a law overrides part of the request, end the plan with a "Notes:" line saying so plainly, in the language of the request.'
}

/** The first clause of the generator's notes instruction. */
export function notesLackClause(mode: ScreenMode | undefined): string {
  return mode === 'exploratory'
    ? 'when a Proposal stands in for something the registry lacks (say what it stands in for), or a law overrode part of their request'
    : 'when you approximated something the registry lacks, or a law overrode part of their request'
}
