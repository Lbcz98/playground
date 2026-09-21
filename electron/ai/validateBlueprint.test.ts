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
    // A raw value on a token prop is a token-tier violation, and the message says so.
    expect(v.errors.some((e) => /"padding" = "10px" is a raw value\. The token tier rule only allows tokens/.test(e))).toBe(true)
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
        props: { padding: 'lg', gap: '2xs' },
        children: [{ type: 'Stack', anchor: true, children: [{ type: 'Button', anchor: true }] }],
      },
    })
    expect(v.ok).toBe(false)
    if (v.ok) return
    const text = v.errors.join('\n')
    expect(text).toMatch(/padding "lg" adds 24px .* set padding to "none"/)
    expect(text).toMatch(/gap "2xs" is 8px .* use "sm"/)
    expect(text).toMatch(/only a direct child of the root can be anchored/)
  })

  it('rejects a statically centered master layout', () => {
    const v = validateBlueprint({ version: 1, screen: { model: 'home', level: 1 }, root: { type: 'Stack', props: { justify: 'center' } } })
    expect(v.ok).toBe(false)
    if (v.ok) return
    expect(v.errors).toEqual([expect.stringMatching(/justify "center" statically centers the master layout/)])
  })

  it('accepts one anchored action group', () => {
    const v = validateBlueprint({
      version: 1,
      screen: { model: 'home', level: 1 },
      root: {
        type: 'Stack',
        children: [
          { type: 'Text', props: { content: 'Now playing' } },
          {
            type: 'Stack',
            anchor: true,
            props: { direction: 'horizontal', gap: '3xs' },
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
        screen: { model: 'home', level: 1 },
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

describe('validateBlueprint — Content Card structure', () => {
  const ZONES = {
    header: { type: 'ContentCardHeader', props: { overline: 'Copa do Mundo', title: 'Estatísticas' } },
    body: { type: 'ContentCardBody', props: { quote: 'Um primeiro tempo de paciência.' }, children: [{ type: 'Text', props: { content: 'Posse 62%' } }] },
    footer: { type: 'ContentCardFooter', props: { caption: 'Atualizado há 1 min' } },
  }
  const screen = (card: Record<string, unknown>) => ({
    version: 1,
    screen: { model: 'interactivity-cards-right', level: 3 },
    root: { type: 'Stack', props: { justify: 'end', align: 'end', grow: true }, children: [card] },
  })
  const card = (children: unknown[], props: Record<string, unknown> = {}) => ({ type: 'ContentCard', props, children })
  const errorsOf = (doc: unknown): string => {
    const v = validateBlueprint(doc)
    return v.ok ? '' : v.errors.join(' | ')
  }

  // Every subset of the three zones, in order — the opt-out the card exists for.
  const subsets: Array<Array<keyof typeof ZONES>> = [
    [],
    ['header'],
    ['body'],
    ['footer'],
    ['header', 'body'],
    ['header', 'footer'],
    ['body', 'footer'],
    ['header', 'body', 'footer'],
  ]
  it.each(subsets.map((s) => [s.join(' + ') || 'no zones', s] as const))('accepts %s', (_, zones) => {
    expect(validateBlueprint(screen(card(zones.map((z) => ZONES[z]))))).toEqual({ ok: true })
  })

  it('rejects zones out of order, naming the order', () => {
    expect(errorsOf(screen(card([ZONES.footer, ZONES.header])))).toMatch(
      /children go in the order <ContentCardHeader>, <ContentCardBody>, <ContentCardFooter>.*<ContentCardHeader> is out of place/,
    )
  })

  it('rejects a zone given twice', () => {
    expect(errorsOf(screen(card([ZONES.header, ZONES.header])))).toMatch(/takes at most one <ContentCardHeader>/)
  })

  it('rejects anything that is not one of its zones', () => {
    expect(errorsOf(screen(card([ZONES.header, { type: 'Text', props: { content: 'loose' } }])))).toMatch(
      /<ContentCard> only takes <ContentCardHeader>, <ContentCardBody>, <ContentCardFooter>.*not <Text>/,
    )
  })

  it('rejects a zone outside a card', () => {
    const doc = screen(ZONES.header)
    expect(errorsOf(doc)).toMatch(/<ContentCardHeader> only goes directly inside <ContentCard>, not <Stack>/)
  })

  it('rejects a zone as the root', () => {
    expect(errorsOf({ version: 1, screen: { model: 'alert', level: 0 }, root: ZONES.body })).toMatch(
      /<ContentCardBody> only goes directly inside <ContentCard>/,
    )
  })

  it('holds the height to the 8pt grid, up to the max', () => {
    expect(validateBlueprint(screen(card([ZONES.header], { height: 456 })))).toEqual({ ok: true })
    expect(validateBlueprint(screen(card([ZONES.header], { height: 272 })))).toEqual({ ok: true })
    expect(errorsOf(screen(card([ZONES.header], { height: 443 })))).toMatch(
      /prop "height" = 443 must be a multiple of 8 from 48 to 456/,
    )
    expect(errorsOf(screen(card([ZONES.header], { height: 464 })))).toMatch(/must be a multiple of 8 from 48 to 456/)
  })

  it('still lets the body hold any content', () => {
    const body = { type: 'ContentCardBody', children: [{ type: 'Stack', children: [{ type: 'Text' }, { type: 'Button' }] }] }
    expect(validateBlueprint(screen(card([body])))).toEqual({ ok: true })
  })
})
