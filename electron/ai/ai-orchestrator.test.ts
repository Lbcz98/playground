import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiProvider } from './providers'

vi.mock('./providers', async (importActual) => {
  const actual = await importActual<typeof import('./providers')>()
  return { ...actual, resolveProvider: vi.fn() }
})

const { resolveProvider } = await import('./providers')
const { generateUI } = await import('./ai-orchestrator')
const { MalformedOutputError } = await import('./providers/types')

const VALID = { version: 1, screen: { model: 'home', level: 1 }, root: { type: 'Stack', props: { gap: 'sm' }, children: [] } }
const INVALID = { version: 1, root: { type: 'Stack', children: [{ type: 'Carousel' }] } }

const TWO_COMPONENT_MANIFEST = {
  id: 'mini',
  name: 'Mini DS',
  version: '9.9.9',
  tokens: { colors: {}, spacing: { sm: '8px', lg: '24px' }, typography: {} },
  components: {
    Panel: {
      id: 'Panel',
      name: 'Panel',
      description: 'the only container',
      acceptsChildren: true,
      props: { gap: { name: 'gap', type: { name: 'enum' }, required: false, defaultValue: 'sm', options: ['sm', 'lg'] } },
    },
    Label: {
      id: 'Label',
      name: 'Label',
      description: 'a text leaf',
      acceptsChildren: false,
      props: { text: { name: 'text', type: { name: 'string' }, required: false, defaultValue: '' } },
    },
  },
}

function fakeProvider(overrides: Partial<AiProvider> = {}): AiProvider {
  return {
    id: 'api-key',
    label: 'Fake',
    isAvailable: async () => true,
    complete: vi.fn(async () => ({ text: '1. Root Stack\n2. Done', model: 'claude-opus-5' })),
    renderUi: vi.fn(async () => ({ blueprint: VALID, model: 'claude-opus-5' })),
    ...overrides,
  }
}

beforeEach(() => {
  vi.mocked(resolveProvider).mockReset()
  process.env.AI_MAX_VALIDATION_RETRIES = '2'
})

describe('generateUI — starting from a reference screen', () => {
  it('hands the generator the template the planner named, and logs the choice', async () => {
    const provider = fakeProvider({
      complete: vi.fn(async () => ({
        text: 'Template: home\nScreen: model "home", level 1\n1. Root Stack',
        model: 'claude-opus-5',
      })),
    })
    vi.mocked(resolveProvider).mockResolvedValue(provider)

    const res = await generateUI('the home screen')

    const [args] = vi.mocked(provider.renderUi).mock.calls[0]
    const sent = args.messages[0].content
    expect(sent).toContain('TEMPLATE "home"')
    expect(sent).toContain('"model": "home"')
    expect(sent).toContain('InteractivityMenu') // the real blueprint, not a summary
    expect(sent).toContain('PLAN:')
    expect(res.meta.steps?.join('\n')).toContain('template: home (named)')
  })

  it('falls back to the planned screen model when the planner names no template', async () => {
    const provider = fakeProvider({
      complete: vi.fn(async () => ({ text: 'Screen: model "alert", level 0', model: 'claude-opus-5' })),
    })
    vi.mocked(resolveProvider).mockResolvedValue(provider)

    const res = await generateUI('a bug on the broadcast')

    const [args] = vi.mocked(provider.renderUi).mock.calls[0]
    expect(args.messages[0].content).toContain('TEMPLATE "alert"')
    expect(res.meta.steps?.join('\n')).toContain('template: alert (model)')
  })

  it('sends no reference when the plan fits none, and none for another design system', async () => {
    const provider = fakeProvider({
      complete: vi.fn(async () => ({ text: 'Template: none\n1. Root Stack', model: 'claude-opus-5' })),
    })
    vi.mocked(resolveProvider).mockResolvedValue(provider)

    const res = await generateUI('something else entirely')
    const [args] = vi.mocked(provider.renderUi).mock.calls[0]
    expect(args.messages[0].content).not.toContain('TEMPLATE')
    expect(args.messages[0].content).toMatch(/^Build exactly this plan/)
    expect(res.meta.steps?.join('\n')).toContain('template: none')

    const other = fakeProvider({
      complete: vi.fn(async () => ({ text: 'Template: home\nScreen: model "home", level 1', model: 'm' })),
      renderUi: vi.fn(async () => ({ blueprint: { version: 1, root: { type: 'Panel', children: [] } }, model: 'm' })),
    })
    vi.mocked(resolveProvider).mockResolvedValue(other)
    const imported = await generateUI('a screen', [], {}, TWO_COMPONENT_MANIFEST as never)
    const [otherArgs] = vi.mocked(other.renderUi).mock.calls[0]
    expect(otherArgs.messages[0].content).not.toContain('TEMPLATE')
    expect(imported.meta.steps?.join('\n')).toContain('template: unavailable')
  })
})

describe('generateUI pipeline', () => {
  it('runs planner → generator and returns a validated blueprint', async () => {
    const provider = fakeProvider()
    vi.mocked(resolveProvider).mockResolvedValue(provider)

    const res = await generateUI('a login screen')

    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.blueprint).toEqual(VALID)
    expect(provider.complete).toHaveBeenCalledOnce()
    expect(provider.renderUi).toHaveBeenCalledOnce()

    // planner is fed the Product Blueprint; generator is fed the plan
    const plannerSystem = vi.mocked(provider.complete).mock.calls[0][0].system
    expect(plannerSystem).toMatch(/PLANNER/)
    const genUserMsg = vi.mocked(provider.renderUi).mock.calls[0][0].messages[0].content
    expect(genUserMsg).toContain('1. Root Stack')

    expect(res.meta.steps.some((s) => s.includes('step 1'))).toBe(true)
    expect(res.meta.steps.some((s) => s.includes('valid on attempt 1'))).toBe(true)
  })

  it('feeds validation errors back to the generator and retries', async () => {
    const renderUi = vi
      .fn()
      .mockResolvedValueOnce({ blueprint: INVALID, model: 'm' })
      .mockResolvedValueOnce({ blueprint: VALID, model: 'm' })
    const provider = fakeProvider({ renderUi })
    vi.mocked(resolveProvider).mockResolvedValue(provider)

    const res = await generateUI('x')

    expect(res.ok).toBe(true)
    expect(renderUi).toHaveBeenCalledTimes(2)
    // second call's messages include the assistant's bad output + an error message
    const retryMessages = renderUi.mock.calls[1][0].messages
    expect(retryMessages.at(-1).content).toMatch(/invalid[\s\S]*Carousel/i)
    expect(res.ok && res.meta.steps.some((s) => /valid on attempt 2/.test(s))).toBe(true)
  })

  it('gives up after MAX retries but still returns the best attempt', async () => {
    const renderUi = vi.fn(async () => ({ blueprint: INVALID, model: 'm' }))
    vi.mocked(resolveProvider).mockResolvedValue(fakeProvider({ renderUi }))

    const res = await generateUI('x')

    expect(res.ok).toBe(true)
    expect(renderUi).toHaveBeenCalledTimes(3) // 1 + 2 retries
    expect(res.ok && res.meta.steps.some((s) => /still invalid after 2/.test(s))).toBe(true)
  })

  it('sums usage across every pipeline call', async () => {
    const provider = fakeProvider({
      complete: vi.fn(async () => ({
        text: 'plan',
        usage: { inputTokens: 100, outputTokens: 20, costUsd: 0.001, costEstimated: true },
      })),
      renderUi: vi.fn(async () => ({
        blueprint: VALID,
        usage: { inputTokens: 300, outputTokens: 90, costUsd: 0.004, costEstimated: true },
      })),
    })
    vi.mocked(resolveProvider).mockResolvedValue(provider)

    const res = await generateUI('x')
    expect(res.ok && res.meta.usage).toMatchObject({ inputTokens: 400, outputTokens: 110 })
  })

  it('compiles the generator prompt and the validator from the active manifest', async () => {
    const renderUi = vi
      .fn()
      // first: uses a component the manifest does not have -> must be rejected
      .mockResolvedValueOnce({ blueprint: { version: 1, root: { type: 'Stack' } }, model: 'm' })
      // then: valid against the mini manifest
      .mockResolvedValueOnce({
        blueprint: { version: 1, screen: { model: 'home', level: 1 }, root: { type: 'Panel', props: { gap: 'lg' }, children: [] } },
        model: 'm',
      })
    const provider = fakeProvider({ renderUi })
    vi.mocked(resolveProvider).mockResolvedValue(provider)

    const res = await generateUI('x', [], {}, TWO_COMPONENT_MANIFEST)

    expect(res.ok).toBe(true)
    const genSystem = renderUi.mock.calls[0][0].system
    expect(genSystem).toContain('<Panel>')
    expect(genSystem).toContain('<Label>')
    expect(genSystem).not.toContain('<Stack>')
    expect(genSystem).toContain('Mini DS')

    // the manifest-derived validator rejected the <Stack> attempt and retried
    const retryMsg = renderUi.mock.calls[1][0].messages.at(-1).content
    expect(retryMsg).toMatch(/not a real component[\s\S]*Panel, Label/)
    expect(res.ok && res.meta.steps.some((s) => /Mini DS v9\.9\.9/.test(s))).toBe(true)
  })

  it('returns the fixture when no provider is available', async () => {
    vi.mocked(resolveProvider).mockResolvedValue(null)
    const res = await generateUI('x')
    expect(res.ok).toBe(true)
    expect(res.ok && res.meta.source).toBe('dummy')
  })

  it('reports a provider failure without throwing', async () => {
    const provider = fakeProvider({
      complete: vi.fn(async () => {
        throw new Error('rate limit')
      }),
    })
    vi.mocked(resolveProvider).mockResolvedValue(provider)

    const res = await generateUI('x')
    expect(res.ok).toBe(false)
    expect(res.ok || res.stage).toBe('api-key:pipeline')
  })
})

describe('generateUI — a reply that is not JSON', () => {
  it('goes back to the model as a validation error and retries, keeping what it wrote', async () => {
    let calls = 0
    const provider = fakeProvider({
      renderUi: vi.fn(async () => {
        calls += 1
        if (calls === 1) throw new MalformedOutputError('Expected double-quoted property name', '{ version: 1 }')
        return { blueprint: VALID, model: 'm' }
      }),
    })
    vi.mocked(resolveProvider).mockResolvedValue(provider)

    const res = await generateUI('a screen')

    expect(res.ok).toBe(true)
    expect(provider.renderUi).toHaveBeenCalledTimes(2)
    const [second] = vi.mocked(provider.renderUi).mock.calls[1]
    expect(second.messages.at(-2)).toEqual({ role: 'assistant', content: '{ version: 1 }' })
    expect(second.messages.at(-1)?.content).toMatch(/not valid JSON \(Expected double-quoted property name\)/)
    expect(res.meta.steps.join('\n')).toContain('valid on attempt 2')
  })

  it('still fails cleanly when every attempt is unparseable', async () => {
    const provider = fakeProvider({
      renderUi: vi.fn(async () => {
        throw new MalformedOutputError('Unexpected token', 'nope')
      }),
    })
    vi.mocked(resolveProvider).mockResolvedValue(provider)

    const res = await generateUI('a screen')

    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.error).toBe('Unexpected token')
    expect(provider.renderUi).toHaveBeenCalledTimes(3)
  })

  it('does not retry a provider failure', async () => {
    const provider = fakeProvider({
      renderUi: vi.fn(async () => {
        throw new Error('not logged in')
      }),
    })
    vi.mocked(resolveProvider).mockResolvedValue(provider)
    const res = await generateUI('a screen')
    expect(res.ok).toBe(false)
    expect(provider.renderUi).toHaveBeenCalledTimes(1)
  })
})
