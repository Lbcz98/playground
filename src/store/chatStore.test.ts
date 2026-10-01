/** Phase 9C: the chat sends the chosen mode and answers the router's question. */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GenerateUIResponse, RouterQuestion } from '@/shared/blueprint'

vi.mock('@/services/aiClient', () => ({ generateUI: vi.fn(), isBridgeAvailable: () => true }))

const { generateUI } = await import('@/services/aiClient')
const { useChatStore, offeredChoices, bothCostNote } = await import('./chatStore')
const { useSettingsStore } = await import('./settingsStore')

const QUESTION: RouterQuestion = {
  kind: 'conflict',
  text: 'Esse pedido foge dos padrões do design system, você deseja prosseguir',
  why: 'quatro módulos no nível 3',
  rules: [{ id: 'level.module-limit', title: 'Module limit per level', flexibility: 'pattern' }],
  choices: ['faithful', 'exploratory', 'both'],
  faithfulAlternative: 'Uma interatividade só no nível 3.',
}
const meta = { source: 'llm' as const, durationMs: 1, steps: [] }
const asked: GenerateUIResponse = { ok: false, error: QUESTION.text, stage: 'router', question: QUESTION, meta }
const failed: GenerateUIResponse = { ok: false, error: 'stop here', stage: 'test', meta }

beforeEach(() => {
  vi.mocked(generateUI).mockReset()
  useChatStore.getState().clear()
  useSettingsStore.setState({ mode: 'auto' })
})

describe('chatStore — modes and the router question', () => {
  it('sends the selected mode', async () => {
    vi.mocked(generateUI).mockResolvedValueOnce(failed)
    await useChatStore.getState().send('Home com uma notificação')
    expect(vi.mocked(generateUI).mock.calls[0][2]).toMatchObject({ mode: 'auto' })
  })

  it('shows the question with its why and alternative, then re-sends the request in the chosen mode', async () => {
    vi.mocked(generateUI).mockResolvedValueOnce(asked).mockResolvedValueOnce(failed)
    await useChatStore.getState().send('Quatro cards numa tela de nível 3')

    const bubble = useChatStore.getState().messages.at(-1)!
    expect(bubble.status).toBe('done')
    expect(bubble.question).toEqual(QUESTION)
    expect(bubble.text).toContain('quatro módulos no nível 3')
    expect(bubble.text).toContain('Dentro dos padrões: Uma interatividade só no nível 3.')

    useChatStore.getState().answer(bubble.id, 'faithful')
    await vi.waitFor(() => expect(generateUI).toHaveBeenCalledTimes(2))
    const [prompt, , options] = vi.mocked(generateUI).mock.calls[1]
    expect(prompt).toBe('Quatro cards numa tela de nível 3')
    expect(options).toMatchObject({ mode: 'faithful' })
    await vi.waitFor(() => expect(useChatStore.getState().busy).toBe(false))

    const messages = useChatStore.getState().messages
    expect(messages.find((m) => m.id === bubble.id)?.answered).toBe(true)
    expect(messages.some((m) => m.role === 'user' && m.text === 'Seguir padrões')).toBe(true)

    useChatStore.getState().answer(bubble.id, 'faithful') // answered once only
    expect(generateUI).toHaveBeenCalledTimes(2)
  })

  it('offers the three buttons, and "Gere duas opções" re-sends the request as Os dois (9F)', async () => {
    expect(offeredChoices(QUESTION)).toEqual(['faithful', 'exploratory', 'both'])
    vi.mocked(generateUI).mockResolvedValueOnce(asked).mockResolvedValueOnce(failed)
    await useChatStore.getState().send('Quatro cards numa tela de nível 3')
    useChatStore.getState().answer(useChatStore.getState().messages.at(-1)!.id, 'both')
    await vi.waitFor(() => expect(generateUI).toHaveBeenCalledTimes(2))
    expect(vi.mocked(generateUI).mock.calls[1][2]).toMatchObject({ mode: 'both' })
  })

  it('never offers a choice the question does not carry (a law question has only Seguir padrões)', () => {
    expect(offeredChoices({ ...QUESTION, kind: 'law', choices: ['faithful'] })).toEqual(['faithful'])
  })

  it('the Os dois cost note: the measured range with no history, the session average × 2 once there is one', () => {
    expect(bothCostNote({ calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0, costEstimated: false, generations: 0 })).toBe(
      '≈ 2 gerações · ~US$ 0,46–0,64 · ~1 min',
    )
    expect(bothCostNote({ calls: 6, inputTokens: 1, outputTokens: 1, costUsd: 0.9, costEstimated: false, generations: 3 })).toBe(
      '≈ 2 gerações · ~US$ 0,60 (média da sessão × 2) · ~1 min',
    )
  })

  it('“Explore além do padrão” re-sends the request as exploratory', async () => {
    vi.mocked(generateUI).mockResolvedValueOnce(asked).mockResolvedValueOnce(failed)
    await useChatStore.getState().send('Quatro cards numa tela de nível 3')
    useChatStore.getState().answer(useChatStore.getState().messages.at(-1)!.id, 'exploratory')
    await vi.waitFor(() => expect(generateUI).toHaveBeenCalledTimes(2))
    expect(vi.mocked(generateUI).mock.calls[1][2]).toMatchObject({ mode: 'exploratory' })
  })
})

describe('the mode selector (9F)', () => {
  it('offers Os dois next to Auto, Fidedigno and Exploratório, and sends it as chosen', async () => {
    const { selectableModes } = await import('./settingsStore')
    expect(selectableModes()).toEqual(['auto', 'faithful', 'exploratory', 'both'])
  })

  it('never runs the render repair on an Os dois result (it would rebuild both branches)', async () => {
    useSettingsStore.getState().setMode('both')
    const both: GenerateUIResponse = {
      ok: true,
      blueprint: { version: 1, root: { type: 'Stack', props: {}, children: [] } },
      meta: { source: 'llm', durationMs: 1, steps: [], mode: 'both', branches: 2 },
    }
    vi.mocked(generateUI).mockResolvedValueOnce(both)
    await useChatStore.getState().send('Um menu no centro')
    expect(generateUI).toHaveBeenCalledTimes(1)
    expect(vi.mocked(generateUI).mock.calls[0][2]).toMatchObject({ mode: 'both' })
  })
})
