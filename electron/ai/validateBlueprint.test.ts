import { describe, expect, it } from 'vitest'
import { validateBlueprint } from './validateBlueprint'
import { PRICING_CARD_BLUEPRINT } from '@/shared/fixtures/pricingCard'

describe('validateBlueprint (strict, pipeline step 3)', () => {
  it('accepts the pricing-card fixture', () => {
    expect(validateBlueprint(PRICING_CARD_BLUEPRINT)).toEqual({ ok: true })
  })

  it('rejects an unknown component with a helpful message', () => {
    const v = validateBlueprint({
      version: 1,
      root: { type: 'Stack', children: [{ type: 'Carousel' }] },
    })
    expect(v.ok).toBe(false)
    if (v.ok) return
    expect(v.errors.join(' ')).toMatch(/<Carousel> is not a real component/)
  })

  it('rejects unknown props and non-token values (the retry signal)', () => {
    const v = validateBlueprint({
      version: 1,
      root: { type: 'Stack', props: { padding: '10px', boxShadow: 'huge' } },
    })
    expect(v.ok).toBe(false)
    if (v.ok) return
    expect(v.errors.some((e) => /"padding" = "10px" is not an allowed value/.test(e))).toBe(true)
    expect(v.errors.some((e) => /unknown prop "boxShadow"/.test(e))).toBe(true)
  })

  it('rejects children on a leaf component', () => {
    const v = validateBlueprint({
      version: 1,
      root: { type: 'Stack', children: [{ type: 'Text', children: [{ type: 'Button' }] }] },
    })
    expect(v.ok).toBe(false)
    if (v.ok) return
    expect(v.errors.some((e) => /<Text>: cannot have children/.test(e))).toBe(true)
  })

  it('rejects a non-Stack root and a bad version', () => {
    const v1 = validateBlueprint({ version: 1, root: { type: 'Button' } })
    expect(v1.ok).toBe(false)
    const v2 = validateBlueprint({ version: 2, root: { type: 'Stack' } })
    expect(v2.ok).toBe(false)
  })
})
