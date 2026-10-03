import { describe, expect, it } from 'vitest'
import { readRequest } from './request-signals'
import { SCREENFLOW_MANIFEST } from './screenflow-manifest'
import { W3C_MANIFEST } from '@/shared/fixtures/w3cManifest'
import PHRASES from './__fixtures__/request-signals.pt.json'

describe('readRequest — real Portuguese requests, traps included', () => {
  it.each(PHRASES)('$phrase', ({ phrase, components, unknown, explores }) => {
    const read = readRequest(phrase, SCREENFLOW_MANIFEST)
    expect(read.components.sort()).toEqual([...components].sort())
    expect(read.unknown.sort()).toEqual([...unknown].sort())
    expect(read.exploration.length > 0).toBe(explores)
  })

  it('matches an imported system by its own ids and names only', () => {
    expect(readRequest('A container with a button', W3C_MANIFEST).components.sort()).toEqual(['Button', 'Container'])
    // The Portuguese aliases belong to the built-in components, not to a same-named import.
    expect(readRequest('um botão', W3C_MANIFEST).components).toEqual([])
  })

  describe('an explicit request for a new component is an exploration signal', () => {
    const explores = (phrase: string) => readRequest(phrase, SCREENFLOW_MANIFEST).exploration.length > 0
    it.each([
      'Proponha um componente novo para escolher o idioma',
      'Quero um novo componente de enquete na home',
      'Preciso de um componente novo para a votação',
      'Podemos propor um componente para mostrar o placar?',
      'Proponha um componente de enquete',
      'Propose a new component for choosing the audio language',
      'Please propose a component that shows the score',
      'I need a new component for polls',
    ])('trips: %s', (phrase) => expect(explores(phrase)).toBe(true))
    it.each([
      'Um card novo de interatividade na home',
      'Uma enquete ao vivo na home, com uma barra de porcentagem',
      'Use o componente de notificação no canto',
      'A new card on the home rail',
    ])('does not trip: %s', (phrase) => expect(explores(phrase)).toBe(false))
  })
})
