/** Phase 9C: step 0, the router, inside `generateUI`. */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiProvider } from './providers'

vi.mock('./providers', async (importActual) => {
  const actual = await importActual<typeof import('./providers')>()
  return { ...actual, resolveProvider: vi.fn() }
})

const { resolveProvider } = await import('./providers')
const { generateUI, BOTH_FALLBACK_NOTICE } = await import('./ai-orchestrator')
const { handleGenerateUI } = await import('./handler')

const VALID = { version: 1, screen: { model: 'home', level: 1 }, root: { type: 'Stack', props: { gap: 'sm' }, children: [] } }
const PLAN = { text: '1. Root Stack', model: 'claude-opus-5' }
const route = (conflicts: { ruleId: string; why?: string }[]) => ({
  text: JSON.stringify({ reasoning: 'r', mode: 'faithful', conflicts, faithfulAlternative: conflicts.length ? 'alt' : null }),
})

function fakeProvider(...complete: { text: string }[]): AiProvider {
  const fn = vi.fn()
  for (const answer of complete) fn.mockResolvedValueOnce(answer)
  return {
    id: 'api-key',
    label: 'Fake',
    isAvailable: async () => true,
    complete: fn,
    renderUi: vi.fn(async () => ({ blueprint: VALID, model: 'claude-opus-5' })),
  }
}

beforeEach(() => {
  vi.mocked(resolveProvider).mockReset()
  process.env.AI_MAX_VALIDATION_RETRIES = '2'
})

async function run(prompt: string, mode: 'auto' | 'faithful' | 'exploratory' | 'both' | undefined, provider: AiProvider) {
  vi.mocked(resolveProvider).mockResolvedValue(provider)
  return generateUI(prompt, [], mode ? { mode } : {})
}

describe('generateUI — step 0', () => {
  it('without a mode: no router, one planner call, stamped Faithful', async () => {
    const p = fakeProvider(PLAN)
    const res = await run('Um carrossel de destaques', undefined, p)
    expect(p.complete).toHaveBeenCalledTimes(1)
    expect(res.meta.steps.some((s) => s.startsWith('step 0'))).toBe(false)
    expect(res.meta.mode).toBe('faithful')
    expect(res.meta.notices).toBeUndefined()
  })

  it('an explicit Faithful makes no classifier call and lists what the words show', async () => {
    const p = fakeProvider(PLAN)
    const res = await run('Um carrossel de destaques', 'faithful', p)
    expect(p.complete).toHaveBeenCalledTimes(1)
    expect(res.meta.notices?.[0]).toMatch(/has no carousel/)
  })

  it('an explicit "Os dois" still runs ONE Faithful generation, says so, and is stamped faithful (until 9F)', async () => {
    const p = fakeProvider(PLAN)
    const res = await run('Explore um layout com o menu no topo', 'both', p)
    expect(res.ok).toBe(true)
    expect(p.complete).toHaveBeenCalledTimes(1)
    expect(p.renderUi).toHaveBeenCalledTimes(1)
    expect(res.meta.mode).toBe('faithful')
    expect(res.meta.notices).toContain(BOTH_FALLBACK_NOTICE)
  })

  it('an explicit Exploratório runs the exploratory pipeline: no fallback notice, stamped exploratory', async () => {
    const p = fakeProvider(PLAN)
    const res = await run('Explore um layout com o menu no topo', 'exploratory', p)
    expect(res.ok).toBe(true)
    expect(p.renderUi).toHaveBeenCalledTimes(1)
    expect(res.meta.mode).toBe('exploratory')
    expect(res.meta.notices ?? []).not.toContain(BOTH_FALLBACK_NOTICE)
    expect(res.ok && res.blueprint.mode).toBe('exploratory')
  })

  it('Auto with no conflict: the classifier, then the pipeline as before', async () => {
    const p = fakeProvider(route([]), PLAN)
    const res = await run('Home com uma notificação de gol', 'auto', p)
    expect(res.ok).toBe(true)
    expect(p.complete).toHaveBeenCalledTimes(2)
    expect(vi.mocked(p.complete).mock.calls[0][0].effort).toBe('low')
    expect(res.meta.mode).toBe('faithful')
  })

  it('Auto routed to Exploratory runs the exploratory pipeline', async () => {
    const p = fakeProvider(route([{ ruleId: 'layers.overlay-model' }]), PLAN)
    const res = await run('E se a notificação aparecesse à esquerda?', 'auto', p)
    expect(res.meta.mode).toBe('exploratory')
    expect(p.renderUi).toHaveBeenCalledTimes(1)
    expect(vi.mocked(p.renderUi).mock.calls[0][0].mode).toBe('exploratory')
  })

  it('Auto that has to ask returns the question and generates nothing', async () => {
    const p = fakeProvider(route([{ ruleId: 'level.module-limit', why: 'quatro módulos' }]))
    const res = await run('Quatro cards numa tela de nível 3', 'auto', p)
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.stage).toBe('router')
    expect(res.question).toMatchObject({ kind: 'conflict', why: 'quatro módulos' })
    expect(p.complete).toHaveBeenCalledTimes(1)
    expect(p.renderUi).not.toHaveBeenCalled()
    expect(res.meta.mode).toBeUndefined()
  })
})

describe('handler — the mode option', () => {
  it('accepts the four modes and rejects anything else', async () => {
    vi.mocked(resolveProvider).mockResolvedValue(null)
    for (const mode of ['auto', 'faithful', 'exploratory', 'both']) {
      expect((await handleGenerateUI({ prompt: 'x', options: { mode } })).ok).toBe(true)
    }
    expect((await handleGenerateUI({ prompt: 'x', options: { mode: 'wild' } })).ok).toBe(false)
  })
})
