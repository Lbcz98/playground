/** Phase 9E: the vocabulary renders from tokens, is inspectable, and never reaches the palette. */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { hydrateRegistry } from './registry'
import { EXPLORATORY_TYPES } from '@/shared/design-system/primitives'
import { SCREENFLOW_MANIFEST as M } from '@/shared/design-system/screenflow-manifest'
import { W3C_MANIFEST as W } from '@/shared/fixtures/w3cManifest'

describe('the vocabulary in the registry', () => {
  it.each([M, W])('is reachable through get() but not listed in the palette (%#)', (manifest) => {
    const registry = hydrateRegistry(manifest)
    for (const type of EXPLORATORY_TYPES) {
      expect(registry.get(type), type).not.toBeNull()
      expect(registry.types).not.toContain(type)
      expect(registry.entries[type]).toBeUndefined()
    }
  })

  it('renders every value as a token variable, never a raw value', () => {
    const r = hydrateRegistry(M)
    const html = renderToStaticMarkup(
      r.get('primitive:Box')!.render({ padding: 'md', background: 'surface', radius: 'lg' }, r.get('primitive:Text')!.render({ text: 'GOL!', color: 'danger', size: 'size-xl', weight: 'weight-bold' }, null)),
    )
    for (const v of ['--sfs-space-md', '--sfs-color-surface', '--sfs-radius-lg', '--sfs-color-danger', '--sfs-type-size-xl', '--sfs-type-weight-bold']) expect(html).toContain(v)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b|\d+px/i)
    expect(html).toContain('GOL!')
  })

  it('a Proposal is a dotted placeholder that says what it would be', () => {
    const html = renderToStaticMarkup(
      hydrateRegistry(M).get('Proposal')!.render({ description: 'Placar ao vivo', proposedApi: { homeScore: 'number', awayScore: 'number' } }, null),
    )
    expect(html).toContain('data-proposal')
    expect(html).toContain('border-dotted')
    expect(html).not.toContain('border-dashed')
    expect(html).toContain('Proposta · Placar ao vivo')
    expect(html).toContain('homeScore: number · awayScore: number')
  })
})
