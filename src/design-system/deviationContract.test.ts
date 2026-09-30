/** Phase 9D: the Exploratory prompts carry the deviation contract; Faithful prompts carry none of it. */
import { describe, expect, it } from 'vitest'
import { buildPlannerPrompt, buildSystemPrompt } from './promptSpec'
import { declarableRules } from '@/shared/design-system/deviations'
import { RULES } from '@/shared/design-system/rules'
import { SCREENFLOW_MANIFEST as M } from '@/shared/design-system/screenflow-manifest'
import { W3C_MANIFEST } from '@/shared/fixtures/w3cManifest'

describe('Exploratory prompts', () => {
  it('the planner is told which breaks to plan and how to record them', () => {
    const p = buildPlannerPrompt(M, { prompt: 'x', mode: 'exploratory' })
    expect(p).toContain('# Exploratory mode — declared deviations')
    expect(p).toContain('"Deviation: <rule id> — <why, in one short sentence>"')
    expect(p).toContain('composing a new overlay is not available yet')
  })

  it('the generator gets the deviation field, its scope and both ways to fail the audit', () => {
    for (const out of ['tool', 'json'] as const) {
      const p = buildSystemPrompt(out, M, 'exploratory')
      expect(p).toContain('"deviation": { "ruleId": "<pattern id>"')
      expect(p).toContain('it covers that node and everything inside it')
      expect(p).toContain('A break that is not declared is an error, and so is a declaration')
      expect(p).toContain('"screen": { "model": …, "level": …, "deviation": [')
    }
  })

  it('lists every declarable pattern, and no law and not the overlay rule', () => {
    const p = buildSystemPrompt('tool', M, 'exploratory')
    const listed = p.slice(p.indexOf('Patterns that may be declared'))
    for (const rule of declarableRules(M)) expect(listed).toContain(`- ${rule.id} — `)
    for (const rule of RULES.filter((r) => r.flexibility !== 'pattern')) expect(listed).not.toContain(`- ${rule.id} — `)
    expect(listed).not.toContain('layers.overlay-model —')
    expect(p).toMatch(/A LAW is never broken and never\s+declared: .*Tokens only \(tokens\.only\)/)
  })

  it('an imported system’s own book decides the list', () => {
    const own = { ...W3C_MANIFEST, rules: [{ id: 'x.grid', title: 'Grid', statement: 's', flexibility: 'pattern' as const, category: 'c', source: 'test' }] }
    const p = buildSystemPrompt('tool', own, 'exploratory')
    expect(p).toContain('- x.grid — Grid: s')
    expect(p).not.toContain('layout.root-align')
  })
})

describe('Faithful prompts stay clean', () => {
  it('carry no trace of the contract, with or without the request', () => {
    for (const p of [buildPlannerPrompt(M), buildPlannerPrompt(M, { prompt: 'x', mode: 'faithful' }), buildSystemPrompt('tool', M), buildSystemPrompt('json', M, 'faithful')]) {
      expect(p).not.toMatch(/Exploratory mode|declared deviations|"deviation"/)
    }
  })

  it('are byte-identical whether the mode is omitted or Faithful', () => {
    expect(buildPlannerPrompt(M, { prompt: 'Card de conteúdo' })).toBe(buildPlannerPrompt(M, { prompt: 'Card de conteúdo', mode: 'faithful' }))
    expect(buildSystemPrompt('tool', M)).toBe(buildSystemPrompt('tool', M, 'faithful'))
  })
})
