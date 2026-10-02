/**
 * Phase 9G, the live half: runs the golden set (tests/eval/modes.golden.json) through the real pipeline and scores
 * every run (`score.ts`). It calls a real model, so it costs money — always look at the dry run first.
 *
 *   npm run eval:modes -- --stage 1 --dry-run         # the plan and its estimate, nothing runs
 *   npm run eval:modes -- --stage 1 --confirm         # stage 1: one run of everything, capped at US$ 40
 *   npm run eval:modes -- --stage 2 --confirm         # stage 2: runs 2 and 3, capped at US$ 70
 *   npm run eval:modes -- --router --confirm          # the Auto router alone, once per request
 *   npm run eval:modes -- --only p02,o01 --runs 1 --dry-run
 *
 * Jobs run mode by mode (the prompt cache stays warm) with 2 at a time. A job starts only while the spend so far,
 * plus what is running, plus its own estimate stays within the cap; the ones left out are listed. An existing
 * result file is skipped, so an interrupted stage resumes. Results go to eval/results/9g/ (gitignored), each
 * stamped with the git sha and the prompts' hashes.
 */

import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateUI } from '../electron/ai/ai-orchestrator'
import { routeAuto } from '../electron/ai/classify'
import { resolveProvider } from '../electron/ai/providers'
import { buildPlannerPrompt, buildSystemPrompt } from '@/design-system/promptSpec'
import { treeDeclarations } from '@/shared/design-system/deviations'
import { interpretPrototype } from '@/interpreter/interpret'
import { validateBlueprintAgainstManifest } from '@/shared/design-system/manifest-zod'
import { ruleById } from '@/shared/design-system/rules'
import { auditFrameLayout, summarizeChecks } from '@/shared/layout/frame'
import { screenMode, type BlueprintDocument, type CallUsage, type ScreenMode } from '@/shared/blueprint'
import { SCREENFLOW_MANIFEST as M } from '@/shared/design-system/screenflow-manifest'
import { consideredComponents, isPrimitive, PROPOSAL_TYPE } from '@/shared/design-system/primitives'
import {
  estimate,
  perGeneration,
  planJobs,
  scoreRun,
  summarizeCosts,
  withinCap,
  type GoldenRequest,
  type Job,
  type RunRecord,
  type RunScore,
} from './score'

// ── Arguments ────────────────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const has = (name: string) => args.includes(`--${name}`)
const flag = (name: string, fallback: string): string => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback
}
const STAGE = flag('stage', '')
const RUNS: number[] = STAGE === '1' ? [1] : STAGE === '2' ? [2, 3] : rangeOf(flag('runs', '1'))
const CAP = Number(flag('max-usd', STAGE === '2' ? '70' : '40'))
const POOL = Math.max(1, Number.parseInt(flag('pool', '2'), 10) || 2)
const ONLY = flag('only', '').split(',').filter(Boolean)
const OUT = flag('out', fileURLToPath(new URL('./results/9g', import.meta.url)))
const DRY = has('dry-run')
const CONFIRM = has('confirm')
const ROUTER = has('router')
/** Above this estimate a live run needs --confirm. */
const CONFIRM_ABOVE_USD = 10

function rangeOf(spec: string): number[] {
  const [a, b] = spec.split('-').map((n) => Number.parseInt(n, 10))
  return Array.from({ length: (b || a) - a + 1 }, (_, i) => a + i)
}

const golden = JSON.parse(readFileSync(new URL('../tests/eval/modes.golden.json', import.meta.url), 'utf8')) as { requests: GoldenRequest[] }
const requests = golden.requests.filter((r) => ONLY.length === 0 || ONLY.some((id) => r.id.startsWith(id)))
const byId = new Map(golden.requests.map((r) => [r.id, r]))

// ── What it costs: measured from every past result ──────────────────────────────────────────────
function pastCostsPerGeneration(dir: string): number[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) return pastCostsPerGeneration(p)
    if (!f.endsWith('.json') || f.startsWith('summary')) return []
    try {
      const r = JSON.parse(readFileSync(p, 'utf8'))
      const cost = r.meta?.usage?.costUsd
      return typeof cost === 'number' && cost > 0 && r.ok !== false ? [cost / (r.meta.branches ?? 1)] : []
    } catch {
      return []
    }
  })
}
const per = perGeneration(pastCostsPerGeneration(fileURLToPath(new URL('./results', import.meta.url))))

// ── The stamp: what this run's results can be compared on ───────────────────────────────────────
const hash = (s: string) => createHash('sha1').update(s).digest('hex').slice(0, 10)
const STAMP = {
  sha: (() => {
    try {
      const sha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
      // Results from an uncommitted tree are not comparable to a sha: say so in the stamp.
      return execSync('git status --porcelain', { encoding: 'utf8' }).trim() ? `${sha}-dirty` : sha
    } catch {
      return 'unknown'
    }
  })(),
  manifest: `${M.id}@${M.version}`,
  prompts: Object.fromEntries(
    (['faithful', 'exploratory'] as ScreenMode[]).map((m) => [m, { planner: hash(buildPlannerPrompt(M, { prompt: '', mode: m })), generator: hash(buildSystemPrompt('json', M, m)) }]),
  ),
}

// ── One run ─────────────────────────────────────────────────────────────────────────────────────
type Deviation = { ruleId: string; scope: 'node' | 'screen' }

/** Every declaration in a document; one on a screen's root counts as the screen's (screen rules may sit there). */
function declaredOf(doc: BlueprintDocument): Deviation[] {
  const out: Deviation[] = []
  const walk = (node: Record<string, any> | undefined, depth: number): void => {
    if (!node || typeof node !== 'object') return
    if (node.deviation) out.push({ ruleId: node.deviation.ruleId, scope: depth === 0 ? 'screen' : 'node' })
    ;(Array.isArray(node.children) ? node.children : []).forEach((c: Record<string, any>) => walk(c, depth + 1))
  }
  const screens = [{ screen: doc.screen, root: doc.root }, ...(doc.screens ?? [])] as Record<string, any>[]
  for (const s of screens) {
    walk(s.root, 0)
    for (const d of s.screen?.deviation ?? []) out.push({ ruleId: d.ruleId, scope: 'screen' })
  }
  return out
}

function vocabularyOf(tree: any): NonNullable<RunRecord['vocabulary']>[number] {
  const out = { primitives: [] as { consideredUnknown: string[] }[], maxChain: 0, proposals: [] as unknown[] }
  const walk = (node: any, chain: number): void => {
    const here = isPrimitive(node.type) ? chain + 1 : 0
    out.maxChain = Math.max(out.maxChain, here)
    if (isPrimitive(node.type)) out.primitives.push({ consideredUnknown: node.reuse ? consideredComponents(M, node.reuse.considered).unknown : [] })
    if (node.type === PROPOSAL_TYPE) out.proposals.push(node.props)
    node.children.forEach((c: any) => walk(c, here))
  }
  walk(tree, 0)
  return out
}

async function runJob(job: Job): Promise<number> {
  const req = byId.get(job.id)!
  const file = join(OUT, `${job.id}.${job.mode}.${job.run}.json`)
  if (existsSync(file)) return 0
  const t0 = Date.now()
  const res = await generateUI(req.prompt, [], { mode: job.mode, effort: 'medium' }, M)
  const out: Record<string, unknown> = { id: job.id, run: job.run, mode: job.mode, prompt: req.prompt, expected: req.expected, stamp: STAMP, ms: Date.now() - t0, ok: res.ok, meta: res.meta }
  if (res.ok) {
    const doc = res.blueprint
    const v = validateBlueprintAgainstManifest(doc, M, job.mode === 'both' ? 'faithful' : job.mode)
    const issues = v.ok ? [] : v.issues
    const interpreted = interpretPrototype(doc, M)
    Object.assign(out, {
      blueprint: doc,
      finalValid: v.ok,
      finalIssues: issues.map((i) => ({ ruleId: i.ruleId, kind: i.kind, path: i.path.join('.'), message: i.message })),
      lawsBroken: [...new Set(issues.filter((i) => ruleById(M, i.ruleId)?.flexibility === 'law').map((i) => i.ruleId))],
      declared: declaredOf(doc),
      notes: Array.isArray(doc.notes) ? doc.notes : [],
      vocabulary: interpreted.ok ? interpreted.screens.map((s) => vocabularyOf(s.tree)) : [],
      screens: interpreted.ok ? interpreted.screens.map((s) => ({ id: s.id, name: s.name, mode: s.mode ?? 'faithful' })) : [],
      // The canvas adds a measured Render check (overflow, overlap) this script cannot see: `eval:render` adds it.
      qa: interpreted.ok
        ? interpreted.screens.map((s) => {
            const checks = auditFrameLayout({ root: s.tree }, M, undefined, screenMode(s) === 'exploratory' ? treeDeclarations(s.tree, s.tree.screen) : [])
            return { id: s.id, ...summarizeChecks(checks), failing: checks.flatMap((c) => c.problems) }
          })
        : [],
    })
  }
  out.score = scoreRun(out as unknown as RunRecord, req.expected)
  writeFileSync(file, JSON.stringify(out, null, 2))
  const cost = res.meta.usage?.costUsd ?? 0
  console.log(`done ${job.id} ${job.mode} #${job.run} ok=${res.ok} ${Math.round((Date.now() - t0) / 1000)}s $${cost.toFixed(3)}`)
  return cost
}

// ── The router alone (Auto), once per request ───────────────────────────────────────────────────
async function routerPass(): Promise<void> {
  const provider = await resolveProvider()
  if (!provider) throw new Error('no AI provider')
  const rows: unknown[] = []
  let spent = 0
  for (const req of routed) {
    if (spent + per.mean / 2 > CAP) break
    const r = await routeAuto(provider, req.prompt, M)
    spent += r.usage?.costUsd ?? 0
    const got = r.decision.kind === 'go' ? r.decision.mode : r.decision.question.kind === 'law' ? 'law' : 'ask'
    rows.push({ id: req.id, expected: req.expected.router, got, ok: got === req.expected.router, usage: r.usage })
    console.log(`${req.id.padEnd(26)} expected ${req.expected.router?.padEnd(11)} got ${got}${got === req.expected.router ? '' : '   ✗'}`)
  }
  writeFileSync(join(OUT, `router.${STAMP.sha}.json`), JSON.stringify({ stamp: STAMP, spent, rows }, null, 2))
  console.log(`router: ${rows.filter((r: any) => r.ok).length}/${rows.length} as expected · $${spent.toFixed(2)}`)
}

// ── Main ────────────────────────────────────────────────────────────────────────────────────────
mkdirSync(OUT, { recursive: true })
const jobs = planJobs(requests, RUNS)
const pending = jobs.filter((j) => !existsSync(join(OUT, `${j.id}.${j.mode}.${j.run}.json`)))
// The router pass is one classifier call per request: about half a generation (a generation is a planner and a generator call).
const routed = requests.filter((r) => r.expected.router)
const est = ROUTER
  ? { generations: 0, mean: (routed.length * per.mean) / 2, low: (routed.length * per.low) / 2, high: (routed.length * per.high) / 2 }
  : estimate(pending, per)
const usd = (n: number) => `US$ ${n.toFixed(2)}`
console.log(
  (ROUTER
    ? `router pass · ${routed.length} requests with an expected Auto decision · ${routed.length} classifier calls\n`
    : `stage ${STAGE || '-'} · runs ${RUNS.join(',')} · ${requests.length} requests · ${pending.length}/${jobs.length} jobs to run · ${est.generations} generations\n`) +
    `per generation (measured, ${per.samples} past runs): mean ${usd(per.mean)}, ${usd(per.low)}–${usd(per.high)}\n` +
    `estimate: ${usd(est.mean)} (${usd(est.low)}–${usd(est.high)}) · cap ${usd(CAP)} · ${POOL} at a time, mode by mode\n` +
    `stamp: ${JSON.stringify(STAMP)}`,
)
if (DRY) {
  if (!ROUTER) for (const mode of ['faithful', 'exploratory', 'both'] as const) {
    const of = pending.filter((j) => j.mode === mode)
    if (of.length > 0) console.log(`  ${mode.padEnd(11)} ${of.length} jobs · ${usd(estimate(of, per).mean)}`)
  }
  if (est.mean > CAP) console.log(`  ⚠ the estimate is over the cap: the cap stops the stage at ${usd(CAP)}`)
  process.exit(0)
}
if (est.high > CONFIRM_ABOVE_USD && !CONFIRM) {
  console.log(`Refusing to run: the estimate tops ${usd(CONFIRM_ABOVE_USD)}. Re-run with --confirm (or --dry-run to look).`)
  process.exit(1)
}

if (ROUTER) {
  await routerPass()
} else {
  let spent = 0
  let inFlight = 0
  const skipped: Job[] = []
  let next = 0
  await Promise.all(
    Array.from({ length: POOL }, async () => {
      while (next < pending.length) {
        const job = pending[next++]
        if (!withinCap(spent, inFlight, job, per, CAP)) {
          skipped.push(job)
          continue
        }
        const reserved = job.generations * per.mean
        inFlight += reserved
        try {
          spent += await runJob(job)
        } catch (err) {
          // A failure is a result, never retried silently: it is recorded, so a later invocation skips it too. A retry
          // is a separate, logged run (delete the record by hand).
          const message = err instanceof Error ? err.message : String(err)
          writeFileSync(
            join(OUT, `${job.id}.${job.mode}.${job.run}.json`),
            JSON.stringify({ id: job.id, run: job.run, mode: job.mode, stamp: STAMP, ok: false, failure: 'threw', error: message, meta: { steps: [] } }, null, 2),
          )
          console.log(`job FAILED: ${job.id} ${job.mode} #${job.run}: ${message}`)
        } finally {
          inFlight -= reserved
        }
      }
    }),
  )
  if (skipped.length > 0) console.log(`\ncap ${usd(CAP)} reached — ${skipped.length} job(s) not run: ${skipped.map((j) => `${j.id}.${j.mode}#${j.run}`).join(', ')}`)
  summarize(spent)
}

// ── Summary ─────────────────────────────────────────────────────────────────────────────────────
function summarize(spent: number): void {
  const records = jobs
    .map((j) => join(OUT, `${j.id}.${j.mode}.${j.run}.json`))
    .filter(existsSync)
    .map((f) => JSON.parse(readFileSync(f, 'utf8')) as RunRecord & { score?: RunScore; failure?: string; error?: string })
  const failures = records.filter((r) => !r.score)
  const scores = records.filter((r) => r.score).map((r) => r.score!)
  if (failures.length > 0) console.log(`\nFAILED (not retried): ${failures.map((r) => `${r.id}.${r.mode}#${r.run}: ${r.error ?? 'no result'}`).join('; ')}`)
  const pct = (xs: boolean[]) => (xs.length ? `${xs.filter(Boolean).length}/${xs.length}` : '—')
  console.log('\nrequest · mode · runs · declared ok · scope ok · false · missed · laws held · failed attempts · replans · prims/props · lang · both · $')
  for (const req of requests) {
    for (const mode of req.modes) {
      const s = scores.filter((x) => x.id === req.id && x.mode === mode)
      if (s.length === 0) continue
      console.log(
        [
          req.id,
          mode,
          s.length,
          pct(s.map((x) => x.declareMatch)),
          pct(s.map((x) => x.scopeOk)),
          [...new Set(s.flatMap((x) => x.falseDeclarations))].join('+') || '—',
          [...new Set(s.flatMap((x) => x.missed))].join('+') || '—',
          pct(s.map((x) => x.lawHeld)),
          s.reduce((t, x) => t + x.failedAttempts, 0),
          s.reduce((t, x) => t + x.replanTriggers.length, 0),
          `${s.reduce((t, x) => t + x.primitives, 0)}/${s.reduce((t, x) => t + x.proposals, 0)}`,
          [...new Set(s.map((x) => x.notesLanguage))].join('+'),
          s[0].both ? s.map((x) => `${x.both!.outcome}${x.both!.ok ? '' : '✗'}`).join(' ') : '—',
          `$${s.reduce((t, x) => t + x.costUsd, 0).toFixed(2)}`,
        ].join(' · '),
      )
    }
  }
  const calls: CallUsage[] = records.flatMap((r) => r.meta.calls ?? [])
  const costs = summarizeCosts(calls)
  const byMode = Object.fromEntries(
    (['faithful', 'exploratory', 'both'] as const).map((m) => {
      const of = records.filter((r) => r.mode === m)
      const gens = of.reduce((t, r) => t + (r.meta.branches ?? 1), 0)
      return [m, gens ? of.reduce((t, r) => t + (r.meta.usage?.costUsd ?? 0), 0) / gens : 0]
    }),
  )
  const summary = { stamp: STAMP, stage: STAGE, runs: RUNS, spent, cap: CAP, records: records.length, costPerGeneration: byMode, costs }
  writeFileSync(join(OUT, `summary.stage${STAGE || 'x'}.json`), JSON.stringify({ ...summary, scores }, null, 2))
  console.log(
    `\nspent ${usd(spent)} this session · per generation: Faithful ${usd(byMode.faithful)}, Exploratory ${usd(byMode.exploratory)}, Os dois ${usd(byMode.both)}` +
      `\ncalls ${costs.calls}: cold ${costs.cold.calls} (${usd(costs.cold.usd)}), warm ${costs.warm.calls} (${usd(costs.warm.usd)})` +
      `\nshare of a call's cost that is the cached prefix: ${Object.entries(costs.prefixShareByStep).map(([k, v]) => `${k} ${(v * 100).toFixed(0)}%`).join(', ')}`,
  )
}
