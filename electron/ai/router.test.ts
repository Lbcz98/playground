import { describe, expect, it } from 'vitest'
import { CONFLICT_QUESTION, decide, explicitNotices, type ClassifierReply } from './router'
import { readRequest } from '@/shared/design-system/request-signals'
import { SCREENFLOW_MANIFEST as M } from '@/shared/design-system/screenflow-manifest'

const reply = (conflicts: ClassifierReply['conflicts'], mode = 'faithful'): ClassifierReply => ({
  reasoning: 'test',
  mode,
  conflicts,
  faithfulAlternative: 'A mesma tela dentro dos padrões.',
})
const plain = readRequest('Home com uma notificação de gol', M)
const exploring = readRequest('E se a notificação aparecesse à esquerda?', M)

describe('decide — the mode comes from code', () => {
  it('no conflict → Faithful', () => {
    expect(decide(plain, reply([]), M)).toEqual({ kind: 'go', mode: 'faithful', notices: [] })
  })

  it('only conventions → Faithful, with a note', () => {
    const d = decide(plain, reply([{ ruleId: 'copy.button-label', why: 'o botão diz só "OK"' }]), M)
    expect(d).toEqual({ kind: 'go', mode: 'faithful', notices: ['Convention noted: "Button labels say what they do" — o botão diz só "OK".'] })
  })

  it('pattern in conflict and the signals agree → Exploratory', () => {
    const d = decide(exploring, reply([{ ruleId: 'layers.overlay-model' }]), M)
    expect(d).toMatchObject({ kind: 'go', mode: 'exploratory' })
  })

  it('pattern in conflict but no signal → ask, with the conflict’s why', () => {
    const d = decide(plain, reply([{ ruleId: 'level.module-limit', why: 'quatro módulos no nível 3' }]), M)
    expect(d.kind).toBe('ask')
    if (d.kind !== 'ask') return
    expect(d.question).toMatchObject({ kind: 'conflict', text: CONFLICT_QUESTION, why: 'quatro módulos no nível 3' })
    expect(d.question.choices).toEqual(['faithful', 'exploratory', 'both'])
    expect(d.question.rules.map((r) => r.id)).toEqual(['level.module-limit'])
  })

  it('a signal but no pattern in conflict → ask (they disagree)', () => {
    expect(decide(exploring, reply([]), M).kind).toBe('ask')
  })

  it('a rule the book doesn’t have → ask, even when the signals agree', () => {
    expect(decide(exploring, reply([{ ruleId: 'layout.invented' }, { ruleId: 'layers.overlay-model' }]), M).kind).toBe('ask')
  })

  it('a law in conflict → the law holds in both modes: says which, offers only the faithful alternative', () => {
    const d = decide(exploring, reply([{ ruleId: 'tokens.only', why: 'pede #ff0000' }, { ruleId: 'layers.overlay-model' }]), M)
    expect(d.kind).toBe('ask')
    if (d.kind !== 'ask') return
    expect(d.question.kind).toBe('law')
    expect(d.question.text).toContain('"Tokens only"')
    expect(d.question.choices).toEqual(['faithful'])
    expect(d.question.faithfulAlternative).toBe('A mesma tela dentro dos padrões.')
  })

  it('ignores the classifier’s own mode', () => {
    expect(decide(plain, reply([], 'exploratory'), M)).toMatchObject({ kind: 'go', mode: 'faithful' })
  })
})

describe('explicitNotices — an explicit mode only lists what the words show', () => {
  it('names the UI parts the system lacks, under the component API law', () => {
    expect(explicitNotices(readRequest('Um carrossel de destaques', M), M)).toEqual([
      'ScreenFlow has no carousel; the screen approximates it with its own components (law: "Component API").',
    ])
    expect(explicitNotices(exploring, M)).toEqual([])
  })
})
