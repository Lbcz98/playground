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
  AttemptLog,
  GenerateUIMeta,
  GenerateUIResponse,
  GenerateUsage,
  ScreenMode,
  CallUsage,
} from '@/shared/blueprint'
import { FIRST_SCREEN_ID, MAX_NOTES, MAX_SCREENS } from '@/shared/blueprint'
import { readRequest } from '@/shared/design-system/request-signals'
import { homeTemplate } from '@/shared/templates/home'
import { buildPlannerPrompt, buildSystemPrompt, templatesFor } from '@/design-system/promptSpec'
import { chooseTemplate, type TemplateChoice } from '@/shared/templates'
import type { DesignSystemManifest, ManifestScreenTemplate } from '@/shared/design-system/manifest'
import { SCREENFLOW_MANIFEST } from '@/shared/design-system/screenflow-manifest'
import { validateBlueprintAgainstManifest, type ValidationIssue } from '@/shared/design-system/manifest-zod'
import { budgetProblems, isPrimitive, PROPOSAL_TYPE } from '@/shared/design-system/primitives'
import { nodeDeclarationConflicts } from '@/shared/design-system/deviations'
import { interpretPrototype } from '@/interpreter/interpret'
import { restStrayFocus, stretchRoots } from '@/shared/layout/frame'
import { addUsage, resolveProvider, type AiProvider } from './providers'
import { MalformedOutputError, unwrapBlueprint } from './providers/types'
import { routeAuto } from './classify'
import { explicitNotices } from './router'

const MAX_RETRIES = clamp(Number.parseInt(process.env.AI_MAX_VALIDATION_RETRIES ?? '', 10) || 2, 0, 4)


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
  const calls: CallUsage[] = []
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
      calls.push({ step: 'router', ...route.usage })
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
    }
    const acc: Tally = { usage, model, calls }
    const base: Omit<BranchArgs, 'mode' | 'plannerMessages'> = { provider, manifest, options, request: userPrompt, steps, notices, trace: [], acc }
    try {
      if (options.mode === 'both') {
        const res = await runBoth(userPrompt, history, base)
        return success(res.blueprint, provider, acc.model, acc.usage, steps, startedAt, {
          ...stamp(res.mode, notices, base.trace),
          ...(res.branches > 1 ? { branches: res.branches } : {}),
          calls,
        })
      }
      // In Exploratory the planner starts from the router's faithful alternative and edits it.
      const plannerRequest =
        mode === 'exploratory' && faithfulAlternative ? withFaithfulAlternative(userPrompt, faithfulAlternative) : userPrompt
      const out = await runBranch({ ...base, mode, plannerMessages: [...history, { role: 'user', content: plannerRequest }] })
      return success(out.blueprint, provider, acc.model, acc.usage, steps, startedAt, { ...stamp(mode, notices, base.trace), calls })
    } finally {
      // What the calls cost, for the error reply too.
      usage = acc.usage
      model = acc.model
    }
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
        ...(calls.length > 0 ? { calls } : {}),
      },
    }
  }
}

/** What the calls of a run add up to — shared by both branches of "Os dois". */
interface Tally {
  usage?: GenerateUsage
  model?: string
  calls: CallUsage[]
}

/** Add one call's usage to the run's total and to its list of calls. */
function tally(acc: Tally, usage: GenerateUsage | undefined, call: Omit<CallUsage, keyof GenerateUsage>): void {
  acc.usage = addUsage(acc.usage, usage)
  acc.calls.push({ ...call, ...usage })
}

interface BranchArgs {
  provider: AiProvider
  manifest: DesignSystemManifest
  options: GenerateOptions
  mode: ScreenMode
  /** The user's request, verbatim: the generator is shown it after the plan, for the language of everything it writes for the user. */
  request: string
  /** The conversation the planner sees (history and the request). */
  plannerMessages: ChatTurn[]
  /** A plan already made (the shared Faithful plan of "Os dois"): the first planner call is skipped. */
  firstPlan?: string
  /** The template locked for the whole run ("Os dois"): every plan of this branch starts from it. Else each plan picks. */
  template?: TemplateChoice<ManifestScreenTemplate>
  /** "Os dois": the branch tag on its steps (`[F] `, `[E] `) and attempts. */
  branch?: 'F' | 'E'
  steps: string[]
  notices: string[]
  trace: AttemptLog[]
  acc: Tally
}

/**
 * The user's request, after the plan. The generator otherwise sees only the plan and copies its language (stage 1 and
 * C1: English notes for a Portuguese request and the reverse). The plan stays authoritative for what to build.
 */
export const originalRequestBlock = (request: string): string =>
  `\n\nOriginal request (the plan is authoritative for what to build; this is also the language for "notes", each "deviation.why" and a Proposal's "description"):\n${request}`

const withFaithfulAlternative = (prompt: string, plan: string): string =>
  `${prompt}\n\nThe same request kept inside the patterns — start from this plan and change only what the request needs to break:\n${plan}`

/**
 * One generation: planner → generator → validation, with the generator's retries and (Exploratory) the replans.
 * Returns the valid document, or the best attempt once retries are exhausted (the interpreter repairs the rest).
 */
async function runBranch(a: BranchArgs): Promise<{ blueprint: unknown; valid: boolean }> {
  const { provider, manifest, options, mode, acc, notices, trace } = a
  const step = (line: string): void => void a.steps.push(a.branch ? `[${a.branch}] ${line}` : line)
  const generatorMode = provider.id === 'api-key' ? 'tool' : 'json'
  const genSystem = buildSystemPrompt(generatorMode, manifest, mode)
  const plannerSystem = buildPlannerPrompt(manifest, { prompt: String(a.plannerMessages.at(-1)?.content ?? ''), mode })
  const replans = mode === 'exploratory' ? maxReplans() : 0

  let plannerMessages = a.plannerMessages
  let lastBlueprint: unknown
  let lastErrors: string[] = []

  for (let replan = 0; ; replan++) {
    // ── Step 1: Planner ──────────────────────────────────────────────────
    let planText: string
    if (replan === 0 && a.firstPlan !== undefined) {
      planText = a.firstPlan
    } else {
      const planner = await provider.complete({
        system: plannerSystem,
        messages: plannerMessages,
        model: options.model,
        effort: 'low', // planning is structural — keep it cheap
      })
      tally(acc, planner.usage, { step: 'planner', ...(a.branch ? { branch: a.branch } : {}), attempt: replan })
      acc.model = planner.model
      planText = planner.text
    }
    const planLines = planText.split('\n').filter((l) => l.trim().length > 0).length

    // The screen this generation starts from: the planner names one, or the model
    // it planned picks one — unless the run locked one ("Os dois": both branches
    // start from the same template, so they stay comparable).
    const choice = a.template ?? chooseTemplate(planText, templatesFor(manifest))
    step(
      `step 1 · planner: ${planLines}-line plan` +
        (choice.template ? ` · template: ${choice.template.id} (${a.template ? 'locked' : choice.reason})` : ` · template: ${choice.reason}`),
    )

    // ── Steps 2 + 3: Generator + validation-retry loop ───────────────────
    const reference = choice.template
      ? `Start from this screen — it is valid, and it is the shape the plan describes.\n` +
        `Keep its structure and change only what the plan asks for; drop what the plan\n` +
        `does not mention.\n\nTEMPLATE "${choice.template.id}" (${choice.template.name}):\n` +
        `${JSON.stringify(choice.template.blueprint, null, 2)}\n\n`
      : ''
    const genMessages: ChatTurn[] = [{ role: 'user', content: `${reference}Build exactly this plan as the Blueprint JSON.\n\nPLAN:\n${planText}${originalRequestBlock(a.request)}` }]

    let trigger: string | null = null
    let lastIssues: ValidationIssue[] = []
    lastErrors = []

    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      let errors: string[]
      let reply = ''
      try {
        const gen = await provider.renderUi({ system: genSystem, messages: genMessages, model: options.model, effort: options.effort, mode, manifest })
        tally(acc, gen.usage, { step: 'generator', ...(a.branch ? { branch: a.branch } : {}), attempt })
        acc.model = gen.model ?? acc.model
        lastBlueprint = unwrapBlueprint(gen.blueprint)
        // The pipeline sets the mode, never the model.
        for (const wrote of stampMode(lastBlueprint, mode)) {
          const notice = `The model labelled a screen ${wrote}; the pipeline sets the mode, so it is "${mode}".`
          if (!notices.includes(notice)) notices.push(notice)
        }
        // A focus the level rules out, or a root that doesn't stretch, has one fix;
        // make it here rather than spend a retry on it — unless the screen declares it.
        const rested = restStrayFocus(lastBlueprint, manifest, mode)
        if (rested.length > 0) step(`step 2 · rested ${rested.length} stray focus: ${rested.join('; ')}`)
        const stretched = stretchRoots(lastBlueprint, manifest, mode)
        if (stretched.length > 0) step(`step 2 · stretched ${stretched.length} root(s): ${stretched.join('; ')}`)
        reply = JSON.stringify(lastBlueprint)

        const checked = validateBlueprintAgainstManifest(lastBlueprint, manifest, mode)
        // The primitive budget is counted on the interpreted tree: what the repairs drop or keep is what counts.
        const budget = mode === 'exploratory' ? budgetIssues(lastBlueprint, manifest) : []
        const all = [...(checked.ok ? [] : checked.issues), ...budget]
        if (all.length === 0) {
          step(`step 2 · generator: valid on attempt ${attempt}`)
          return { blueprint: lastBlueprint, valid: true }
        }
        lastIssues = all
        errors = feedback(all, mode)
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
      step(`step 3 · validate: attempt ${attempt} had ${errors.length} issue(s)`)
      const logged: AttemptLog = {
        ...(a.branch ? { branch: a.branch } : {}),
        plan: replan,
        attempt,
        issues: lastIssues.length > 0
          ? lastIssues.map((i) => ({ ruleId: i.ruleId, ...(i.kind ? { kind: i.kind } : {}), path: i.path, message: i.message }))
          : errors.map((message) => ({ ruleId: 'blueprint.dsl', path: [], message })), // a reply that was not JSON
      }
      const conflicts = nodeDeclarationConflicts(lastBlueprint, lastIssues)
      if (conflicts.length > 0) logged.nodeDeclarationConflicts = conflicts
      trace.push(logged)

      // A composition choice that survived every generator retry is the plan's:
      // back to the planner, if it may go.
      if (replan < replans) {
        trigger = planTrigger(lastIssues, attempt <= MAX_RETRIES)
        if (trigger) {
          logged.trigger = trigger
          break
        }
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
      step(`step 3 · replan ${replan + 1}/${replans} — trigger: ${trigger}`)
      plannerMessages = [
        ...plannerMessages,
        { role: 'assistant', content: planText },
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
  step(
    `step 3 · validate: still invalid after ${MAX_RETRIES} retr${MAX_RETRIES === 1 ? 'y' : 'ies'} ` +
      `(${lastErrors.length} issue(s)) — repairing on render`,
  )
  return { blueprint: lastBlueprint, valid: false }
}

// ── "Os dois" ──────────────────────────────────────────────────────────────────────────────────

/** Screens per mode in "Os dois": both branches together stay within the document's MAX_SCREENS. */
export const BOTH_MAX_SCREENS_PER_MODE = MAX_SCREENS / 2

export const BOTH_IDENTICAL_NOTICE = 'Exploratório não encontrou nada a quebrar — só a tela Fidedigna foi mantida.'

const overLimitNotice = (count: number): string =>
  `Os dois cabe até ${BOTH_MAX_SCREENS_PER_MODE} telas por modo (máx. ${MAX_SCREENS}); este fluxo tem ${count} — gerado só em Fidedigno. Peça o Exploratório separadamente.`

/** How many screens a plan lays out: its "Screen <id>:" headings, or one. */
export function plannedScreens(planText: string): number {
  return Math.max(1, (planText.match(/^[ \t]*screen[ \t]+[A-Za-z0-9_-]+[ \t]*:/gim) ?? []).length)
}

/**
 * "Os dois": the Faithful plan once, the template chosen once from it (the template lock), then the Faithful and
 * the Exploratory branch in parallel — the Exploratory planner starting from the Faithful plan — merged into one
 * document. A flow of more than BOTH_MAX_SCREENS_PER_MODE screens runs Faithful only; an Exploratory result
 * structurally identical to the Faithful one is dropped; a failed branch leaves the other.
 */
async function runBoth(
  userPrompt: string,
  history: ChatTurn[],
  base: Omit<BranchArgs, 'mode' | 'plannerMessages'>,
): Promise<{ blueprint: unknown; mode: ScreenMode | 'both'; branches: number }> {
  const { provider, manifest, options, acc, steps, notices } = base
  const request: ChatTurn[] = [...history, { role: 'user', content: userPrompt }]
  const planner = await provider.complete({
    system: buildPlannerPrompt(manifest, { prompt: userPrompt, mode: 'faithful' }),
    messages: request,
    model: options.model,
    effort: 'low',
  })
  tally(acc, planner.usage, { step: 'planner', attempt: 0 })
  acc.model = planner.model
  const template = chooseTemplate(planner.text, templatesFor(manifest))
  const count = plannedScreens(planner.text)
  steps.push(`step 1 · Os dois: one Faithful plan (${count} screen${count === 1 ? '' : 's'}) · template: ${template.template?.id ?? template.reason}, locked for both branches`)

  const faithful = (): Promise<{ blueprint: unknown; valid: boolean }> =>
    runBranch({ ...base, mode: 'faithful', branch: 'F', plannerMessages: request, firstPlan: planner.text, template })

  if (count > BOTH_MAX_SCREENS_PER_MODE) {
    notices.push(overLimitNotice(count))
    return { blueprint: mergeBranches((await faithful()).blueprint, null), mode: 'faithful', branches: 1 }
  }

  const [f, e] = await Promise.allSettled([
    faithful(),
    runBranch({
      ...base,
      mode: 'exploratory',
      branch: 'E',
      plannerMessages: [...history, { role: 'user', content: withFaithfulAlternative(userPrompt, planner.text) }],
      template,
    }),
  ])
  const failed = (r: PromiseSettledResult<unknown>): string => (r.status === 'rejected' ? (r.reason instanceof Error ? r.reason.message : String(r.reason)) : '')
  if (f.status === 'rejected' && e.status === 'rejected') throw f.reason
  if (e.status === 'rejected') {
    notices.push(`Exploratório falhou (${failed(e)}) — só a tela Fidedigna foi gerada.`)
    return { blueprint: mergeBranches((f as PromiseFulfilledResult<{ blueprint: unknown }>).value.blueprint, null), mode: 'faithful', branches: 1 }
  }
  if (f.status === 'rejected') {
    notices.push(`Fidedigno falhou (${failed(f)}) — só a tela Exploratória foi gerada.`)
    return { blueprint: mergeBranches(null, e.value.blueprint), mode: 'exploratory', branches: 1 }
  }
  // The plan's headings can undercount (a planner that writes the first screen without a "Screen <id>:" heading): count
  // what the branches actually produced, since the merged document may not exceed MAX_SCREENS.
  const produced = Math.max(screensOf(f.value.blueprint).length, screensOf(e.value.blueprint).length)
  if (produced > BOTH_MAX_SCREENS_PER_MODE) {
    notices.push(overLimitNotice(produced))
    steps.push(`step 4 · Os dois: the branches produced ${produced} screens, over the limit — only the Faithful screens were kept`)
    return { blueprint: mergeBranches(f.value.blueprint, null), mode: 'faithful', branches: 2 }
  }
  const identical = sameScreens(f.value.blueprint, e.value.blueprint, manifest)
  if (identical || declaresNothing(e.value.blueprint)) {
    notices.push(BOTH_IDENTICAL_NOTICE)
    steps.push(
      identical
        ? 'step 4 · Os dois: the Exploratory screens are structurally identical to the Faithful ones — dropped'
        : 'step 4 · Os dois: the Exploratory screens declare no deviation, Proposal or primitive — dropped',
    )
    return { blueprint: mergeBranches(f.value.blueprint, null), mode: 'faithful', branches: 2 }
  }
  steps.push('step 4 · Os dois: merged the Faithful and the Exploratory screens')
  return { blueprint: mergeBranches(f.value.blueprint, e.value.blueprint), mode: 'both', branches: 2 }
}

/**
 * Whether an Exploratory document declares nothing: no deviation on a node or a screen, no composed-overlay `shades`,
 * no Proposal and no primitive. Such a screen only reshuffles what the patterns allow, so it adds nothing to "Os dois".
 */
function declaresNothing(doc: unknown): boolean {
  const walk = (node: unknown): boolean => {
    if (!isRecord(node)) return true
    if (node.deviation || node.type === PROPOSAL_TYPE || isPrimitive(node.type)) return false
    return (Array.isArray(node.children) ? node.children : []).every(walk)
  }
  return screensOf(doc).every((s) => {
    const spec = isRecord(s.screen) ? s.screen : {}
    const declared = Array.isArray(spec.deviation) && spec.deviation.length > 0
    return !declared && spec.shades === undefined && walk(s.root)
  })
}

/** The interpreted screens of a document with every node id set aside — what the canvas would show. */
function shapeOf(doc: unknown, manifest: DesignSystemManifest): string | null {
  const interpreted = interpretPrototype(doc, manifest)
  if (!interpreted.ok) return null
  return JSON.stringify(interpreted.screens.map((s) => s.tree), (key, value) => (key === 'id' ? undefined : value))
}

/** Whether two documents would put structurally the same screens on the canvas (ids aside). */
function sameScreens(a: unknown, b: unknown, manifest: DesignSystemManifest): boolean {
  const shape = shapeOf(a, manifest)
  return shape !== null && shape === shapeOf(b, manifest)
}

type RawScreen = Record<string, unknown> & { id?: string; name?: string; root?: unknown }

/** A document's screens in order: the first (the document itself), then `screens`. */
function screensOf(doc: unknown): RawScreen[] {
  if (!isRecord(doc)) return []
  const { screens, version: _v, notes: _n, ...first } = doc
  return [first as RawScreen, ...(Array.isArray(screens) ? screens.filter(isRecord) : [])] as RawScreen[]
}

/**
 * The two branches as one document (or the one that survived — pass null for the other): Faithful screens first (`faithful-1…`, "Fidedigno"), then the Exploratory
 * ones (`exploratory-1…`, "Exploratório") — names, ids, links and modes set here, never by the model. Each
 * branch's links are rewritten to its own screens, so a Faithful screen never leads into an Exploratory one.
 */
export function mergeBranches(faithful: unknown | null, exploratory: unknown | null): BlueprintDocument {
  const branch = (doc: unknown, prefix: string, label: string, mode: ScreenMode): RawScreen[] => {
    const screens = screensOf(doc)
    const ids = new Map(screens.map((s, i) => [String(s.id ?? FIRST_SCREEN_ID), `${prefix}-${i + 1}`]))
    const relink = (node: unknown): void => {
      if (!isRecord(node)) return
      if (typeof node.goTo === 'string' && ids.has(node.goTo)) node.goTo = ids.get(node.goTo)
      if (Array.isArray(node.children)) node.children.forEach(relink)
    }
    return screens.map((s, i) => {
      const out: RawScreen = structuredClone(s)
      relink(out.root)
      out.id = `${prefix}-${i + 1}`
      out.name = screens.length === 1 ? label : `${label} · ${s.name ?? s.id ?? i + 1}`
      if (mode === 'exploratory') out.mode = mode
      else delete out.mode
      return out
    })
  }
  const all = [
    ...(faithful !== null ? branch(faithful, 'faithful', 'Fidedigno', 'faithful') : []),
    ...(exploratory !== null ? branch(exploratory, 'exploratory', 'Exploratório', 'exploratory') : []),
  ]
  const notesOf = (doc: unknown): string[] => (isRecord(doc) && Array.isArray(doc.notes) ? doc.notes.filter((n): n is string => typeof n === 'string') : [])
  // A document carries at most MAX_NOTES notes (the interpreter cuts the rest): with both branches, half each,
  // labelled, so the Exploratory screen's notes are never all pushed out by the Faithful ones.
  const half = MAX_NOTES / 2
  const notes =
    faithful !== null && exploratory !== null
      ? [
          ...notesOf(faithful).slice(0, half).map((n) => `Fidedigno: ${n}`),
          ...notesOf(exploratory).slice(0, half).map((n) => `Exploratório: ${n}`),
        ]
      : notesOf(faithful ?? exploratory)
  const [first, ...rest] = all
  return { version: 1, ...first, ...(notes.length > 0 ? { notes } : {}), screens: rest } as unknown as BlueprintDocument
}

/**
 * The primitive budget of a document, on the tree the interpreter makes of it, with
 * each screen's issues placed under that screen in the document (`['screens', i, …]`).
 */
function budgetIssues(doc: unknown, manifest: DesignSystemManifest): ValidationIssue[] {
  const interpreted = interpretPrototype(doc, manifest)
  if (!interpreted.ok) return []
  const raw = isRecord(doc) && Array.isArray(doc.screens) ? doc.screens : []
  const many = interpreted.screens.length > 1
  return interpreted.screens.flatMap((screen, index) => {
    const at = raw.findIndex((s) => isRecord(s) && s.id === screen.id)
    const base = index === 0 || at < 0 ? [] : ['screens', at]
    return budgetProblems(screen.tree).map((p) => ({
      ...p,
      path: [...base, ...p.path],
      message: many ? `Screen "${screen.id}": ${p.message}` : p.message,
    }))
  })
}

/** What every generated result carries: the mode it ran in, and what the pipeline tells the user. */
function stamp(mode: ScreenMode | 'both', notices: string[], trace: AttemptLog[]): Pick<GenerateUIMeta, 'mode' | 'notices' | 'trace'> {
  return { mode, ...(notices.length > 0 ? { notices } : {}), ...(trace.length > 0 ? { trace } : {}) }
}

function success(
  blueprint: unknown,
  provider: AiProvider,
  model: string | undefined,
  usage: GenerateUsage | undefined,
  steps: string[],
  startedAt: number,
  stamp: Pick<GenerateUIMeta, 'mode' | 'notices' | 'trace' | 'branches' | 'calls'>,
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
