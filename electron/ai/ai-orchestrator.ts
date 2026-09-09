/**
 * The AI orchestration pipeline — Electron main process only.
 *
 * Not a single zero-shot call. Three steps (a router pattern rather than
 * LangChain, to keep the dual-provider support):
 *
 *   1. PLANNER   — provider.complete() with the "Product Blueprint" system prompt.
 *                  Produces a short prose build plan (no JSON).
 *   2. GENERATOR — provider.renderUi() constrained to the render_ui tool schema.
 *                  Translates the plan into the strict Blueprint JSON.
 *   3. VALIDATE  — validateBlueprint() (strict Zod, main process). On failure the
 *                  error list is fed back to the GENERATOR and it retries.
 *                  Max `AI_MAX_VALIDATION_RETRIES` (default 2) retries.
 *
 * `generateUI(userPrompt)` runs this whole lifecycle and returns a
 * `GenerateUIResponse` whose blueprint has passed validation (or, if retries were
 * exhausted, the best attempt — the renderer's interpreter repairs the remainder).
 */

import type {
  BlueprintDocument,
  ChatTurn,
  GenerateOptions,
  GenerateUIResponse,
  GenerateUsage,
} from '@/shared/blueprint'
import { PRICING_CARD_BLUEPRINT } from '@/shared/fixtures/pricingCard'
import { buildPlannerPrompt, buildSystemPrompt } from '@/design-system/promptSpec'
import { addUsage, resolveProvider, type AiProvider } from './providers'
import { unwrapBlueprint } from './providers/types'
import { validateBlueprint } from './validateBlueprint'

const MAX_RETRIES = clamp(Number.parseInt(process.env.AI_MAX_VALIDATION_RETRIES ?? '', 10) || 2, 0, 4)

export async function generateUI(
  userPrompt: string,
  history: ChatTurn[] = [],
  options: GenerateOptions = {},
): Promise<GenerateUIResponse> {
  const startedAt = Date.now()
  const steps: string[] = [`prompt: ${JSON.stringify(userPrompt)}`]

  const provider = await resolveProvider()
  if (!provider) {
    steps.push('no AI provider available — returning the built-in pricing-card fixture')
    return {
      ok: true,
      blueprint: PRICING_CARD_BLUEPRINT,
      meta: { source: 'dummy', durationMs: Date.now() - startedAt, steps },
    }
  }

  let usage: GenerateUsage | undefined
  let model: string | undefined

  try {
    // ── Step 1: Planner ────────────────────────────────────────────────────
    const planner = await provider.complete({
      system: buildPlannerPrompt(),
      messages: [...history, { role: 'user', content: userPrompt }],
      model: options.model,
      effort: 'low', // planning is structural — keep it cheap
    })
    usage = addUsage(usage, planner.usage)
    model = planner.model
    const planLines = planner.text.split('\n').filter((l) => l.trim().length > 0).length
    steps.push(`step 1 · planner: ${planLines}-line plan`)

    // ── Steps 2 + 3: Generator + validation-retry loop ─────────────────────
    const genSystem = buildSystemPrompt(provider.id === 'api-key' ? 'tool' : 'json')
    const genMessages: ChatTurn[] = [
      {
        role: 'user',
        content: `Build exactly this plan as the Blueprint JSON.\n\nPLAN:\n${planner.text}`,
      },
    ]

    let lastBlueprint: unknown
    let lastErrors: string[] = []

    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      const gen = await provider.renderUi({
        system: genSystem,
        messages: genMessages,
        model: options.model,
        effort: options.effort,
      })
      usage = addUsage(usage, gen.usage)
      model = gen.model ?? model
      lastBlueprint = unwrapBlueprint(gen.blueprint)

      const validation = validateBlueprint(lastBlueprint)
      if (validation.ok) {
        steps.push(`step 2 · generator: valid on attempt ${attempt}`)
        return success(lastBlueprint, provider, model, usage, steps, startedAt)
      }

      lastErrors = validation.errors
      steps.push(`step 3 · validate: attempt ${attempt} had ${validation.errors.length} issue(s)`)

      if (attempt <= MAX_RETRIES) {
        genMessages.push({ role: 'assistant', content: JSON.stringify(lastBlueprint) })
        genMessages.push({
          role: 'user',
          content:
            `That Blueprint is invalid:\n${validation.errors.map((e) => `- ${e}`).join('\n')}\n\n` +
            `Return the corrected JSON — same structure, only fixing these problems.`,
        })
      }
    }

    // Retries exhausted — hand back the best attempt; the renderer's interpreter
    // strips whatever is still wrong before it renders.
    steps.push(
      `step 3 · validate: still invalid after ${MAX_RETRIES} retr${MAX_RETRIES === 1 ? 'y' : 'ies'} ` +
        `(${lastErrors.length} issue(s)) — repairing on render`,
    )
    return success(lastBlueprint, provider, model, usage, steps, startedAt)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    steps.push(`error: ${message}`)
    return {
      ok: false,
      error: message,
      stage: `${provider.id}:pipeline`,
      meta: {
        source: 'llm',
        provider: provider.id,
        model,
        usage,
        durationMs: Date.now() - startedAt,
        steps,
      },
    }
  }
}

function success(
  blueprint: unknown,
  provider: AiProvider,
  model: string | undefined,
  usage: GenerateUsage | undefined,
  steps: string[],
  startedAt: number,
): GenerateUIResponse {
  return {
    ok: true,
    blueprint: blueprint as BlueprintDocument,
    meta: {
      source: 'llm',
      provider: provider.id,
      model,
      usage,
      durationMs: Date.now() - startedAt,
      steps,
    },
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}
