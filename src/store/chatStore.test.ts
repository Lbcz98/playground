/** Phase 9C: the chat sends the chosen mode and answers the router's question. */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GenerateUIResponse, RouterQuestion } from '@/shared/blueprint'

vi.mock('@/services/aiClient', () => ({ generateUI: vi.fn(), isBridgeAvailable: () => true }))

const { generateUI } = await import('@/services/aiClient')
const { useChatStore, offeredChoices } = await import('./chatStore')
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

  it('offers the two buttons — follow the patterns, explore beyond them — and never "Os dois" (9F)', async () => {
    expect(offeredChoices(QUESTION)).toEqual(['faithful', 'exploratory'])
    vi.mocked(generateUI).mockResolvedValueOnce(asked)
    await useChatStore.getState().send('Quatro cards numa tela de nível 3')
    const bubble = useChatStore.getState().messages.at(-1)!
    useChatStore.getState().answer(bubble.id, 'both')
    expect(generateUI).toHaveBeenCalledTimes(1) // refused: no generation
  })

  it('“Explore além do padrão” re-sends the request as exploratory', async () => {
    vi.mocked(generateUI).mockResolvedValueOnce(asked).mockResolvedValueOnce(failed)
    await useChatStore.getState().send('Quatro cards numa tela de nível 3')
    useChatStore.getState().answer(useChatStore.getState().messages.at(-1)!.id, 'exploratory')
    await vi.waitFor(() => expect(generateUI).toHaveBeenCalledTimes(2))
    expect(vi.mocked(generateUI).mock.calls[1][2]).toMatchObject({ mode: 'exploratory' })
  })
})
