/**
 * Phase 9G: scoring one recorded run against its golden expectation, the per-call cost analysis (cold vs warm, the
 * share of the fixed prefix), the job plan and its estimate, and the hard cost cap. Pure: the runner (`run.ts`) feeds
 * it, `score.test.ts` pins it.
 */

import type { CallUsage } from '@/shared/blueprint'
import { CACHE_READ_MULTIPLIER, CACHE_WRITE_MULTIPLIER, DEFAULT_MODEL_ID, priceOf } from '@/shared/models'

export type RunMode = 'faithful' | 'exploratory' | 'both'
export type BothOutcome = 'differ' | 'identical' | 'faithful-only' | 'branch-failed'

export interface Expected {
  router?: 'faithful' | 'exploratory' | 'ask' | 'law'
  declare: { ruleId: string; scope: 'node' | 'screen' }[]
  law?: string
  language?: 'en' | 'pt'
  both?: BothOutcome | 'any'
}

export interface GoldenRequest {
  id: string
  group: string
  modes: RunMode[]
  prompt: string
  expected: Expected
}

/** What `run.ts` records for one run (the fields the scorer reads). */
export interface RunRecord {
  id: string
  mode: RunMode
  run: number
  ok: boolean
  ms: number
  meta: {
    mode?: string
    usage?: { costUsd?: number }
    calls?: CallUsage[]
    trace?: { attempt: number; trigger?: string; issues: { ruleId: string; kind?: string }[] }[]
    steps: string[]
    notices?: string[]
    branches?: number
  }
  declared?: { ruleId: string; scope: 'node' | 'screen' }[]
  lawsBroken?: string[]
  notes?: string[]
  vocabulary?: { primitives: { consideredUnknown: string[] }[]; maxChain: number; proposals: unknown[] }[]
}

export interface RunScore {
  id: string
  mode: RunMode
  run: number
  ok: boolean
  /** The declared rules equal the expected ones (a Faithful run: none). */
  declareMatch: boolean
  /** Every declared rule sits at the scope the expectation gives it. */
  scopeOk: boolean
  falseDeclarations: string[]
  missed: string[]
  lawHeld: boolean
  lawsBroken: string[]
  failedAttempts: number
  firstAttempt: string[]
  replanTriggers: string[]
  primitives: number
  maxChain: number
  proposals: number
  /** Primitives whose `reuse.considered` named something that is not a component. */
  reuseUnknown: number
  notesLanguage: 'en' | 'pt' | 'none' | 'mixed'
  languageOk: boolean
  both?: { outcome: BothOutcome; ok: boolean }
  costUsd: number
  ms: number
}

// Words only Portuguese has ("card" is both: stage 1 read English notes about a card as mixed).
const PT = /[ãõçáéíóúâêô]|\b(não|tela|para|com|uma|um|está|botão|fica|foi)\b/i
const EN = /\b(the|is|are|and|button|screen|with|this|it)\b/i

/** Which language a set of notes is written in (a heuristic: enough for "came back in the request's language"). */
export function notesLanguage(notes: readonly string[]): RunScore['notesLanguage'] {
  if (notes.length === 0) return 'none'
  const langs = new Set(notes.map((n) => (PT.test(n) ? 'pt' : EN.test(n) ? 'en' : 'pt')))
  return langs.size > 1 ? 'mixed' : (([...langs][0] as 'en' | 'pt') ?? 'none')
}

export const BOTH_IDENTICAL_MARK = 'Exploratório não encontrou nada a quebrar'
export const BOTH_OVER_LIMIT_MARK = 'Os dois cabe até'
export const BOTH_FAILED_MARK = 'falhou'

/** What an Os dois run delivered, read from its mode and notices. */
export function bothOutcome(meta: RunRecord['meta']): BothOutcome {
  const notices = meta.notices ?? []
  if (notices.some((n) => n.includes(BOTH_OVER_LIMIT_MARK))) return 'faithful-only'
  if (notices.some((n) => n.includes(BOTH_FAILED_MARK))) return 'branch-failed'
  if (notices.some((n) => n.includes(BOTH_IDENTICAL_MARK))) return 'identical'
  return meta.mode === 'both' ? 'differ' : 'faithful-only'
}

export function scoreRun(record: RunRecord, expected: Expected): RunScore {
  const declared = record.declared ?? []
  // A Faithful run never declares; Exploratory and Os dois (its Exploratory screens) declare what is expected.
  const want = record.mode === 'faithful' ? [] : expected.declare
  const got = [...new Set(declared.map((d) => d.ruleId))].sort()
  const wanted = [...new Set(want.map((d) => d.ruleId))].sort()
  const scopeOf = new Map(want.map((d) => [d.ruleId, d.scope]))
  const trace = record.meta.trace ?? []
  const vocab = record.vocabulary ?? []
  const language = notesLanguage(record.notes ?? [])
  const both = record.mode === 'both' ? bothOutcome(record.meta) : undefined
  return {
    id: record.id,
    mode: record.mode,
    run: record.run,
    ok: record.ok,
    declareMatch: JSON.stringify(got) === JSON.stringify(wanted),
    scopeOk: declared.every((d) => !scopeOf.has(d.ruleId) || scopeOf.get(d.ruleId) === d.scope),
    falseDeclarations: got.filter((r) => !wanted.includes(r)),
    missed: wanted.filter((r) => !got.includes(r)),
    lawHeld: (record.lawsBroken ?? []).length === 0,
    lawsBroken: record.lawsBroken ?? [],
    failedAttempts: trace.length,
    firstAttempt: trace[0]?.issues.map((i) => `${i.ruleId}${i.kind ? `/${i.kind}` : ''}`) ?? [],
    replanTriggers: trace.filter((t) => t.trigger).map((t) => t.trigger!),
    primitives: vocab.reduce((s, v) => s + v.primitives.length, 0),
    maxChain: Math.max(0, ...vocab.map((v) => v.maxChain)),
    proposals: vocab.reduce((s, v) => s + v.proposals.length, 0),
    reuseUnknown: vocab.reduce((s, v) => s + v.primitives.filter((p) => p.consideredUnknown.length > 0).length, 0),
    notesLanguage: language,
    languageOk: !expected.language || language === 'none' || language === expected.language,
    ...(both ? { both: { outcome: both, ok: !expected.both || expected.both === 'any' || expected.both === both } } : {}),
    costUsd: record.meta.usage?.costUsd ?? 0,
    ms: record.ms,
  }
}

// ── Cost per call: cold vs warm, and the fixed prefix ───────────────────────────────────────────

export interface CallCost {
  step: CallUsage['step']
  branch?: CallUsage['branch']
  /** More prompt tokens written to the cache than read from it: the prefix was not warm. */
  cold: boolean
  reportedUsd: number
  /** Estimated from tokens at the model's price: the uncached input, cache writes, cache reads, output. */
  parts: { input: number; cacheWrite: number; cacheRead: number; output: number }
  /** The share of the estimated cost that is the cached prefix (writes + reads). */
  prefixShare: number
}

export function callCost(call: CallUsage, model: string | undefined = DEFAULT_MODEL_ID): CallCost {
  const price = priceOf(model) ?? priceOf(DEFAULT_MODEL_ID)!
  const perIn = price.inputPerMTok / 1e6
  const parts = {
    input: (call.inputTokens ?? 0) * perIn,
    cacheWrite: (call.cacheWriteTokens ?? 0) * perIn * CACHE_WRITE_MULTIPLIER,
    cacheRead: (call.cacheReadTokens ?? 0) * perIn * CACHE_READ_MULTIPLIER,
    output: ((call.outputTokens ?? 0) * price.outputPerMTok) / 1e6,
  }
  const total = parts.input + parts.cacheWrite + parts.cacheRead + parts.output
  return {
    step: call.step,
    ...(call.branch ? { branch: call.branch } : {}),
    cold: (call.cacheWriteTokens ?? 0) > (call.cacheReadTokens ?? 0),
    reportedUsd: call.costUsd ?? total,
    parts,
    prefixShare: total > 0 ? (parts.cacheWrite + parts.cacheRead) / total : 0,
  }
}

export interface CostSummary {
  calls: number
  cold: { calls: number; usd: number }
  warm: { calls: number; usd: number }
  /** Mean share of a call's estimated cost that is the cached prefix, per step. */
  prefixShareByStep: Record<string, number>
}

export function summarizeCosts(calls: readonly CallUsage[], model?: string): CostSummary {
  const costs = calls.map((c) => callCost(c, model))
  const sum = (xs: CallCost[]) => xs.reduce((s, c) => s + c.reportedUsd, 0)
  const cold = costs.filter((c) => c.cold)
  const warm = costs.filter((c) => !c.cold)
  const steps = [...new Set(costs.map((c) => c.step))]
  return {
    calls: costs.length,
    cold: { calls: cold.length, usd: sum(cold) },
    warm: { calls: warm.length, usd: sum(warm) },
    prefixShareByStep: Object.fromEntries(
      steps.map((s) => {
        const of = costs.filter((c) => c.step === s)
        return [s, of.reduce((t, c) => t + c.prefixShare, 0) / of.length]
      }),
    ),
  }
}

// ── The job plan, its estimate, and the cap ─────────────────────────────────────────────────────

export interface Job {
  id: string
  mode: RunMode
  run: number
  /** Generations the job runs: one, or two for Os dois. */
  generations: number
}

const MODE_ORDER: RunMode[] = ['faithful', 'exploratory', 'both']

/**
 * Every (request, mode, run) of the given runs, ordered so the prompt cache stays warm: all of one mode back to
 * back (its system prompts share their prefix), then the next mode; within a mode, run by run, request by request.
 */
export function planJobs(requests: readonly GoldenRequest[], runs: readonly number[]): Job[] {
  return MODE_ORDER.flatMap((mode) =>
    runs.flatMap((run) =>
      requests.filter((r) => r.modes.includes(mode)).map((r) => ({ id: r.id, mode, run, generations: mode === 'both' ? 2 : 1 })),
    ),
  )
}

/** The cost of one generation: a mean and a low–high range, from measured runs. */
export interface PerGeneration {
  mean: number
  low: number
  high: number
  samples: number
}

/** Measured cost per generation (`costUsd / generations` of past runs); the fallback when there are none. */
export function perGeneration(samples: readonly number[], fallback: PerGeneration = { mean: 0.45, low: 0.28, high: 0.6, samples: 0 }): PerGeneration {
  if (samples.length === 0) return fallback
  const sorted = [...samples].sort((a, b) => a - b)
  return { mean: sorted.reduce((s, x) => s + x, 0) / sorted.length, low: sorted[0], high: sorted[sorted.length - 1], samples: sorted.length }
}

export function estimate(jobs: readonly Job[], per: PerGeneration): { generations: number; mean: number; low: number; high: number } {
  const generations = jobs.reduce((s, j) => s + j.generations, 0)
  return { generations, mean: generations * per.mean, low: generations * per.low, high: generations * per.high }
}

/** Whether a job may start: what has been spent, plus what is running, plus this job, stays within the cap. */
export function withinCap(spentUsd: number, inFlightUsd: number, job: Job, per: PerGeneration, capUsd: number): boolean {
  return spentUsd + inFlightUsd + job.generations * per.mean <= capUsd
}
