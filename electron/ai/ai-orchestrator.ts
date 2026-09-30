/**
 * The AI orchestration pipeline — Electron main process only.
 *
 * Not a single zero-shot call. Three steps (a router pattern rather than
 * LangChain, to keep the dual-provider support):
 *
 *   0. ROUTER    — only when a mode is requested (`router.ts`): Auto asks the
 *                  classifier and may return a question instead of a screen; an
 *                  explicit mode only lists what the request's words show.
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
  GenerateUIMeta,
  GenerateUIResponse,
  GenerateUsage,
  ScreenMode,
} from '@/shared/blueprint'
import { readRequest } from '@/shared/design-system/request-signals'
import { homeTemplate } from '@/shared/templates/home'
import { buildPlannerPrompt, buildSystemPrompt, templatesFor } from '@/design-system/promptSpec'
import { chooseTemplate } from '@/shared/templates'
import type { DesignSystemManifest } from '@/shared/design-system/manifest'
import { SCREENFLOW_MANIFEST } from '@/shared/design-system/screenflow-manifest'
import { validateBlueprintAgainstManifest, type ValidationIssue } from '@/shared/design-system/manifest-zod'
import { restStrayFocus, stretchRoots } from '@/shared/layout/frame'
import { addUsage, resolveProvider, type AiProvider } from './providers'
import { MalformedOutputError, unwrapBlueprint } from './providers/types'
import { routeAuto } from './classify'
import { explicitNotices } from './router'

const MAX_RETRIES = clamp(Number.parseInt(process.env.AI_MAX_VALIDATION_RETRIES ?? '', 10) || 2, 0, 4)

/** "Os dois" arrives in 9F: until then it runs one Faithful generation (never two) and says so. */
export const BOTH_FALLBACK_NOTICE = 'Os dois arrives in 9F — this screen was generated in Faithful mode.'

/**
 * How many times an Exploratory generation may go back to the planner (default 1,
 * at most 2). Read per call; Faithful never replans.
 */
function maxReplans(): number {
  const n = Number.parseInt(process.env.AI_MAX_REPLANS ?? '', 10)
  return clamp(Number.isNaN(n) ? 1 : n, 0, 2)
}

/**
 * Why a failed generation goes back to the planner, or null: it stays with the
 * generator. A composition choice (an undeclared break, a declaration nothing
 * breaks) is the generator's to fix first — it can regroup, or declare — and the
 * plan's only if it persists after the generator's retries.
 */
function planTrigger(issues: ValidationIssue[], generatorRetriesLeft: boolean): string | null {
  const composition = issues.filter((i) => i.kind !== undefined)
  if (composition.length === 0 || generatorRetriesLeft) return null
  const kinds = [...new Set(composition.map((i) => i.kind))].join(', ')
  return `${kinds} (${[...new Set(composition.map((i) => i.ruleId))].join(', ')}) — persisted after the generator's retries`
}

/** What the generator (and the planner, on a replan) is told: Faithful keeps its plain list; Exploratory names the rule and the place. */
function feedback(issues: ValidationIssue[], mode: ScreenMode): string[] {
  return mode === 'exploratory'
    ? issues.map((i) => `[${i.ruleId}] at ${i.path.join('.') || 'the document'}: ${i.message}`)
    : issues.map((i) => i.message)
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * The pipeline sets the mode; the model never does. Whatever `mode` the model wrote
 * on the document or on a screen is replaced by the one the request runs in — an
 * Exploratory request is stamped; a Faithful one carries no `mode` at all, as
 * before — and the values that differed are returned so the user can be told.
 */
function stampMode(doc: unknown, mode: ScreenMode): string[] {
  if (!isRecord(doc)) return []
  const differed: string[] = []
  const set = (target: Record<string, unknown>): void => {
    if (target.mode !== undefined && target.mode !== mode) differed.push(JSON.stringify(target.mode))
    if (mode === 'exploratory') target.mode = mode
    else delete target.mode
  }
  set(doc)
  if (Array.isArray(doc.screens)) doc.screens.filter(isRecord).forEach(set)
  return differed
}

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
  const notices: string[] = []

  try {
    // ── Step 0: Router ─────────────────────────────────────────────────────
    // No mode: Faithful, no router call. An explicit mode: no model call.
    let mode: ScreenMode = 'faithful'
    let faithfulAlternative: string | undefined
    if (options.mode === 'auto') {
      const route = await routeAuto(provider, userPrompt, manifest, options.model)
      usage = addUsage(usage, route.usage)
      steps.push(...route.steps)
      if (route.decision.kind === 'ask') {
        const { question } = route.decision
        return {
          ok: false,
          error: question.text,
          stage: 'router',
          question,
          meta: { source: 'llm', provider: provider.id, usage, durationMs: Date.now() - startedAt, steps },
        }
      }
      notices.push(...route.decision.notices)
      mode = route.decision.mode
      faithfulAlternative = route.decision.faithfulAlternative
    } else if (options.mode) {
      steps.push(`step 0 · router: explicit ${options.mode}`)
      notices.push(...explicitNotices(readRequest(userPrompt, manifest), manifest))
      if (options.mode === 'exploratory') mode = 'exploratory'
      if (options.mode === 'both') {
        // Never two generations: one Faithful, and the screen says so.
        notices.push(BOTH_FALLBACK_NOTICE)
        steps.push('step 0 · Os dois arrives in 9F — running one Faithful generation')
      }
    }
    const generatorMode = provider.id === 'api-key' ? 'tool' : 'json'
    const genSystem = buildSystemPrompt(generatorMode, manifest, mode)
    const plannerSystem = buildPlannerPrompt(manifest, { prompt: userPrompt, mode })
    // In Exploratory the planner starts from the router's faithful alternative and edits it.
    const plannerRequest =
      mode === 'exploratory' && faithfulAlternative
        ? `${userPrompt}\n\nThe same request kept inside the patterns — start from this plan and change only what the request needs to break:\n${faithfulAlternative}`
        : userPrompt
    const replans = mode === 'exploratory' ? maxReplans() : 0

    let plannerMessages: ChatTurn[] = [...history, { role: 'user', content: plannerRequest }]
    let lastBlueprint: unknown
    let lastErrors: string[] = []

    for (let replan = 0; ; replan++) {
      // ── Step 1: Planner ──────────────────────────────────────────────────
      const planner = await provider.complete({
        system: plannerSystem,
        messages: plannerMessages,
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

      // ── Steps 2 + 3: Generator + validation-retry loop ───────────────────
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

      let trigger: string | null = null
      let lastIssues: ValidationIssue[] = []
      lastErrors = []

      for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
        let errors: string[]
        let reply = ''
        try {
          const gen = await provider.renderUi({
            system: genSystem,
            messages: genMessages,
            model: options.model,
            effort: options.effort,
            mode,
          })
          usage = addUsage(usage, gen.usage)
          model = gen.model ?? model
          lastBlueprint = unwrapBlueprint(gen.blueprint)
          // The pipeline sets the mode, never the model.
          for (const wrote of stampMode(lastBlueprint, mode)) {
            const notice = `The model labelled a screen ${wrote}; the pipeline sets the mode, so it is "${mode}".`
            if (!notices.includes(notice)) notices.push(notice)
          }
          // A focus the level rules out, or a root that doesn't stretch, has one fix;
          // make it here rather than spend a retry on it — unless the screen declares it.
          const rested = restStrayFocus(lastBlueprint, manifest, mode)
          if (rested.length > 0) steps.push(`step 2 · rested ${rested.length} stray focus: ${rested.join('; ')}`)
          const stretched = stretchRoots(lastBlueprint, manifest, mode)
          if (stretched.length > 0) steps.push(`step 2 · stretched ${stretched.length} root(s): ${stretched.join('; ')}`)
          reply = JSON.stringify(lastBlueprint)

          const validation = validateBlueprintAgainstManifest(lastBlueprint, manifest, mode)
          if (validation.ok) {
            steps.push(`step 2 · generator: valid on attempt ${attempt}`)
            return success(lastBlueprint, provider, model, usage, steps, startedAt, stamp(mode, notices))
          }
          lastIssues = validation.issues
          errors = feedback(validation.issues, mode)
        } catch (err) {
          // A reply that isn't JSON is the model's mistake, not the provider's: say so and retry.
          if (!(err instanceof MalformedOutputError)) throw err
          reply = err.raw.slice(0, 6000)
          errors = [
            `Your reply was not valid JSON (${err.message}). Reply with ONLY the JSON object — no prose, no comments, no trailing commas, every key and string double-quoted.`,
          ]
          lastIssues = []
          if (attempt > MAX_RETRIES) throw err
        }

        lastErrors = errors
        steps.push(`step 3 · validate: attempt ${attempt} had ${errors.length} issue(s)`)

        // A composition choice that survived every generator retry is the plan's:
        // back to the planner, if it may go.
        if (replan < replans) {
          trigger = planTrigger(lastIssues, attempt <= MAX_RETRIES)
          if (trigger) break
        }

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

      if (trigger) {
        steps.push(`step 3 · replan ${replan + 1}/${replans} — trigger: ${trigger}`)
        plannerMessages = [
          ...plannerMessages,
          { role: 'assistant', content: planner.text },
          {
            role: 'user',
            content:
              `The screen built from that plan failed the audit:\n${feedback(lastIssues, mode).map((e) => `- ${e}`).join('\n')}\n\n` +
              `Write the corrected plan for the same request. Where the request needs a break, plan it with a "Deviation:" line; where it does not, keep the patterns.`,
          },
        ]
        continue
      }
      break
    }

    // Retries exhausted — hand back the best attempt; the renderer's interpreter
    // strips whatever is still wrong before it renders.
    steps.push(
      `step 3 · validate: still invalid after ${MAX_RETRIES} retr${MAX_RETRIES === 1 ? 'y' : 'ies'} ` +
        `(${lastErrors.length} issue(s)) — repairing on render`,
    )
    return success(lastBlueprint, provider, model, usage, steps, startedAt, stamp(mode, notices))
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

/** What every generated result carries: the mode it ran in, and what the pipeline tells the user. */
function stamp(mode: ScreenMode, notices: string[]): Pick<GenerateUIMeta, 'mode' | 'notices'> {
  return { mode, ...(notices.length > 0 ? { notices } : {}) }
}

function success(
  blueprint: unknown,
  provider: AiProvider,
  model: string | undefined,
  usage: GenerateUsage | undefined,
  steps: string[],
  startedAt: number,
  stamp: Pick<GenerateUIMeta, 'mode' | 'notices'>,
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
      ...stamp,
    },
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}
