import { describe, expect, it, vi } from 'vitest'
import { CLASSIFIER_FAILED_NOTICE, buildRouterPrompt, routeAuto } from './classify'
import { CONFLICT_QUESTION } from './router'
import { ROUTER_FEWSHOT } from './router.fewshot'
import type { AiProvider } from './providers'
import { RULES, ruleById } from '@/shared/design-system/rules'
import { SCREENFLOW_MANIFEST as M } from '@/shared/design-system/screenflow-manifest'

function provider(...answers: string[]): AiProvider {
  const complete = vi.fn()
  for (const text of answers) complete.mockResolvedValueOnce({ text, usage: { inputTokens: 10, outputTokens: 5, costUsd: 0.001 } })
  return { id: 'api-key', label: 'Fake', isAvailable: async () => true, complete, renderUi: vi.fn() }
}

const answer = (conflicts: { ruleId: string; why?: string }[]) =>
  JSON.stringify({ reasoning: 'r', mode: 'faithful', conflicts, faithfulAlternative: conflicts.length ? 'alt' : null })

describe('routeAuto', () => {
  it('makes one low-effort call and lets the code decide', async () => {
    const p = provider(answer([{ ruleId: 'layers.overlay-model' }]))
    const route = await routeAuto(p, 'E se a notificação aparecesse à esquerda?', M, 'claude-sonnet-5-5')
    expect(route.decision).toMatchObject({ kind: 'go', mode: 'exploratory' })
    expect(p.complete).toHaveBeenCalledTimes(1)
    expect(vi.mocked(p.complete).mock.calls[0][0]).toMatchObject({ effort: 'low', model: 'claude-sonnet-5-5' })
    expect(route.usage?.costUsd).toBeCloseTo(0.001)
  })

  it('retries an unreadable answer once, showing the model what it wrote', async () => {
    const p = provider('not json at all', answer([]))
    const route = await routeAuto(p, 'Home com uma notificação de gol', M)
    expect(route.decision).toEqual({ kind: 'go', mode: 'faithful', notices: [] })
    expect(p.complete).toHaveBeenCalledTimes(2)
    const retry = vi.mocked(p.complete).mock.calls[1][0].messages
    expect(retry.map((m) => m.role)).toEqual(['user', 'assistant', 'user'])
    expect(retry[1].content).toBe('not json at all')
  })

  it('after a second unreadable answer: Faithful with a visible note', async () => {
    const p = provider('nope', '{"mode": 3}')
    const route = await routeAuto(p, 'Home com uma notificação de gol', M)
    expect(route.decision).toEqual({ kind: 'go', mode: 'faithful', notices: [CLASSIFIER_FAILED_NOTICE] })
    expect(p.complete).toHaveBeenCalledTimes(2)
  })

  it('after a second unreadable answer, asks when the words already flagged a conflict', async () => {
    const route = await routeAuto(provider('nope', 'nope'), 'Um carrossel de destaques', M)
    expect(route.decision).toMatchObject({ kind: 'ask', question: { kind: 'conflict', text: CONFLICT_QUESTION } })
  })
})

describe('the router prompt and its few-shot', () => {
  it('carries the full rules index', () => {
    const prompt = buildRouterPrompt(M)
    for (const rule of RULES) expect(prompt).toContain(`- ${rule.id} — ${rule.flexibility} —`)
  })

  it('shows only real rules, each example agreeing with the book', () => {
    for (const { request, reply } of ROUTER_FEWSHOT) {
      for (const c of reply.conflicts) expect(ruleById(M, c.ruleId), `${request} → ${c.ruleId}`).toBeDefined()
      if (reply.conflicts.length > 0) expect(reply.faithfulAlternative, request).toBeTruthy()
    }
  })
})

describe('the few-shot stays apart from the evaluation requests', () => {
  it('no request of the 9G seed appears in the router few-shot', async () => {
    const { readFileSync } = await import('node:fs')
    const seed = JSON.parse(readFileSync(new URL('../../eval/seed-9d.json', import.meta.url), 'utf8')) as { requests: { prompt: string }[] }
    const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\W+/g, ' ').trim()
    const shots = new Set(ROUTER_FEWSHOT.map((s) => norm(s.request)))
    expect(seed.requests.length).toBe(10)
    for (const { prompt } of seed.requests) expect(shots.has(norm(prompt)), prompt).toBe(false)
  })
})
