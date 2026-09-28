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
 *   3. VALIDATE  — validateBlueprintAgainstManifest() (strict Zod, main process). On failure the
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
import { homeTemplate } from '@/shared/templates/home'
import { buildPlannerPrompt, buildSystemPrompt, templatesFor } from '@/design-system/promptSpec'
import { chooseTemplate } from '@/shared/templates'
import type { DesignSystemManifest } from '@/shared/design-system/manifest'
import { SCREENFLOW_MANIFEST } from '@/shared/design-system/screenflow-manifest'
import { validateBlueprintAgainstManifest } from '@/shared/design-system/manifest-zod'
import { restStrayFocus, stretchRoots } from '@/shared/layout/frame'
import { addUsage, resolveProvider, type AiProvider } from './providers'
import { MalformedOutputError, unwrapBlueprint } from './providers/types'

const MAX_RETRIES = clamp(Number.parseInt(process.env.AI_MAX_VALIDATION_RETRIES ?? '', 10) || 2, 0, 4)

export async function generateUI(
  userPrompt: string,
  history: ChatTurn[] = [],
  options: GenerateOptions = {},
  manifest: DesignSystemManifest = SCREENFLOW_MANIFEST,
): Promise<GenerateUIResponse> {
  const startedAt = Date.now()
  const steps: string[] = [
    `prompt: ${JSON.stringify(userPrompt)}`,
    `design system: ${manifest.name} v${manifest.version} (${Object.keys(manifest.components).length} components)`,
  ]

  const provider = await resolveProvider()
  if (!provider) {
    steps.push('no AI provider available — returning the home template')
    return {
      ok: true,
      blueprint: homeTemplate.blueprint,
      meta: { source: 'dummy', durationMs: Date.now() - startedAt, steps },
    }
  }

  let usage: GenerateUsage | undefined
  let model: string | undefined

  try {
    // ── Step 1: Planner ────────────────────────────────────────────────────
    const planner = await provider.complete({
      system: buildPlannerPrompt(manifest),
      messages: [...history, { role: 'user', content: userPrompt }],
      model: options.model,
      effort: 'low', // planning is structural — keep it cheap
    })
    usage = addUsage(usage, planner.usage)
    model = planner.model
    const planLines = planner.text.split('\n').filter((l) => l.trim().length > 0).length

    // The screen this generation starts from: the planner names one, or the model
    // it planned picks one. Either way the generator gets a screen that is already
    // valid, instead of composing the same structure again from the laws alone.
    const choice = chooseTemplate(planner.text, templatesFor(manifest))
    steps.push(
      `step 1 · planner: ${planLines}-line plan` +
        (choice.template ? ` · template: ${choice.template.id} (${choice.reason})` : ` · template: ${choice.reason}`),
    )

    // ── Steps 2 + 3: Generator + validation-retry loop ─────────────────────
    const genSystem = buildSystemPrompt(provider.id === 'api-key' ? 'tool' : 'json', manifest)
    const reference = choice.template
      ? `Start from this screen — it is valid, and it is the shape the plan describes.\n` +
        `Keep its structure and change only what the plan asks for; drop what the plan\n` +
        `does not mention.\n\nTEMPLATE "${choice.template.id}" (${choice.template.name}):\n` +
        `${JSON.stringify(choice.template.blueprint, null, 2)}\n\n`
      : ''
    const genMessages: ChatTurn[] = [
      {
        role: 'user',
        content: `${reference}Build exactly this plan as the Blueprint JSON.\n\nPLAN:\n${planner.text}`,
      },
    ]

    let lastBlueprint: unknown
    let lastErrors: string[] = []

    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      let errors: string[]
      let reply = ''
      try {
        const gen = await provider.renderUi({
          system: genSystem,
          messages: genMessages,
          model: options.model,
          effort: options.effort,
        })
        usage = addUsage(usage, gen.usage)
        model = gen.model ?? model
        lastBlueprint = unwrapBlueprint(gen.blueprint)
        // A focus the level rules out, or a root that doesn't stretch, has one fix;
        // make it here rather than spend a retry on it.
        const rested = restStrayFocus(lastBlueprint, manifest)
        if (rested.length > 0) steps.push(`step 2 · rested ${rested.length} stray focus: ${rested.join('; ')}`)
        const stretched = stretchRoots(lastBlueprint, manifest)
        if (stretched.length > 0) steps.push(`step 2 · stretched ${stretched.length} root(s): ${stretched.join('; ')}`)
        reply = JSON.stringify(lastBlueprint)

        const validation = validateBlueprintAgainstManifest(lastBlueprint, manifest)
        if (validation.ok) {
          steps.push(`step 2 · generator: valid on attempt ${attempt}`)
          return success(lastBlueprint, provider, model, usage, steps, startedAt)
        }
        errors = validation.errors
      } catch (err) {
        // A reply that isn't JSON is the model's mistake, not the provider's: say so and retry.
        if (!(err instanceof MalformedOutputError)) throw err
        reply = err.raw.slice(0, 6000)
        errors = [
          `Your reply was not valid JSON (${err.message}). Reply with ONLY the JSON object — no prose, no comments, no trailing commas, every key and string double-quoted.`,
        ]
        if (attempt > MAX_RETRIES) throw err
      }

      lastErrors = errors
      steps.push(`step 3 · validate: attempt ${attempt} had ${errors.length} issue(s)`)

      if (attempt <= MAX_RETRIES) {
        genMessages.push({ role: 'assistant', content: reply })
        genMessages.push({
          role: 'user',
          content:
            `That Blueprint is invalid:\n${errors.map((e) => `- ${e}`).join('\n')}\n\n` +
            `Return the corrected JSON — same structure, only fixing these problems. Do not mention the fixes in "notes".`,
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
