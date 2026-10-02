/**
 * Phase 9G, the deterministic half: the golden set is well-formed and covers what it must, its expectations are
 * still reachable under today's rules (a reference screen per pattern request validates with exactly the expected
 * declaration; a law-break per law trap is rejected in both modes), and the router's model-free signals read each
 * request as expected. The live half (`npm run eval:modes`) costs money and never runs here.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { ROUTER_FEWSHOT } from '../../electron/ai/router.fewshot'
import { validateBlueprintAgainstManifest } from '@/shared/design-system/manifest-zod'
import { SCREENFLOW_MANIFEST as M } from '@/shared/design-system/screenflow-manifest'
import { declarableRules, ruleScope } from '@/shared/design-system/deviations'
import { ruleById } from '@/shared/design-system/rules'
import { readRequest } from '@/shared/design-system/request-signals'
import { LAW_BREAKS, PATTERN_BREAKS } from '@/shared/design-system/__fixtures__/patternBreaks'

const Declare = z.object({ ruleId: z.string(), scope: z.enum(['node', 'screen']) }).strict()
const Request = z
  .object({
    id: z.string().regex(/^[a-z]\d\d-[a-z0-9-]+$/),
    from: z.string().optional(),
    group: z.enum(['baseline', 'pattern', 'variant', 'no-break', 'law', 'convention', 'both']),
    modes: z.array(z.enum(['faithful', 'exploratory', 'both'])).min(1),
    prompt: z.string().min(10),
    reference: z.string().optional(),
    lawFixture: z.string().optional(),
    expected: z
      .object({
        router: z.enum(['faithful', 'exploratory', 'ask', 'law']).optional(),
        declare: z.array(Declare),
        law: z.string().optional(),
        language: z.enum(['en', 'pt']).optional(),
        both: z.enum(['differ', 'identical', 'faithful-only', 'any']).optional(),
        note: z.string().optional(),
      })
      .strict(),
  })
  .strict()
const Golden = z.object({ about: z.string(), version: z.literal(1), requests: z.array(Request) }).strict()

const golden = Golden.parse(JSON.parse(readFileSync(new URL('./modes.golden.json', import.meta.url), 'utf8')))
const requests = golden.requests
const of = (group: string) => requests.filter((r) => r.group === group)
const issuesOf = (doc: unknown, mode: 'faithful' | 'exploratory') => {
  const v = validateBlueprintAgainstManifest(doc, M, mode)
  return v.ok ? [] : v.issues
}

describe('the golden set', () => {
  it('has about 30 requests with unique ids', () => {
    expect(requests.length).toBeGreaterThanOrEqual(30)
    expect(new Set(requests.map((r) => r.id)).size).toBe(requests.length)
  })

  /**
   * The pattern no natural request forces (Oct 2): level.root-direction — a user never names the outermost
   * container, and every on-screen arrangement asked for so far has a non-breaking build (p06). p09 exercises it
   * as an accepted extra; its reference fixture is checked in the deviation tests.
   */
  const UNFORCED: readonly string[] = ['level.root-direction']

  it('covers every declarable pattern with a pattern request that requires it, apart from the patterns no request forces', () => {
    const required = new Set(requests.filter((r) => r.group === 'pattern' || r.group === 'variant').flatMap((r) => r.expected.declare.map((d) => d.ruleId)))
    expect([...required, ...UNFORCED].sort()).toEqual(declarableRules(M).map((r) => r.id).sort())
    for (const r of of('pattern').filter((r) => r.reference)) expect(r.expected.declare.map((d) => d.ruleId)).toEqual([r.reference])
  })

  it('declares each expected rule at the scope the rule book gives it', () => {
    for (const r of requests) for (const d of r.expected.declare) expect(d.scope, `${r.id}: ${d.ruleId}`).toBe(ruleScope(d.ruleId))
  })

  it('has four law traps, each naming a law and a law-break fixture', () => {
    expect(of('law')).toHaveLength(4)
    for (const r of of('law')) {
      expect(ruleById(M, r.expected.law!)?.flexibility, r.id).toBe('law')
      expect(r.lawFixture! in LAW_BREAKS, r.id).toBe(true)
      expect(r.expected.declare).toEqual([])
    }
  })

  it('has baselines, no-break cases, a convention in English and the Os dois cases (incl. over 3 screens)', () => {
    expect(of('baseline').length).toBeGreaterThanOrEqual(5)
    expect(of('no-break').length).toBeGreaterThanOrEqual(2)
    expect(of('convention')).toMatchObject([{ expected: { language: 'en', declare: [] } }])
    expect(of('both').map((r) => r.expected.both).sort()).toEqual(['any', 'differ', 'differ', 'faithful-only', 'identical'])
    for (const r of of('both')) expect(r.modes).toEqual(['both'])
  })

  /**
   * Requests whose wording is close to a router few-shot example, kept as they are for their generation: their router
   * sample is uninformative (memorization risk) and the report says so.
   */
  const NEAR_FEWSHOT: Record<string, string> = {
    'n01-four-cards': 'Quatro cards de interatividade lado a lado numa tela de nível 3 (token overlap 0.69)',
  }
  const NEAR = 0.6

  it('stays apart from the router few-shot: no exact match, and no token overlap of 0.6 or more unless listed', () => {
    const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\W+/g, ' ').trim()
    const tokens = (s: string) => new Set(norm(s).split(' ').filter(Boolean))
    // Jaccard: shared words over all words of the two.
    const overlap = (a: Set<string>, b: Set<string>) => {
      const shared = [...a].filter((w) => b.has(w)).length
      return shared / (a.size + b.size - shared)
    }
    const shots = ROUTER_FEWSHOT.map((s) => s.request)
    const near: string[] = []
    for (const { prompt, id } of requests) {
      expect(shots.map(norm).includes(norm(prompt)), id).toBe(false)
      if (Math.max(...shots.map((s) => overlap(tokens(prompt), tokens(s)))) >= NEAR) near.push(id)
    }
    expect([...new Set(near)].sort()).toEqual(Object.keys(NEAR_FEWSHOT).sort())
  })
})

describe('reference screens: each pattern expectation is reachable under today’s rules', () => {
  it.each(of('pattern').filter((r) => r.reference).map((r) => [r.id, r.reference!] as const))('%s — %s', (_id, rule) => {
    const fixture = PATTERN_BREAKS[rule]
    // Exploratory: the break, declared where the rule book says, validates with exactly that declaration.
    const explored = fixture.doc()
    if (ruleScope(rule) === 'node') fixture.node(explored).deviation = { ruleId: rule, why: 'o pedido pede' }
    else fixture.screen(explored).deviation = [{ ruleId: rule, why: 'o pedido pede' }]
    expect(issuesOf(explored, 'exploratory')).toEqual([])
    // Faithful: the same break is a real break, so a Faithful screen can never deliver it. A Proposal is not even a
    // component there: Faithful rejects it as an unknown one.
    const raw = fixture.doc()
    expect(issuesOf(raw, 'faithful').map((i) => i.ruleId)).toContain(rule === 'registry.new-component' ? 'component.api' : rule)
  })
})

describe('law-break fixtures (the law traps, and the carousel): rejected in both modes, by a law', () => {
  it.each(requests.filter((r) => r.lawFixture).map((r) => [r.id, r.lawFixture!] as const))('%s — %s', (_id, name) => {
    const fixture = LAW_BREAKS[name]
    for (const mode of ['faithful', 'exploratory'] as const) {
      const laws = [...new Set(issuesOf(fixture.doc(), mode).map((i) => i.ruleId))].filter((id) => ruleById(M, id)?.flexibility === 'law')
      expect(laws.sort(), mode).toEqual([...fixture.laws[mode]].sort())
    }
  })
})

describe('router signals (the model-free half of Auto)', () => {
  const read = (id: string) => readRequest(requests.find((r) => r.id === id)!.prompt, M)
  it('only the exploration request carries an exploration word', () => {
    for (const r of requests) expect(read(r.id).exploration.length > 0, r.id).toBe(r.id === 'n02-explore-notification')
  })
  it('only the carousel names a part the system has none of', () => {
    for (const r of requests) expect(read(r.id).unknown, r.id).toEqual(r.id === 'v02-carousel' ? ['carousel'] : [])
  })
  it('the English convention request names the rail it is about', () => {
    expect(read('c01-button-label').components).toEqual(['InteractivityMenu'])
  })
})

