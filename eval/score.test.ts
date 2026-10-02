/** Phase 9G: the scorer, the cost analysis, the job plan, the estimate and the cap — all model-free. */
import { describe, expect, it } from 'vitest'
import {
  bothOutcome,
  callCost,
  estimate,
  notesLanguage,
  perGeneration,
  planJobs,
  scoreRun,
  summarizeCosts,
  withinCap,
  type GoldenRequest,
  type RunRecord,
} from './score'

const record = (over: Partial<RunRecord> = {}): RunRecord => ({
  id: 'p02-centered',
  mode: 'exploratory',
  run: 1,
  ok: true,
  ms: 30000,
  meta: { steps: [], usage: { costUsd: 0.4 } },
  declared: [{ ruleId: 'layout.no-static-center', scope: 'screen' }],
  lawsBroken: [],
  notes: ['O menu fica no meio da tela.'],
  vocabulary: [{ primitives: [], maxChain: 0, proposals: [] }],
  ...over,
})
const centered = { declare: [{ ruleId: 'layout.no-static-center', scope: 'screen' as const }] }

describe('scoreRun', () => {
  it('an Exploratory run that declares exactly the expected rule, at its scope, passes', () => {
    const s = scoreRun(record(), centered, 'pattern')
    expect(s).toMatchObject({ pass: true, requiredMet: true, scopeOk: true, missed: [], legitimateExtras: [], falsePositives: [], lawHeld: true, costUsd: 0.4 })
  })

  it('a Faithful run is held to declaring nothing, whatever the request expects', () => {
    expect(scoreRun(record({ mode: 'faithful', declared: [] }), centered, 'pattern').pass).toBe(true)
    expect(scoreRun(record({ mode: 'faithful' }), centered, 'pattern')).toMatchObject({ pass: false, falsePositives: ['layout.no-static-center'] })
  })

  it('a missed required declaration fails; so does one at the wrong scope; a broken law is named', () => {
    expect(scoreRun(record({ declared: [] }), centered, 'pattern')).toMatchObject({ pass: false, requiredMet: false, missed: ['layout.no-static-center'] })
    const s = scoreRun(record({ declared: [{ ruleId: 'layout.no-static-center', scope: 'node' }], lawsBroken: ['tokens.only'] }), centered, 'pattern')
    expect(s).toMatchObject({ pass: false, requiredMet: true, scopeOk: false, lawHeld: false, lawsBroken: ['tokens.only'] })
  })

  it('an extra the validator accepted is legitimate in a pattern, variant or Os dois request — not a miss', () => {
    const both = [{ ruleId: 'level.module-limit', scope: 'screen' as const }, { ruleId: 'level.root-direction', scope: 'screen' as const }]
    const limit = { declare: [{ ruleId: 'level.module-limit', scope: 'screen' as const }] }
    for (const group of ['pattern', 'variant']) {
      expect(scoreRun(record({ declared: both, finalValid: true }), limit, group)).toMatchObject({ pass: true, legitimateExtras: ['level.root-direction'], falsePositives: [] })
    }
    // Not accepted by the validator (the final document is invalid): the extra counts against the run.
    expect(scoreRun(record({ declared: both, finalValid: false }), limit, 'pattern')).toMatchObject({ pass: false, falsePositives: ['level.root-direction'] })
  })

  it('any extra is a false positive in a baseline, no-break, law-trap or convention request', () => {
    for (const group of ['baseline', 'no-break', 'law', 'convention']) {
      expect(scoreRun(record({ finalValid: true }), { declare: [] }, group), group).toMatchObject({ pass: false, falsePositives: ['layout.no-static-center'], legitimateExtras: [] })
    }
  })

  it('Os dois: the Fidedigno screens must declare nothing; the Exploratório screens may declare what the validator accepts', () => {
    const run = (declared: RunRecord['declared']) => scoreRun(record({ mode: 'both', declared, finalValid: true, meta: { steps: [], mode: 'both' } }), { declare: [], both: 'any' }, 'both')
    expect(run([{ ruleId: 'flow.next-level', scope: 'node', mode: 'exploratory' }])).toMatchObject({ pass: true, legitimateExtras: ['flow.next-level'] })
    expect(run([{ ruleId: 'flow.next-level', scope: 'node', mode: 'faithful' }])).toMatchObject({ pass: false, falsePositives: ['flow.next-level'] })
  })

  it('reads attempts, the first attempt’s issues, replan triggers and the vocabulary', () => {
    const s = scoreRun(
      record({
        meta: {
          steps: [],
          trace: [
            { attempt: 1, issues: [{ ruleId: 'frame.layout' }, { ruleId: 'layout.slots', kind: 'undeclared-deviation' }] },
            { attempt: 3, trigger: 'undeclared-deviation (layout.slots)', issues: [] },
          ],
        },
        vocabulary: [{ primitives: [{ consideredUnknown: [] }, { consideredUnknown: ['Slider'] }], maxChain: 2, proposals: [{}] }],
      }),
      centered,
      'pattern',
    )
    expect(s).toMatchObject({ failedAttempts: 2, firstAttempt: ['frame.layout', 'layout.slots/undeclared-deviation'], primitives: 2, maxChain: 2, proposals: 1, reuseUnknown: 1 })
    expect(s.replanTriggers).toEqual(['undeclared-deviation (layout.slots)'])
  })

  it('checks the notes come back in the request’s language', () => {
    expect(notesLanguage(['The button opens the statistics.'])).toBe('en')
    expect(notesLanguage(['The card reads "Match statistics" instead of "Click here".', 'The team names are placeholders.'])).toBe('en')
    expect(notesLanguage(['O botão abre as estatísticas.'])).toBe('pt')
    expect(notesLanguage([])).toBe('none')
    expect(scoreRun(record({ notes: ['O botão abre as estatísticas.'] }), { declare: [], language: 'en' }, 'convention').languageOk).toBe(false)
    expect(scoreRun(record({ notes: ['The label names its action.'], declared: [] }), { declare: [], language: 'en' }, 'convention').languageOk).toBe(true)
  })

  it('reads what an Os dois run delivered', () => {
    expect(bothOutcome({ steps: [], mode: 'both' })).toBe('differ')
    expect(bothOutcome({ steps: [], mode: 'faithful', notices: ['Exploratório não encontrou nada a quebrar — só a tela Fidedigna foi mantida.'] })).toBe('identical')
    expect(bothOutcome({ steps: [], mode: 'faithful', notices: ['Os dois cabe até 3 telas por modo (máx. 6); este fluxo tem 4'] })).toBe('faithful-only')
    expect(bothOutcome({ steps: [], mode: 'faithful', notices: ['Exploratório falhou (x) — só a tela Fidedigna foi gerada.'] })).toBe('branch-failed')
    const s = scoreRun(record({ mode: 'both', meta: { steps: [], mode: 'faithful', notices: ['Exploratório não encontrou nada a quebrar'] }, declared: [] }), { declare: [], both: 'identical' }, 'both')
    expect(s.both).toEqual({ outcome: 'identical', ok: true })
  })
})

describe('cost per call', () => {
  it('splits a call into input, cache writes (1.25×), cache reads (0.1×) and output, and calls it cold when it wrote more than it read', () => {
    const c = callCost({ step: 'planner', inputTokens: 1_000_000, cacheWriteTokens: 1_000_000, cacheReadTokens: 0, outputTokens: 0, costUsd: 11.25 }, 'claude-opus-5')
    expect(c.parts).toEqual({ input: 5, cacheWrite: 6.25, cacheRead: 0, output: 0 })
    expect(c.cold).toBe(true)
    expect(c.prefixShare).toBeCloseTo(6.25 / 11.25)
    expect(callCost({ step: 'generator', cacheReadTokens: 10, cacheWriteTokens: 1 }).cold).toBe(false)
  })

  it('sums cold and warm calls and the prefix share per step', () => {
    const s = summarizeCosts([
      { step: 'planner', cacheWriteTokens: 20000, costUsd: 0.2 },
      { step: 'planner', cacheReadTokens: 20000, costUsd: 0.02 },
      { step: 'generator', cacheReadTokens: 20000, outputTokens: 2000, costUsd: 0.06 },
    ])
    expect(s.cold).toEqual({ calls: 1, usd: 0.2 })
    expect(s.warm.calls).toBe(2)
    expect(s.warm.usd).toBeCloseTo(0.08)
    expect(s.prefixShareByStep.planner).toBe(1)
    expect(s.prefixShareByStep.generator).toBeLessThan(1)
  })
})

describe('the job plan, the estimate and the cap', () => {
  const reqs: GoldenRequest[] = [
    { id: 'a', group: 'pattern', modes: ['faithful', 'exploratory'], prompt: 'x', expected: { declare: [] } },
    { id: 'b', group: 'pattern', modes: ['faithful', 'exploratory'], prompt: 'y', expected: { declare: [] } },
    { id: 'o', group: 'both', modes: ['both'], prompt: 'z', expected: { declare: [] } },
  ]

  it('orders jobs mode by mode, so one mode’s prompts stay warm back to back', () => {
    expect(planJobs(reqs, [1]).map((j) => `${j.mode}:${j.id}`)).toEqual(['faithful:a', 'faithful:b', 'exploratory:a', 'exploratory:b', 'both:o'])
    expect(planJobs(reqs, [2, 3]).filter((j) => j.mode === 'faithful').map((j) => `${j.id}#${j.run}`)).toEqual(['a#2', 'b#2', 'a#3', 'b#3'])
  })

  it('counts an Os dois job as two generations and estimates from the measured cost per generation', () => {
    const per = perGeneration([0.3, 0.5, 0.4])
    expect(per).toMatchObject({ low: 0.3, high: 0.5, samples: 3 })
    expect(per.mean).toBeCloseTo(0.4)
    const e = estimate(planJobs(reqs, [1]), per)
    expect(e.generations).toBe(6)
    expect(e.mean).toBeCloseTo(2.4)
    expect(perGeneration([]).samples).toBe(0)
  })

  it('starts a job only while spent + running + this job stays within the cap', () => {
    const per = { mean: 0.5, low: 0.3, high: 0.7, samples: 1 }
    const one = { id: 'a', mode: 'faithful' as const, run: 1, generations: 1 }
    const two = { id: 'o', mode: 'both' as const, run: 1, generations: 2 }
    expect(withinCap(39, 0, one, per, 40)).toBe(true)
    expect(withinCap(39, 0.6, one, per, 40)).toBe(false)
    expect(withinCap(39.5, 0, two, per, 40)).toBe(false)
  })
})
