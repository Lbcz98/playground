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

describe('the trace of failed attempts', () => {
  it('logs the structured issues of every failed attempt, and the trigger on the one that caused a replan', async () => {
    const p = fake([undeclared(), undeclared(), undeclared(), declared()], ['plan one', 'plan two'])
    const res = await run(p)
    expect(res.meta.trace?.map((t) => [t.plan, t.attempt, !!t.trigger])).toEqual([
      [0, 1, false],
      [0, 2, false],
      [0, 3, true],
    ])
    const last = res.meta.trace![2]
    expect(last.trigger).toMatch(/^undeclared-deviation \(layout\.no-static-center\) — persisted after the generator's retries$/)
    expect(last.issues).toEqual([
      expect.objectContaining({ ruleId: 'layout.no-static-center', kind: 'undeclared-deviation', path: ['root', 'props', 'justify'] }),
    ])
    expect(last.issues[0].message).toMatch(/statically centers the master layout/)
    // …and it sits next to the trigger line already logged in the steps.
    expect(res.meta.steps.some((s) => /replan 1\/1 — trigger: undeclared-deviation/.test(s))).toBe(true)
  })

  it('is absent when the first attempt is valid', async () => {
    expect((await run(fake([declared()]))).meta.trace).toBeUndefined()
  })

  it('logs a Faithful run’s failed attempt too, with no kind', async () => {
    const res = await run(fake([undeclared(), home()]), 'faithful')
    expect(res.meta.trace).toEqual([
      { plan: 0, attempt: 1, issues: [expect.objectContaining({ ruleId: 'layout.no-static-center', path: ['root', 'props', 'justify'] })] },
    ])
    expect(res.meta.trace![0].issues[0]).not.toHaveProperty('kind')
  })

  it('logs a reply that was not JSON as a DSL issue', async () => {
    const { MalformedOutputError } = await import('./providers/types')
    const p = fake([home()])
    vi.mocked(p.renderUi).mockReset()
    vi.mocked(p.renderUi)
      .mockRejectedValueOnce(new MalformedOutputError('no json', 'oops'))
      .mockResolvedValue({ blueprint: home(), model: 'm' } as never)
    const res = await run(p)
    expect(res.ok).toBe(true)
    expect(res.meta.trace).toEqual([
      { plan: 0, attempt: 1, issues: [{ ruleId: 'blueprint.dsl', path: [], message: expect.stringMatching(/not valid JSON/) }] },
    ])
  })
})

describe('the primitive budget in the pipeline', () => {
  const reuse = { considered: 'Text, Notification', why: 'nenhum tem cor de destaque' }
  /** Home with `k` primitive:Texts next to the rail. */
  const texts = (k: number): Doc => {
    const d = home()
    for (let i = 0; i < k; i++) d.root.children[0].children.push({ type: 'primitive:Text', props: { text: `t${i}` }, reuse })
    return d
  }

  it('an excess is the generator’s to fix first, with the instruction to group into a Proposal', async () => {
    const p = fake([texts(7), texts(3)])
    const res = await run(p)
    expect(res.ok).toBe(true)
    expect(p.complete).toHaveBeenCalledTimes(1)
    const retry = vi.mocked(p.renderUi).mock.calls[1][0].messages.at(-1)!.content
    expect(retry).toMatch(/\[primitives\.budget\] at root: The screen uses 7 primitives — at most 6, text included\. .*group the rest into a Proposal/)
    expect(res.meta.trace?.[0].issues).toEqual([expect.objectContaining({ ruleId: 'primitives.budget', kind: 'budget-exceeded' })])
  })

  it('and goes back to the planner only if it persists, with the trigger logged', async () => {
    const p = fake([texts(7), texts(7), texts(7), texts(2)], ['plan one', 'plan two'])
    const res = await run(p)
    expect(res.ok).toBe(true)
    expect(p.complete).toHaveBeenCalledTimes(2)
    expect(res.meta.steps).toContain("step 3 · replan 1/1 — trigger: budget-exceeded (primitives.budget) — persisted after the generator's retries")
    expect(res.meta.trace?.[2].trigger).toMatch(/^budget-exceeded/)
  })

  it('a Faithful request never counts a budget: primitives are simply not components there', async () => {
    const p = fake([texts(7), home()])
    const res = await run(p, 'faithful')
    expect(vi.mocked(p.renderUi).mock.calls[1][0].messages.at(-1)!.content).not.toMatch(/budget/)
    expect(res.ok && res.meta.trace?.[0].issues.some((i) => /<primitive:Text> is not a real component/.test(i.message))).toBe(true)
  })
})


describe('one declaration per node (9F → a 9G signal)', () => {
  it('logs an attempt that breaks a second node-level rule on a node that declares another', async () => {
    const two = home()
    two.root.children[0].children.push({ type: 'ContentCardHeader', deviation: dev('flow.link-roles') })
    const at = two.root.children[0].children.length - 1
    const res = await run(fake([two, declared()]))
    expect(res.meta.trace?.[0].nodeDeclarationConflicts).toEqual([
      { path: ['root', 'children', 0, 'children', at], declared: 'flow.link-roles', broken: 'layout.slots' },
    ])
  })

  it('logs nothing of the kind for an ordinary failed attempt', async () => {
    const res = await run(fake([undeclared(), declared()]))
    expect(res.meta.trace?.[0]).not.toHaveProperty('nodeDeclarationConflicts')
  })
})
