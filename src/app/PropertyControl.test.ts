import { describe, expect, it } from 'vitest'
import type { ManifestProp } from '@/shared/design-system/manifest'
import { itemToLine, lineToItem, parseListDraft } from './PropertyControl'

const text = (name: string, required = false): ManifestProp => ({ name, type: { name: 'string' }, required })
const items: ManifestProp = {
  name: 'miscellaneousItems',
  type: { name: 'array' },
  required: false,
  max: 2,
  fields: { title: text('title', true), subtitle: text('subtitle'), iconSrc: text('iconSrc') },
}

describe('list-of-objects inspector lines', () => {
  const fields = ['title', 'subtitle', 'iconSrc']
  it('round-trips an item through its "|" line, blank fields left out', () => {
    expect(itemToLine({ title: 'Previsão do tempo', subtitle: 'São Paulo, SP' }, fields)).toBe('Previsão do tempo | São Paulo, SP')
    expect(lineToItem('Brasileirão |  | /crest.png', fields)).toEqual({ title: 'Brasileirão', iconSrc: '/crest.png' })
    expect(lineToItem(itemToLine({ title: 'A', iconSrc: 'b' }, fields), fields)).toEqual({ title: 'A', iconSrc: 'b' })
  })

  it('a "|" inside a value survives the round trip', () => {
    const item = { title: 'Flamengo | Brasileirão', subtitle: 'Sábado 16h' }
    expect(itemToLine(item, fields)).toBe('Flamengo \\| Brasileirão | Sábado 16h')
    expect(lineToItem(itemToLine(item, fields), fields)).toEqual(item)
  })

  it('a draft is saved only when every line has its required fields and the count fits', () => {
    expect(parseListDraft('Previsão do tempo | São Paulo\n\nEstreia', items)).toEqual({
      items: [{ title: 'Previsão do tempo', subtitle: 'São Paulo' }, { title: 'Estreia' }],
    })
    expect(parseListDraft('A\n| São Paulo', items)).toEqual({ error: 'Line 2 needs a title.' })
    expect(parseListDraft('A\nB\nC', items)).toEqual({ error: 'At most 2 items.' })
  })
})
