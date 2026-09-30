/** Phase 9D: the pipeline in Exploratory mode — stamped mode, the policy, structured feedback and the replan. */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiProvider } from './providers'
import { homeTemplate } from '@/shared/templates/home'

vi.mock('./providers', async (importActual) => {
  const actual = await importActual<typeof import('./providers')>()
  return { ...actual, resolveProvider: vi.fn() }
})

const { resolveProvider } = await import('./providers')
const { generateUI } = await import('./ai-orchestrator')

type Doc = Record<string, any>
const home = (): Doc => structuredClone(homeTemplate.blueprint) as unknown as Doc
const dev = (ruleId: string) => ({ ruleId, why: 'the request asks for it' })

/** A valid Exploratory screen. */
const declared = (): Doc => {
  const doc = home()
  doc.root.props = { ...doc.root.props, justify: 'center' }
  doc.root.deviation = dev('layout.no-static-center')
  return doc
}
/** The same break, never declared: an undeclared deviation (a composition choice). */
const undeclared = (): Doc => {
  const doc = declared()
  delete doc.root.deviation
  return doc
}
/** A declaration nothing breaks. */
const unused = (): Doc => {
  const doc = home()
  doc.root.deviation = dev('layout.no-static-center')
  return doc
}
/** A slot break: a card zone with no card. */
const slot = (): Doc => {
  const doc = home()
  doc.root.children.push({ type: 'ContentCardHeader' })
  return doc
}

function fake(blueprints: Doc[], plans = ['1. Root Stack']): AiProvider {
  const complete = vi.fn()
  plans.forEach((text) => complete.mockResolvedValueOnce({ text, model: 'm' }))
  complete.mockResolvedValue({ text: plans.at(-1), model: 'm' })
  const renderUi = vi.fn()
  blueprints.forEach((b) => renderUi.mockResolvedValueOnce({ blueprint: structuredClone(b), model: 'm' }))
  renderUi.mockResolvedValue({ blueprint: structuredClone(blueprints.at(-1)), model: 'm' })
  return { id: 'api-key', label: 'Fake', isAvailable: async () => true, complete, renderUi }
}

/** `mode: null` sends no mode at all, as before 9C. */
const run = async (p: AiProvider, mode: 'exploratory' | 'faithful' | null = 'exploratory', prompt = 'x') => {
  vi.mocked(resolveProvider).mockResolvedValue(p)
  return generateUI(prompt, [], mode ? { mode } : {})
}

beforeEach(() => {
  vi.mocked(resolveProvider).mockReset()
  process.env.AI_MAX_VALIDATION_RETRIES = '2'
  delete process.env.AI_MAX_REPLANS
})

describe('the mode is the pipeline’s, never the model’s', () => {
  it('stamps an Exploratory result, over whatever the model wrote', async () => {
    const wrote = declared()
    wrote.mode = 'faithful'
    const res = await run(fake([wrote]))
    expect(res.ok && res.blueprint.mode).toBe('exploratory')
    expect(res.meta.mode).toBe('exploratory')
    expect(res.meta.notices?.join(' ')).toMatch(/The model labelled a screen "faithful"; the pipeline sets the mode, so it is "exploratory"/)
  })

  it('a model-written mode on a Faithful request is stripped, with a notice, and the deviation it came with is refused', async () => {
    const wrote = declared()
    wrote.mode = 'exploratory'
    const p = fake([wrote, home()])
    const res = await run(p, 'faithful')
    expect(res.ok && res.blueprint).not.toHaveProperty('mode')
    expect(res.meta.mode).toBe('faithful')
    expect(res.meta.notices?.join(' ')).toMatch(/labelled a screen "exploratory".*so it is "faithful"/)
    // Held to the Faithful rules: the deviation was an error, and the retry list is the plain one.
    const retry = vi.mocked(p.renderUi).mock.calls[1][0].messages.at(-1)!.content
    expect(retry).toMatch(/unknown node key "deviation" — a Faithful screen keeps every pattern/)
    expect(retry).not.toMatch(/\[[a-z.-]+\] at /)
  })

  it('does not stamp or tell anything when a Faithful model wrote nothing', async () => {
    const res = await run(fake([home()]), null)
    expect(res.ok && res.blueprint).not.toHaveProperty('mode')
    expect(res.meta.notices).toBeUndefined()
  })

  it('stamps every screen of an Exploratory document', async () => {
    const doc = { ...declared(), id: 'a', screens: [{ id: 'b', mode: 'faithful', screen: home().screen, root: { type: 'Stack', children: [] } }] }
    const res = await run(fake([doc]))
    expect(res.ok && res.blueprint.screens?.[0].mode).toBe('exploratory')
  })
})

describe('the policy', () => {
  it('accepts a declared break on the first attempt, with no retry and no replan', async () => {
    const p = fake([declared()])
    const res = await run(p)
    expect(res.ok && res.blueprint.root.deviation).toEqual(dev('layout.no-static-center'))
    expect(p.renderUi).toHaveBeenCalledTimes(1)
    expect(p.complete).toHaveBeenCalledTimes(1)
    expect(res.meta.steps.some((s) => /replan/.test(s))).toBe(false)
  })

  it('holds a Faithful request to the same break as an error, with no replan', async () => {
    process.env.AI_MAX_REPLANS = '2'
    const p = fake([undeclared(), home()])
    const res = await run(p, 'faithful')
    expect(res.ok).toBe(true)
    expect(p.complete).toHaveBeenCalledTimes(1) // Faithful never replans
    expect(vi.mocked(p.renderUi).mock.calls[1][0].messages.at(-1)!.content).toMatch(/^That Blueprint is invalid:\n- root <Stack>: justify "center" statically centers/)
  })

  it('leaves a declared root alignment alone before validation, and stretches an undeclared one as before', async () => {
    const aligned = (declare: boolean): Doc => {
      const doc = home()
      doc.root.props = { ...doc.root.props, align: 'start' }
      if (declare) doc.root.deviation = dev('layout.root-align')
      return doc
    }
    const kept = await run(fake([aligned(true)]))
    expect(kept.ok && kept.blueprint.root.props?.align).toBe('start')
    expect(kept.meta.steps.some((s) => /stretched/.test(s))).toBe(false)

    const fixed = await run(fake([aligned(false)]))
    expect(fixed.ok && fixed.blueprint.root.props?.align).toBe('stretch')
    expect(fixed.meta.steps.some((s) => /stretched 1 root/.test(s))).toBe(true)
  })
})

describe('the replan', () => {
  it('a composition choice gets every generator retry first, and goes back to the planner only if it persists', async () => {
    const p = fake([undeclared(), undeclared(), undeclared(), declared()], ['plan one', 'plan two'])
    const res = await run(p)
    expect(res.ok).toBe(true)
    expect(p.renderUi).toHaveBeenCalledTimes(4) // 3 attempts on plan one, then plan two
    expect(p.complete).toHaveBeenCalledTimes(2)
    expect(res.meta.steps).toContain(
      "step 3 · replan 1/1 — trigger: undeclared-deviation (layout.no-static-center) — persisted after the generator's retries",
    )
    // The generator's own retries carried the structured feedback…
    expect(vi.mocked(p.renderUi).mock.calls[1][0].messages.at(-1)!.content).toMatch(/- \[layout\.no-static-center\] at root\.props\.justify: /)

    // …and the planner got the failure, then its new plan reached a fresh generator conversation.
    const replan = vi.mocked(p.complete).mock.calls[1][0].messages
    expect(replan.map((m) => m.role)).toEqual(['user', 'assistant', 'user'])
    expect(replan[1].content).toBe('plan one')
    expect(replan[2].content).toMatch(/failed the audit:\n- \[layout\.no-static-center\] at root\.props\.justify: /)
    expect(replan[2].content).toMatch(/plan it with a "Deviation:" line/)
    expect(vi.mocked(p.renderUi).mock.calls[3][0].messages[0].content).toMatch(/PLAN:\nplan two/)
  })

  it('a generator retry that fixes it means no replan at all', async () => {
    const p = fake([undeclared(), declared()])
    const res = await run(p)
    expect(res.ok).toBe(true)
    expect(p.complete).toHaveBeenCalledTimes(1)
    expect(p.renderUi).toHaveBeenCalledTimes(2)
    expect(res.meta.steps.some((s) => /replan/.test(s))).toBe(false)
  })

  it('a declaration nothing breaks is held to the same order', async () => {
    const p = fake([unused(), unused(), unused(), home()], ['plan one', 'plan two'])
    const res = await run(p)
    expect(res.ok).toBe(true)
    expect(p.complete).toHaveBeenCalledTimes(2)
    expect(res.meta.steps.find((s) => /replan/.test(s))).toMatch(/trigger: unused-deviation \(blueprint\.dsl\) — persisted/)
  })

  it('AI_MAX_REPLANS=0 keeps everything with the generator, even a persisting one', async () => {
    process.env.AI_MAX_REPLANS = '0'
    const p = fake([undeclared()])
    const res = await run(p)
    expect(p.complete).toHaveBeenCalledTimes(1)
    expect(p.renderUi).toHaveBeenCalledTimes(3)
    expect(res.meta.steps.some((s) => /replan/.test(s))).toBe(false)
  })

  it('replans at most AI_MAX_REPLANS times, then returns the best attempt', async () => {
    const p = fake([undeclared()], ['plan one'])
    const res = await run(p)
    expect(p.complete).toHaveBeenCalledTimes(2) // 1 replan
    expect(p.renderUi).toHaveBeenCalledTimes(3 + 3) // every plan gets the generator's 3 attempts
    expect(res.ok).toBe(true) // the best attempt: the renderer's interpreter repairs the rest
    expect(res.meta.steps.filter((s) => /replan/.test(s))).toHaveLength(1)
    expect(res.meta.steps.at(-1)).toMatch(/still invalid after 2 retries/)
  })

  it('a slot break is the generator’s first, and the plan’s only if it persists after the generator’s retries', async () => {
    const p = fake([slot(), slot(), slot(), home()], ['plan one', 'plan two'])
    const res = await run(p)
    expect(res.ok).toBe(true)
    expect(p.renderUi).toHaveBeenCalledTimes(4) // 3 attempts on plan one, then plan two
    expect(p.complete).toHaveBeenCalledTimes(2)
    const trigger = res.meta.steps.find((s) => /replan/.test(s))
    expect(trigger).toMatch(/trigger: undeclared-deviation \(layout\.slots\) — persisted after the generator's retries/)
    // …and the generator's own retries carried the structured feedback.
    expect(vi.mocked(p.renderUi).mock.calls[1][0].messages.at(-1)!.content).toMatch(/- \[layout\.slots\] at root\.children\.1/)
  })

  it('an expression error (a bad prop) never replans', async () => {
    const bad = home()
    bad.root.props = { ...bad.root.props, gap: 'nope' }
    const p = fake([bad, home()])
    const res = await run(p)
    expect(res.ok).toBe(true)
    expect(p.complete).toHaveBeenCalledTimes(1)
    expect(res.meta.steps.some((s) => /replan/.test(s))).toBe(false)
  })

  it('a node-local rule declared on the screen is fed back to the generator, not the planner', async () => {
    const wrong = slot()
    wrong.screen.deviation = [dev('layout.slots')]
    const right = slot()
    right.root.children[1].deviation = dev('layout.slots') // on the node where it happens
    const p = fake([wrong, right])
    const res = await run(p)
    expect(res.ok).toBe(true)
    expect(p.complete).toHaveBeenCalledTimes(1) // no replan
    expect(p.renderUi).toHaveBeenCalledTimes(2)
    const retry = vi.mocked(p.renderUi).mock.calls[1][0].messages.at(-1)!.content
    expect(retry).toMatch(/\[blueprint\.dsl\] at screen\.deviation\.0: "screen"\.deviation\[0\]: "layout\.slots" \(Slots, order and parents\) breaks at one node, so it is declared on that node/)
    expect(res.ok && res.blueprint.root.children?.[1].deviation).toEqual(dev('layout.slots'))
  })

  it('an unknown or law ruleId in a declaration is an expression error too: the generator fixes it', async () => {
    const bad = home() // nothing breaks: only the declaration is wrong
    bad.root.deviation = dev('tokens.only')
    const p = fake([bad, home()])
    const res = await run(p)
    expect(res.ok).toBe(true)
    expect(p.complete).toHaveBeenCalledTimes(1)
    expect(vi.mocked(p.renderUi).mock.calls[1][0].messages.at(-1)!.content).toMatch(/\[blueprint\.dsl\] at root\.deviation: .*is a law/)
  })
})

describe('the prompts of the mode', () => {
  it('an Exploratory request gives the planner and the generator the deviation contract, and the tool its mode', async () => {
    const p = fake([declared()])
    await run(p)
    expect(vi.mocked(p.complete).mock.calls[0][0].system).toContain('# Exploratory mode — declared deviations')
    const gen = vi.mocked(p.renderUi).mock.calls[0][0]
    expect(gen.system).toContain('"deviation": { "ruleId": "<pattern id>"')
    expect(gen.mode).toBe('exploratory')
  })

  it('a Faithful request carries none of it', async () => {
    const p = fake([home()])
    await run(p, 'faithful')
    expect(vi.mocked(p.complete).mock.calls[0][0].system).not.toMatch(/declared deviations/)
    expect(vi.mocked(p.renderUi).mock.calls[0][0].system).not.toMatch(/declared deviations/)
    expect(vi.mocked(p.renderUi).mock.calls[0][0].mode).toBe('faithful')
  })

  it('Auto that routes to Exploratory starts the planner from the faithful alternative', async () => {
    const route = { text: JSON.stringify({ reasoning: 'r', mode: 'exploratory', conflicts: [{ ruleId: 'layers.overlay-model' }], faithfulAlternative: 'A tela dentro dos padrões.' }) }
    const p = fake([declared()])
    vi.mocked(p.complete).mockReset()
    vi.mocked(p.complete).mockResolvedValueOnce(route).mockResolvedValue({ text: '1. Root Stack', model: 'm' } as never)
    vi.mocked(resolveProvider).mockResolvedValue(p)
    const res = await generateUI('E se a notificação aparecesse à esquerda?', [], { mode: 'auto' })
    expect(res.meta.mode).toBe('exploratory')
    const planner = vi.mocked(p.complete).mock.calls[1][0].messages.at(-1)!.content
    expect(planner).toMatch(/^E se a notificação aparecesse à esquerda\?\n\nThe same request kept inside the patterns/)
    expect(planner).toContain('A tela dentro dos padrões.')
  })
})
