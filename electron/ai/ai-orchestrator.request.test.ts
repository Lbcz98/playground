/** The generator is shown the user's request verbatim, last, so what it writes for the user follows the request's language. */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiProvider, CompleteArgs } from './providers'
import { homeTemplate } from '@/shared/templates/home'

vi.mock('./providers', async (importActual) => {
  const actual = await importActual<typeof import('./providers')>()
  return { ...actual, resolveProvider: vi.fn() }
})
const { resolveProvider } = await import('./providers')
const { generateUI, originalRequestBlock } = await import('./ai-orchestrator')

const REQUEST = 'On the home screen, label the first card of the interactivity rail "Click here"'
function fake() {
  const generatorCalls: CompleteArgs[] = []
  const provider = {
    id: 'api-key',
    label: 'Fake',
    isAvailable: async () => true,
    complete: vi.fn(async () => ({ text: 'Template: home\n1. Root Stack', model: 'm' })),
    renderUi: vi.fn(async (a: CompleteArgs) => {
      generatorCalls.push(a)
      return { blueprint: structuredClone(homeTemplate.blueprint), model: 'm' }
    }),
  } as unknown as AiProvider
  return { provider, generatorCalls }
}

beforeEach(() => vi.mocked(resolveProvider).mockReset())

describe('the generator’s input', () => {
  for (const mode of ['faithful', 'exploratory'] as const) {
    it(`${mode}: ends with the original request, verbatim, after the plan`, async () => {
      const f = fake()
      vi.mocked(resolveProvider).mockResolvedValue(f.provider)
      await generateUI(REQUEST, [], { mode })
      const first = String(f.generatorCalls[0].messages[0].content)
      expect(first.endsWith(originalRequestBlock(REQUEST))).toBe(true)
      expect(first.indexOf('PLAN:')).toBeLessThan(first.indexOf('Original request'))
      expect(first).toContain(`:\n${REQUEST}`)
    })
  }

  it('the plan stays authoritative: the block says so, and names notes, why and Proposal descriptions', () => {
    const b = originalRequestBlock('x')
    expect(b).toMatch(/plan is authoritative/)
    expect(b).toMatch(/notes.*deviation\.why.*Proposal/)
  })

  it('Os dois: both branches’ generators see it', async () => {
    const f = fake()
    vi.mocked(resolveProvider).mockResolvedValue(f.provider)
    await generateUI(REQUEST, [], { mode: 'both' })
    expect(f.generatorCalls).toHaveLength(2)
    for (const c of f.generatorCalls) expect(String(c.messages[0].content).endsWith(originalRequestBlock(REQUEST))).toBe(true)
  })
})
