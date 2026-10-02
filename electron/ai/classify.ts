/**
 * The router's LLM layer (Auto mode only): one low-effort call that writes its
 * reasoning first and proposes the rules a request would break. It proposes;
 * `decide` (router.ts) decides.
 *
 * A reply that isn't the expected JSON is retried once. After that the request
 * is asked about when its own words already flagged a conflict, and otherwise
 * goes Faithful with a visible note — never a crash, never a guess.
 */

import { z } from 'zod'
import type { ChatTurn, GenerateUsage } from '@/shared/blueprint'
import type { DesignSystemManifest } from '@/shared/design-system/manifest'
import { readRequest } from '@/shared/design-system/request-signals'
import { rulesOf } from '@/shared/design-system/rules'
import { addUsage, type AiProvider } from './providers'
import { extractBlueprintJson } from './providers/types'
import { conflictQuestion, decide, flagged, type ClassifierReply, type RouteDecision } from './router'
import { ROUTER_FEWSHOT } from './router.fewshot'

const replySchema = z.object({
  reasoning: z.string(),
  mode: z.string(),
  conflicts: z.array(z.object({ ruleId: z.string(), why: z.string().optional() })).max(24),
  faithfulAlternative: z.string().nullish(),
})

export const CLASSIFIER_FAILED_NOTICE =
  'The mode check could not read its own answer, so this screen was generated in Faithful mode.'

export function buildRouterPrompt(manifest: DesignSystemManifest): string {
  const index = rulesOf(manifest)
    .map((rule) => `- ${rule.id} — ${rule.flexibility} — ${rule.title}: ${rule.statement}`)
    .join('\n')
  const examples = ROUTER_FEWSHOT.map(
    ({ request, reply }) => `Request: ${request}\nAnswer: ${JSON.stringify({ faithfulAlternative: null, ...reply })}`,
  ).join('\n\n')
  return `You are the ROUTER of ScreenFlow Studio. Before a screen is planned, you read the
request and list the rules of ${manifest.name} it would break if it were built exactly as
asked. You do not design the screen.

# Rules book (id — level — title: statement)

${index}

A law holds in every mode. A pattern may be broken only in the exploratory mode. A
convention only gets a note.

# Answer

ONE JSON object and nothing else:
{"reasoning": "…", "mode": "faithful" | "exploratory", "conflicts": [{"ruleId": "…", "why": "…"}], "faithfulAlternative": "…" | null}
- Write "reasoning" first: what the request asks, and which rules it touches.
- "conflicts": only the rules the request would break as asked, by their exact id from the book. Empty when it fits.
- "why": one short line, in the language of the request.
- "faithfulAlternative": when there is a conflict, the request rewritten to stay inside every rule, in the language of the request; otherwise null.

# Examples

${examples}`
}

export interface AutoRoute {
  decision: RouteDecision
  usage?: GenerateUsage
  steps: string[]
  /** The classifier's parsed answer (its reasoning and the conflicts it named), when it could be read — for the eval. */
  reply?: ClassifierReply
  /** The classifier's last raw answer, as it came back. */
  raw?: string
}

export async function routeAuto(
  provider: AiProvider,
  prompt: string,
  manifest: DesignSystemManifest,
  model?: string,
): Promise<AutoRoute> {
  const signals = readRequest(prompt, manifest)
  const steps = [
    `step 0 · router signals: ${[...signals.exploration.map((w) => `"${w}"`), ...signals.unknown.map((u) => `no ${u}`)].join(', ') || 'none'}`,
  ]
  const system = buildRouterPrompt(manifest)
  // ponytail: classifies the current prompt alone; pass the chat history if follow-ups get misrouted in 9G.
  const messages: ChatTurn[] = [{ role: 'user', content: prompt }]
  let usage: GenerateUsage | undefined

  for (let attempt = 1; attempt <= 2; attempt++) {
    const answer = await provider.complete({ system, messages, model, effort: 'low' })
    usage = addUsage(usage, answer.usage)
    const reply = parseReply(answer.text)
    if (reply) {
      const decision = decide(signals, reply, manifest)
      const ids = reply.conflicts.map((c) => c.ruleId).join(', ') || 'none'
      steps.push(`step 0 · router: conflicts ${ids} → ${decision.kind === 'go' ? decision.mode : `ask (${decision.question.kind})`}`)
      return { decision, usage, steps, reply, raw: answer.text }
    }
    steps.push(`step 0 · router: unreadable answer on attempt ${attempt}`)
    messages.push(
      { role: 'assistant', content: answer.text.slice(0, 2000) },
      { role: 'user', content: 'That was not the expected answer. Reply with ONLY the JSON object described in the instructions.' },
    )
  }

  const decision: RouteDecision = flagged(signals)
    ? { kind: 'ask', question: conflictQuestion([]) }
    : { kind: 'go', mode: 'faithful', notices: [CLASSIFIER_FAILED_NOTICE] }
  return { decision, usage, steps }
}

function parseReply(text: string): ClassifierReply | null {
  try {
    const parsed = replySchema.safeParse(extractBlueprintJson(text))
    if (!parsed.success) return null
    const { faithfulAlternative, ...rest } = parsed.data
    return faithfulAlternative ? { ...rest, faithfulAlternative } : rest
  } catch {
    return null
  }
}
