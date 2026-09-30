import { describe, expect, it } from 'vitest'
import { manifestZodSchema } from './manifest'
import { RULES, ruleById, rulesOf } from './rules'
import { SCREENFLOW_MANIFEST } from './screenflow-manifest'

describe('the rules book', () => {
  it('gives every rule a unique id', () => {
    const ids = RULES.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('names only real components in appliesTo', () => {
    for (const rule of RULES) {
      for (const id of ('appliesTo' in rule ? rule.appliesTo : [])) {
        expect(SCREENFLOW_MANIFEST.components[id], `${rule.id} → ${id}`).toBeDefined()
      }
    }
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
