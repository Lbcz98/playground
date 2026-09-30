/**
 * The planner prompt's bytes, pinned before phase 9C added the `appliesTo` rules
 * section. A request that names no component must keep getting exactly this prompt.
 */
import { describe, expect, it } from 'vitest'
import { buildPlannerPrompt } from './promptSpec'
import { SCREENFLOW_MANIFEST } from '@/shared/design-system/screenflow-manifest'
import { W3C_MANIFEST } from '@/shared/fixtures/w3cManifest'

describe('planner prompt (byte snapshot)', () => {
  it('is unchanged for the built-in system', () => {
    expect(buildPlannerPrompt(SCREENFLOW_MANIFEST)).toMatchSnapshot()
  })

  it('is unchanged for an imported system', () => {
    expect(buildPlannerPrompt(W3C_MANIFEST)).toMatchSnapshot()
  })
})

describe('planner prompt — rules for the components a request names (appliesTo)', () => {
  it('stays byte-identical when the request names no component, traps included', () => {
    for (const prompt of ['Mostre as estatísticas da partida', 'Mostre o contexto da partida', 'Um cardápio de opções de áudio']) {
      expect(buildPlannerPrompt(SCREENFLOW_MANIFEST, { prompt })).toBe(buildPlannerPrompt(SCREENFLOW_MANIFEST))
    }
    expect(buildPlannerPrompt(W3C_MANIFEST, { prompt: 'a pricing page' })).toBe(buildPlannerPrompt(W3C_MANIFEST))
  })

  it('adds only the rules scoped to the named components', () => {
    const prompt = buildPlannerPrompt(SCREENFLOW_MANIFEST, { prompt: 'Card de conteúdo com a escalação do time' })
    expect(prompt).toContain('# Rules for the components this request names')
    expect(prompt).toContain('(layout.slots)')
    expect(prompt).not.toContain('(flow.link-roles)')
    expect(prompt).not.toContain('(tokens.only)') // global rules stay in the prose
  })
})
