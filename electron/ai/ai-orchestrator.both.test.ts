/**
 * Phase 9F: "Os dois" — one Faithful plan, then the Faithful and the Exploratory branch in parallel, from the same
 * template (the template lock), merged into one document whose screen names, ids, links and modes the pipeline
 * sets. An Exploratory result identical to the Faithful one is dropped; a flow of more than 3 screens runs Faithful
 * only.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiProvider, CompleteArgs } from './providers'
import { homeTemplate } from '@/shared/templates/home'

vi.mock('./providers', async (importActual) => {
  const actual = await importActual<typeof import('./providers')>()
  return { ...actual, resolveProvider: vi.fn() }
})
vi.mock('@/shared/templates', async (importActual) => {
  const actual = await importActual<typeof import('@/shared/templates')>()
  return { ...actual, chooseTemplate: vi.fn(actual.chooseTemplate) }
})

const { resolveProvider } = await import('./providers')
const { chooseTemplate } = await import('@/shared/templates')
const { generateUI, mergeBranches } = await import('./ai-orchestrator')
const { interpretPrototype } = await import('@/interpreter/interpret')
const { validateBlueprintAgainstManifest } = await import('@/shared/design-system/manifest-zod')
const { SCREENFLOW_MANIFEST } = await import('@/shared/design-system/screenflow-manifest')

type Doc = Record<string, any>
const home = (): Doc => structuredClone(homeTemplate.blueprint) as unknown as Doc
/** A valid Exploratory screen: the root centred, declared. */
const explored = (): Doc => {
  const doc = home()
  doc.root.props = { ...doc.root.props, justify: 'center' }
  doc.root.deviation = { ruleId: 'layout.no-static-center', why: 'o pedido centraliza o menu' }
  return doc
}
const PLAN_F = 'Template: home\nScreen: model "home", level 1\n1. Root Stack'
const PLAN_E = 'Template: alert\nScreen: model "home", level 1\nDeviation: layout.no-static-center — centro\n1. Root Stack'
const isExploratoryPlanner = (a: CompleteArgs) => a.system.includes('# Exploratory mode')

interface Fake {
  provider: AiProvider
  plannerCalls: CompleteArgs[]
  generatorCalls: CompleteArgs[]
}
function fake(opts: { faithful?: Doc; exploratory?: Doc | Error; planF?: string; gate?: Promise<void> } = {}): Fake {
  const plannerCalls: CompleteArgs[] = []
  const generatorCalls: CompleteArgs[] = []
  const complete = vi.fn(async (a: CompleteArgs) => {
    plannerCalls.push(a)
    return { text: isExploratoryPlanner(a) ? PLAN_E : (opts.planF ?? PLAN_F), model: 'm', usage: { inputTokens: 10, outputTokens: 1, costUsd: 0.01 } }
  })
  const renderUi = vi.fn(async (a: CompleteArgs & { mode?: string }) => {
    generatorCalls.push(a)
    await opts.gate
    if (a.mode === 'exploratory') {
      if (opts.exploratory instanceof Error) throw opts.exploratory
      return { blueprint: structuredClone(opts.exploratory ?? explored()), model: 'm', usage: { inputTokens: 100, outputTokens: 10, costUsd: 0.2 } }
    }
    return { blueprint: structuredClone(opts.faithful ?? home()), model: 'm', usage: { inputTokens: 100, outputTokens: 10, costUsd: 0.1 } }
  })
  return { provider: { id: 'api-key', label: 'Fake', isAvailable: async () => true, complete, renderUi } as AiProvider, plannerCalls, generatorCalls }
}
const run = async (f: Fake) => {
  vi.mocked(resolveProvider).mockResolvedValue(f.provider)
  return generateUI('Um menu no centro da tela', [], { mode: 'both' })
}
const screensOf = (doc: Doc) => [{ id: doc.id, name: doc.name, mode: doc.mode, screen: doc.screen, root: doc.root }, ...(doc.screens ?? [])]

beforeEach(() => {
  vi.mocked(resolveProvider).mockReset()
  vi.mocked(chooseTemplate).mockClear()
  process.env.AI_MAX_VALIDATION_RETRIES = '2'
})

describe('"Os dois" — one plan, two branches', () => {
  it('plans Faithful once; the Exploratory planner starts from that plan', async () => {
    const f = fake()
    const res = await run(f)
    expect(res.ok).toBe(true)
    expect(f.plannerCalls.filter((a) => !isExploratoryPlanner(a))).toHaveLength(1)
    const ePlanner = f.plannerCalls.filter(isExploratoryPlanner)
    expect(ePlanner).toHaveLength(1)
    expect(String(ePlanner[0].messages.at(-1)?.content)).toContain(PLAN_F)
  })

  it('template lock: chooseTemplate runs once, and both generators receive the same template JSON', async () => {
    const f = fake()
    await run(f)
    expect(chooseTemplate).toHaveBeenCalledTimes(1)
    const templateOf = (a: CompleteArgs) => /TEMPLATE "([^"]+)"[\s\S]*?\n\nBuild exactly this plan/.exec(String(a.messages[0].content))?.[0]
    expect(f.generatorCalls).toHaveLength(2)
    const [a, b] = f.generatorCalls.map(templateOf)
    expect(a).toBeDefined()
    expect(a).toContain('TEMPLATE "home"') // the Faithful plan's template, though the Exploratory plan named "alert"
    expect(b).toBe(a)
  })

  it('runs the two generators in parallel', async () => {
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    const f = fake({ gate })
    const pending = run(f)
    await vi.waitFor(() => expect(f.generatorCalls).toHaveLength(2))
    release()
    expect((await pending).ok).toBe(true)
  })

  it('merges the two into one document: names, ids and modes set by code, never by the model', async () => {
    const wrote = explored()
    wrote.mode = 'faithful'
    const res = await run(fake({ exploratory: wrote }))
    if (!res.ok) throw new Error(res.error)
    const screens = screensOf(res.blueprint as Doc)
    expect(screens.map((s) => [s.id, s.name, s.mode])).toEqual([
      ['faithful-1', 'Fidedigno', undefined],
      ['exploratory-1', 'Exploratório', 'exploratory'],
    ])
    expect(screens[1].root.deviation?.ruleId).toBe('layout.no-static-center')
    expect(res.meta.mode).toBe('both')
  })

  it('rewrites each branch’s links to its own screens', async () => {
    const flow = (): Doc => {
      const d = home()
      d.id = 'home'
      d.root.children[0].children[0].children[0].goTo = 'stats'
      d.screens = [{ id: 'stats', name: 'Stats', screen: { model: 'interactivity-buttons-right', level: 2 }, root: { type: 'Stack', props: {}, children: [] } }]
      return d
    }
    const planF = `${PLAN_F}\nScreen home:\n1. a\nScreen stats:\n1. b`
    const e = flow()
    e.root.props = { ...e.root.props, justify: 'center' }
    e.root.deviation = { ruleId: 'layout.no-static-center', why: 'centro' }
    const res = await run(fake({ faithful: flow(), exploratory: e, planF }))
    if (!res.ok) throw new Error(res.error)
    const screens = screensOf(res.blueprint as Doc)
    expect(screens.map((s) => [s.id, s.name])).toEqual([
      ['faithful-1', 'Fidedigno · home'],
      ['faithful-2', 'Fidedigno · Stats'],
      ['exploratory-1', 'Exploratório · home'],
      ['exploratory-2', 'Exploratório · Stats'],
    ])
    expect(screens[0].root.children[0].children[0].children[0].goTo).toBe('faithful-2')
    expect(screens[2].root.children[0].children[0].children[0].goTo).toBe('exploratory-2')
  })

  it('keeps only the Faithful screen when the Exploratory one is structurally identical, and says so', async () => {
    const res = await run(fake({ exploratory: home() }))
    if (!res.ok) throw new Error(res.error)
    expect(screensOf(res.blueprint as Doc)).toHaveLength(1)
    expect(res.meta.notices).toContain('Exploratório não encontrou nada a quebrar — só a tela Fidedigna foi mantida.')
  })

  it('a flow of more than 3 screens runs Faithful only and skips the Exploratory planner', async () => {
    const planF = `${PLAN_F}\nScreen a:\n1. x\nScreen b:\n1. x\nScreen c:\n1. x\nScreen d:\n1. x`
    const f = fake({ planF })
    const res = await run(f)
    expect(f.plannerCalls.filter(isExploratoryPlanner)).toHaveLength(0)
    expect(f.generatorCalls).toHaveLength(1)
    expect(res.meta.notices?.join(' ')).toMatch(/Os dois cabe até 3 telas por modo \(máx\. 6\); este fluxo tem 4/)
  })

  it('a failed branch still delivers the other, and says which failed', async () => {
    const res = await run(fake({ exploratory: new Error('provider down') }))
    if (!res.ok) throw new Error(res.error)
    expect(screensOf(res.blueprint as Doc)).toHaveLength(1)
    expect(res.meta.notices?.join(' ')).toMatch(/Exploratório falhou/)
  })

  it('sums the usage of every call and tags steps by branch', async () => {
    const res = await run(fake())
    expect(res.meta.usage?.costUsd).toBeCloseTo(0.01 + 0.01 + 0.1 + 0.2)
    expect(res.meta.steps.some((s) => s.startsWith('[F] '))).toBe(true)
    expect(res.meta.steps.some((s) => s.startsWith('[E] '))).toBe(true)
    expect(res.meta.branches).toBe(2)
  })

  it('the old one-Faithful fallback notice is gone', async () => {
    const res = await run(fake())
    expect((res.meta.notices ?? []).join(' ')).not.toMatch(/arrives in 9F/)
  })

  it('the merged document is valid, and the canvas gets one Faithful and one Exploratory screen', () => {
    const merged = mergeBranches(home(), explored())
    expect(validateBlueprintAgainstManifest(merged, SCREENFLOW_MANIFEST, 'faithful')).toEqual({ ok: true })
    const r = interpretPrototype(merged, SCREENFLOW_MANIFEST)
    if (!r.ok) throw new Error(r.error)
    expect(r.screens.map((s) => [s.id, s.name, s.mode ?? 'faithful'])).toEqual([
      ['faithful-1', 'Fidedigno', 'faithful'],
      ['exploratory-1', 'Exploratório', 'exploratory'],
    ])
  })
})
