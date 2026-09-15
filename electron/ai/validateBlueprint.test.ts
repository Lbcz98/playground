import { describe, expect, it } from 'vitest'
import { validateBlueprint } from './validateBlueprint'
import { PRICING_CARD_BLUEPRINT } from '@/shared/fixtures/pricingCard'
import { W3C_MANIFEST } from '@/shared/design-system/w3c-manifest'

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

  it('rejects frame-rule violations with retry messages that name the fix', () => {
    const v = validateBlueprint({
      version: 1,
      root: {
        type: 'Stack',
        props: { padding: 'lg', gap: 'sm' },
        children: [{ type: 'Stack', anchor: true, children: [{ type: 'Button', anchor: true }] }],
      },
    })
    expect(v.ok).toBe(false)
    if (v.ok) return
    const text = v.errors.join('\n')
    expect(text).toMatch(/padding "lg" adds 24px .* set padding to "none"/)
    expect(text).toMatch(/gap "sm" is 8px .* use "md"/)
    expect(text).toMatch(/only a direct child of the root can be anchored/)
  })

  it('rejects a statically centered master layout', () => {
    const v = validateBlueprint({ version: 1, root: { type: 'Stack', props: { justify: 'center' } } })
    expect(v.ok).toBe(false)
    if (v.ok) return
    expect(v.errors).toEqual([expect.stringMatching(/justify "center" statically centers the master layout/)])
  })

  it('accepts one anchored action group', () => {
    const v = validateBlueprint({
      version: 1,
      root: {
        type: 'Stack',
        children: [
          { type: 'Text', props: { content: 'Now playing' } },
          {
            type: 'Stack',
            anchor: true,
            props: { direction: 'horizontal', gap: 'xs' },
            children: [{ type: 'Button', props: { label: 'Watch' } }, { type: 'Button', props: { label: 'Details' } }],
          },
        ],
      },
    })
    expect(v).toEqual({ ok: true })
  })

  it('reports an off-grid spacing token once, explained by the grid rule', () => {
    const v = validateBlueprint(
      {
        version: 1,
        root: {
          type: 'Container',
          props: { padding: 'spacing-core-none' },
          children: [{ type: 'Container', props: { padding: 'spacing-core-md' } }],
        },
      },
      W3C_MANIFEST,
    )
    expect(v.ok).toBe(false)
    if (v.ok) return
    expect(v.errors).toEqual([expect.stringMatching(/"spacing-core-md" is 20px — off the 8pt grid/)])
  })
})
