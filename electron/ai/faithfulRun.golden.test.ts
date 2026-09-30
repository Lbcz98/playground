/**
 * A fixed Faithful request through the whole pipeline, pinned before phase 9E: the
 * prompts the planner and the generator receive (hashed — their bytes are pinned by
 * the prompt snapshots), every message, the steps, the result and the tree the
 * interpreter makes of it. 9E adds only Exploratory vocabulary; this must not move.
 */
import { createHash } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import type { AiProvider } from './providers'
import { homeTemplate } from '@/shared/templates/home'
import type { CanvasNode } from '@/model/nodeTree'

vi.mock('./providers', async (importActual) => {
  const actual = await importActual<typeof import('./providers')>()
  return { ...actual, resolveProvider: vi.fn() }
})
const { resolveProvider } = await import('./providers')
const { generateUI } = await import('./ai-orchestrator')
const { interpretPrototype } = await import('@/interpreter/interpret')

const sha = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16)
const strip = (n: CanvasNode): unknown => ({ type: n.type, props: n.props, children: n.children.map(strip), ...(n.anchor ? { anchor: true } : {}), ...(n.screen ? { screen: n.screen } : {}) })

/** The model's two answers: one plan, and a screen with a stray prop so a retry happens too. */
function provider(): AiProvider {
  const broken = structuredClone(homeTemplate.blueprint) as any
  broken.root.props = { ...broken.root.props, bogus: 1 }
  return {
    id: 'api-key',
    label: 'Fake',
    isAvailable: async () => true,
    complete: vi.fn(async () => ({ text: 'Template: home\nScreen: model "home", level 1\n1. Root Stack', model: 'm' })),
    renderUi: vi
      .fn()
      .mockResolvedValueOnce({ blueprint: broken, model: 'm' })
      .mockResolvedValueOnce({ blueprint: structuredClone(homeTemplate.blueprint), model: 'm' }),
  }
}

describe('a Faithful request (golden)', () => {
  it.each([
    ['no mode', {}],
    ['explicit Fidedigno', { mode: 'faithful' as const }],
  ])('%s goes through exactly as before', async (_, options) => {
    const p = provider()
    vi.mocked(resolveProvider).mockResolvedValue(p)
    const res = await generateUI('Home com uma notificação de gol, e se possível o trilho', [], options)
    const planner = vi.mocked(p.complete).mock.calls.map(([a]) => ({ system: sha(a.system), messages: a.messages, effort: a.effort }))
    const generator = vi.mocked(p.renderUi).mock.calls.map(([a]) => ({ system: sha(a.system), messages: a.messages, mode: a.mode }))
    const interpreted = res.ok ? interpretPrototype(res.blueprint) : null
    expect({
      planner,
      generator,
      ok: res.ok,
      blueprint: res.ok ? res.blueprint : null,
      steps: res.meta.steps,
      mode: res.meta.mode,
      notices: res.meta.notices,
      trace: res.meta.trace,
      tree: interpreted?.ok ? interpreted.screens.map((s) => ({ id: s.id, mode: s.mode, tree: strip(s.tree) })) : null,
      issues: interpreted?.ok ? interpreted.issues.map((i) => `${i.level} ${i.ruleId} ${i.message}`) : null,
    }).toMatchSnapshot()
  })
})
