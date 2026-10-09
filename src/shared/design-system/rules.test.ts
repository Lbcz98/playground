import { describe, expect, it } from 'vitest'
import { manifestZodSchema } from './manifest'
import { GLOBAL_RULE_IDS, RULES, ruleById, rulesOf } from './rules'
import { SCREENFLOW_MANIFEST } from './screenflow-manifest'
import { EXPLORATORY_TYPES, PRIMITIVE_TYPES } from './primitives'

describe('the rules book', () => {
  it('gives every rule a unique id', () => {
    const ids = RULES.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('names only real components in appliesTo', () => {
    for (const rule of RULES) {
      for (const id of ('appliesTo' in rule ? rule.appliesTo : [])) {
        // The Exploratory vocabulary is code, not manifest data (primitives.ts).
        expect(SCREENFLOW_MANIFEST.components[id] ?? EXPLORATORY_TYPES.includes(id) ?? undefined, `${rule.id} → ${id}`).toBeTruthy()
      }
    }
  })

  it('leaves out appliesTo only on the rules declared global', () => {
    const global = new Set(GLOBAL_RULE_IDS)
    for (const rule of RULES) {
      const scoped = 'appliesTo' in rule && rule.appliesTo.length > 0
      expect(scoped, `${rule.id}: ${scoped ? 'declared global but scoped' : 'unscoped but not declared global'}`).toBe(!global.has(rule.id))
    }
    for (const id of global) expect(RULES.some((r) => r.id === id), `${id} is not in the book`).toBe(true)
  })

  it('scopes the 9E rules to the Exploratory vocabulary, never globally, and never declarable as laws', () => {
    for (const id of ['primitives.reuse', 'primitives.budget']) {
      const rule = ruleById(SCREENFLOW_MANIFEST, id)!
      expect(rule.flexibility, id).toBe('law')
      expect(rule.appliesTo, id).toEqual([...PRIMITIVE_TYPES])
      expect(GLOBAL_RULE_IDS, id).not.toContain(id)
    }
    const proposal = ruleById(SCREENFLOW_MANIFEST, 'registry.new-component')!
    expect(proposal.flexibility).toBe('pattern')
    expect(proposal.appliesTo).toEqual([...EXPLORATORY_TYPES])
    expect(GLOBAL_RULE_IDS).not.toContain('registry.new-component')
  })

  it('keeps the plan’s laws as laws', () => {
    for (const id of ['tokens.only', 'tokens.semantic-tier', 'grid.8pt', 'frame.layout', 'layers.stack', 'focus.single', 'component.api']) {
      expect(ruleById(SCREENFLOW_MANIFEST, id)?.flexibility, id).toBe('law')
    }
  })

  it('is the built-in manifest’s book, and the fallback for a system without one', () => {
    expect(SCREENFLOW_MANIFEST.rules).toBe(RULES)
    const { rules: _, ...bare } = SCREENFLOW_MANIFEST
    expect(rulesOf(bare)).toBe(RULES)
  })

  it('travels through the strict manifest schema (IPC and imports)', () => {
    const parsed = manifestZodSchema.parse(SCREENFLOW_MANIFEST)
    expect(parsed.rules).toEqual(RULES)
  })

  it('rejects a book with a duplicate id or an unknown level', () => {
    const dup = { ...SCREENFLOW_MANIFEST, rules: [RULES[0], RULES[0]] }
    expect(manifestZodSchema.safeParse(dup).success).toBe(false)
    const bad = { ...SCREENFLOW_MANIFEST, rules: [{ ...RULES[0], flexibility: 'suggestion' }] }
    expect(manifestZodSchema.safeParse(bad).success).toBe(false)
  })
})

describe('real-app navigation rules', () => {
  it('carries the flow rules with the right flexibility', () => {
    const want = { 'flow.level-keys': 'law', 'flow.no-wrap': 'law', 'flow.back-steps': 'law', 'flow.focus-memory': 'law', 'flow.rail-side': 'convention', 'level.initial-focus': 'pattern' }
    for (const [id, flex] of Object.entries(want)) expect(ruleById(SCREENFLOW_MANIFEST, id)?.flexibility, id).toBe(flex)
  })
  it('states the bug as level 1 initial focus', () => {
    expect(ruleById(SCREENFLOW_MANIFEST, 'level.initial-focus')!.statement).toMatch(/bug/)
  })
})
