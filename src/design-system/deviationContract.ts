/**
 * The deviation contract the Exploratory prompts carry (phase 9D): what a request
 * may break, what must be declared, and where. Faithful prompts carry none of it —
 * a Faithful screen keeps every pattern and declares nothing.
 */

import { declarableRules, MAX_WHY_LENGTH, ruleScope } from '@/shared/design-system/deviations'
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
- a real new component (a scoreboard, a widget with its own props) is a PROPOSAL — add a line "Proposal:
  <what it is> — <its props: name: type, …>". It is shown as a placeholder, not built.
At most ${PRIMITIVE_MAX_CHAIN} primitives inside each other and ${PRIMITIVE_MAX_PER_SCREEN} per screen, text included: past that, it is a Proposal.
A request that fits the registry uses no primitive and no Proposal.

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

Proposal — a component the registry lacks, shown as a placeholder and never built:
{ "type": "Proposal", "props": { "description": "<what it is and does>", "proposedApi": { "<propName>": "<short type or description>" } },
  "deviation": { "ruleId": "registry.new-component", "why": "<why the registry lacks it>" } }
proposedApi has 1 to ${MAX_PROPOSED_PROPS} props, each an identifier (letters and digits) with a short string. A Proposal has no children and
declares registry.new-component — nothing else, on its own node.`
}
