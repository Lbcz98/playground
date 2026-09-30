/** Phase 9E: the Exploratory prompts carry the vocabulary; Faithful prompts carry none of it. */
import { describe, expect, it } from 'vitest'
import { buildPlannerPrompt, buildSystemPrompt } from './promptSpec'
import { SCREENFLOW_MANIFEST as M } from '@/shared/design-system/screenflow-manifest'
import { W3C_MANIFEST as W } from '@/shared/fixtures/w3cManifest'

describe('the Exploratory prompts', () => {
  it('the planner: prefer the registry, then a primitive (with what was considered), then a Proposal', () => {
    const p = buildPlannerPrompt(M, { prompt: 'x', mode: 'exploratory' })
    expect(p).toContain('# Exploratory mode — beyond the registry')
    expect(p).toContain("Prefer the registry's components, recomposed.")
    expect(p).toContain('"Primitive: <type> — considered <the components you\n  looked at, by name> — <why none of them does it>"')
    expect(p).toContain('"Proposal:\n  <what it is> — <its props: name: type, …>"')
    expect(p).toContain('At most 3 primitives inside each other and 6 per screen, text included')
    expect(p).toContain('A request that fits the registry uses no primitive and no Proposal.')
  })

  it('the generator: the primitives with their props, reuse, the budget, the laws, the Proposal shape', () => {
    for (const out of ['tool', 'json'] as const) {
      const p = buildSystemPrompt(out, M, 'exploratory')
      expect(p).toContain('# Exploratory mode — beyond the registry')
      expect(p).toContain('a\nrequest that fits the registry uses none of it')
      expect(p).toMatch(/tokens only\n\(never a hex, px or rgb\)/)
      expect(p).toContain('- primitive:Text: text (required text), color (a colors token, same names as the components use), size (size-xs | size-sm')
      expect(p).toContain('weight (weight-regular | weight-medium | weight-semibold | weight-bold); no children')
      expect(p).toContain('- primitive:Box: padding (a spacing token')
      expect(p).toContain('"reuse": { "considered": "<the registry components you looked at, by id, comma-separated>"')
      expect(p).toContain('"considered" names real\ncomponents (Stack, Text, Button')
      expect(p).toContain('Budget: at most 3 primitives nested in primitives, and 6 per screen, primitive:Text included.')
      expect(p).toContain('"deviation": { "ruleId": "registry.new-component", "why": "<why the registry lacks it>" } }')
      expect(p).toContain('proposedApi has 1 to 12 props')
      expect(p).toContain('- registry.new-component — Catalog components only')
    }
  })

  it('an imported system’s prompt names its own components and tokens', () => {
    const p = buildSystemPrompt('tool', W, 'exploratory')
    expect(p).toContain('"considered" names real\ncomponents (Container, Text, Button)')
    expect(p).not.toContain('InteractivityButton')
  })
})

describe('Faithful prompts carry none of it', () => {
  it('no vocabulary, no primitive, no Proposal', () => {
    for (const p of [buildPlannerPrompt(M), buildPlannerPrompt(M, { prompt: 'x', mode: 'faithful' }), buildSystemPrompt('tool', M), buildSystemPrompt('json', M, 'faithful')]) {
      expect(p).not.toMatch(/beyond the registry|primitive:|Proposal|reuse/)
    }
  })
})
