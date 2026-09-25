import { describe, expect, it } from 'vitest'
import { itemToLine, lineToItem } from './PropertyControl'

describe('list-of-objects inspector lines', () => {
  const fields = ['title', 'subtitle', 'iconSrc']
  it('round-trips an item through its "|" line, blank fields left out', () => {
    expect(itemToLine({ title: 'Previsão do tempo', subtitle: 'São Paulo, SP' }, fields)).toBe('Previsão do tempo | São Paulo, SP')
    expect(lineToItem('Brasileirão |  | /crest.png', fields)).toEqual({ title: 'Brasileirão', iconSrc: '/crest.png' })
    expect(lineToItem(itemToLine({ title: 'A', iconSrc: 'b' }, fields), fields)).toEqual({ title: 'A', iconSrc: 'b' })
  })
})
