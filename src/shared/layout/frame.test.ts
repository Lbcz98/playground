import { describe, expect, it } from 'vitest'
import {
  FRAME,
  FRAME_SIZES,
  anchorZone,
  auditFrameLayout,
  focusSideOf,
  frameLayoutErrors,
  isOnGrid,
  onGridSpacingNames,
  parseLengthPx,
  readingOrder,
  snapSpacingName,
} from './frame'
import { interpretBlueprint } from '@/interpreter/interpret'
import { homeTemplate } from '@/shared/templates/home'
import { SCREENFLOW_MANIFEST } from '@/shared/design-system/screenflow-manifest'
import { W3C_MANIFEST } from '@/shared/fixtures/w3cManifest'

const S = SCREENFLOW_MANIFEST

describe('frame sizes', () => {
  it('lays out on the 1280×720 base and shows it as is, or upscaled 1.5× to 1920×1080', () => {
    expect(FRAME.base).toEqual({ width: 1280, height: 720 })
    expect(FRAME.upscale).toBe(1.5)
    expect(FRAME_SIZES['1080p']).toMatchObject({ width: 1920, height: 1080, scale: 1.5, label: '1920×1080' })
    expect(FRAME_SIZES['720p']).toMatchObject({ width: 1280, height: 720, scale: 1, label: '1280×720' })
    expect(FRAME_SIZES['1080p'].description).toBe('1280×720 upscaled 1.5×')
  })

  it('uses a 32px margin and 16px gutters, with both frame sizes on the 8pt grid', () => {
    expect([FRAME.grid, FRAME.margin, FRAME.gutter]).toEqual([8, 32, 16])
    for (const size of Object.values(FRAME_SIZES)) {
      for (const px of [size.width, size.height]) expect(px % 8).toBe(0)
    }
  })

  it('judges the 1280×720 layout, naming how it is shown (1080p by default)', () => {
    expect(auditFrameLayout(homeTemplate.blueprint, S)[0].label).toBe('Layout 1280×720, shown at 1920×1080 (× 1.5)')
    expect(auditFrameLayout(homeTemplate.blueprint, S, '720p')[0].label).toBe('Layout 1280×720')
  })
})

describe('TV focus reading', () => {
  const box = (top: number, left: number, width = 100, height = 40) => ({ top, left, width, height })

  it('reads top to bottom, and left to right within a row', () => {
    const lowRight = box(500, 900)
    const topRight = box(100, 1200)
    const topLeft = box(110, 200) // overlaps topRight's row despite starting lower
    const lowLeft = box(500, 100)
    expect(readingOrder([lowRight, topRight, topLeft, lowLeft])).toEqual([topLeft, topRight, lowLeft, lowRight])
  })

  it("puts the focus on the side its center falls on — dead center counts as right", () => {
    expect(focusSideOf(box(0, 100), 1920)).toBe('left')
    expect(focusSideOf(box(0, 1500), 1920)).toBe('right')
    expect(focusSideOf(box(0, 910), 1920)).toBe('right') // center at 960
    expect(focusSideOf(box(0, 500), 1280)).toBe('left') // center 550 < 640
    expect(focusSideOf(box(0, 700), 1280)).toBe('right')
  })

  it('anchors bottom-right for right focus or nothing focusable, mirrored bottom-left for left', () => {
    expect(anchorZone('right')).toBe('bottom-right')
    expect(anchorZone('neutral')).toBe('bottom-right')
    expect(anchorZone('left')).toBe('bottom-left')
  })
})

describe('8pt grid', () => {
  it('accepts multiples of 8 plus the 4px and 12px exceptions — nothing else', () => {
    for (const px of [0, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96]) expect(isOnGrid(px), `${px}`).toBe(true)
    for (const px of [2, 6, 10, 14, 18, 20, 28, 36]) expect(isOnGrid(px), `${px}`).toBe(false)
  })

  it('parses px, rem and unitless lengths', () => {
    expect(parseLengthPx('16px')).toBe(16)
    expect(parseLengthPx('1.5rem')).toBe(24)
    expect(parseLengthPx('0')).toBe(0)
    expect(parseLengthPx('calc(1px + 2px)')).toBeNull()
  })

  it('cuts the off-grid 20px step out of the global-css spacing scale, keeping 4px and 12px', () => {
    const names = onGridSpacingNames(W3C_MANIFEST, Object.keys(W3C_MANIFEST.tokens.spacing))
    expect(names).not.toContain('spacing-core-md')
    expect(names).toContain('spacing-core-3xs') // 4px
    expect(names).toContain('spacing-core-xs') // 12px
    expect(names).toContain('spacing-core-sm') // 16px
  })

  it('snaps an off-grid step to the nearest allowed one', () => {
    const names = Object.keys(W3C_MANIFEST.tokens.spacing)
    expect(snapSpacingName(W3C_MANIFEST, names, 'spacing-core-md')).toBe('spacing-core-sm')
    expect(snapSpacingName(W3C_MANIFEST, names, 'spacing-core-lg')).toBe('spacing-core-lg')
  })
})

describe('one focused element per screen', () => {
  // The screen a live generation actually returned: the menu holds the programme
  // AND a card holds the focus — two focus rings on one TV screen.
  const twoFocused = {
    version: 1,
    screen: { model: 'home', level: 1 },
    root: {
      type: 'Stack',
      props: { direction: 'vertical', justify: 'end', gap: 'sm', padding: 'none' },
      children: [
        {
          type: 'InteractivityMenu',
          children: [
            { type: 'InteractivityButton', props: { title: 'Enquete' } },
            { type: 'InteractivityButton', props: { title: 'Estatísticas', interactionState: 'focus' } },
          ],
        },
        { type: 'MainMenu', props: { focusedItem: 'program' } },
      ],
    },
  }

  it('rejects two focused elements, naming both and how to rest one', () => {
    const errors = frameLayoutErrors(twoFocused, S)
    const problem = errors.find((e) => e.includes('elements are focused'))
    expect(problem).toBeDefined()
    expect(problem).toContain('<InteractivityButton>: interactionState "focus"')
    expect(problem).toContain('<MainMenu>: focusedItem "program"')
    expect(problem).toContain('a TV screen has exactly one')
    expect(problem).toMatch(/focusedItem "none"/)
  })

  it('counts a focus the component takes by default, not only a declared one', () => {
    // MainMenu with no props still focuses the programme — that is what it renders.
    const implicit = {
      ...twoFocused,
      root: { ...twoFocused.root, children: [twoFocused.root.children[0], { type: 'MainMenu' }] },
    }
    expect(frameLayoutErrors(implicit, S).some((e) => e.includes('elements are focused'))).toBe(true)
  })

  it('accepts one focused element, and none at all', () => {
    const one = {
      ...twoFocused,
      root: {
        ...twoFocused.root,
        children: [
          {
            type: 'InteractivityMenu',
            children: [{ type: 'InteractivityButton', props: { title: 'Enquete' } }],
          },
          { type: 'MainMenu', props: { focusedItem: 'program' } },
        ],
      },
    }
    expect(frameLayoutErrors(one, S).some((e) => e.includes('elements are focused'))).toBe(false)

    const none = {
      version: 1,
      screen: { model: 'alert', level: 0 },
      root: {
        type: 'Stack',
        props: { direction: 'vertical', justify: 'end', align: 'stretch', gap: 'sm', padding: 'none' },
        children: [{ type: 'AlertBug', props: { interactionState: 'default' } }],
      },
    }
    expect(frameLayoutErrors(none, S)).toEqual([])
  })

  it('leaves a design system with no focus props alone', () => {
    const errors = frameLayoutErrors(
      { version: 1, root: { type: 'Group', children: [{ type: 'Label' }, { type: 'Label' }] } },
      W3C_MANIFEST,
    )
    expect(errors.some((e) => e.includes('elements are focused'))).toBe(false)
  })
})

describe('auditFrameLayout — the layout QA checklist', () => {
  it('passes the home template on every check', () => {
    const checks = auditFrameLayout(homeTemplate.blueprint, S)
    expect(checks.map((c) => c.id)).toEqual(['frame', 'margins', 'grid', 'focus', 'layers'])
    expect(checks.every((c) => c.ok)).toBe(true)
  })

  it('rejects a root that adds its own outer margin', () => {
    const errors = frameLayoutErrors({ version: 1, root: { type: 'Stack', props: { padding: 'xl' } } }, S)
    expect(errors.join('\n')).toMatch(/padding "xl" adds 32px .* set padding to "none"/)
  })

  it('requires 16px gutters on the root and on module groups, but not on leaf clusters', () => {
    const errors = frameLayoutErrors(
      {
        version: 1,
        root: {
          type: 'Stack',
          props: { gap: 'lg' },
          children: [
            { type: 'Stack', props: { direction: 'horizontal', gap: 'xl' }, children: [{ type: 'Stack' }, { type: 'Stack' }] },
            { type: 'Stack', props: { direction: 'horizontal', gap: '3xs' }, children: [{ type: 'Button' }, { type: 'Button' }] },
          ],
        },
      },
      S,
    )
    expect(errors.some((e) => /^root <Stack>: gap "lg" is 24px .*use "sm"/.test(e))).toBe(true)
    expect(errors.some((e) => /^root › Stack\[0\] <Stack>: gap "xl" is 32px/.test(e))).toBe(true)
    expect(errors.some((e) => e.includes('Stack[1]'))).toBe(false)
  })

  it('stops at a module: stacked rows inside a card keep the card spacing, and the interpreter leaves them', () => {
    const rows = { type: 'Stack', props: { gap: '2xs' }, children: [{ type: 'Stack' }, { type: 'Stack' }] }
    const doc = {
      version: 1,
      root: {
        type: 'Stack',
        props: { gap: 'sm', padding: 'none', align: 'stretch' },
        children: [{ type: 'ContentCard', children: [{ type: 'ContentCardBody', children: [rows] }] }],
      },
    }
    expect(frameLayoutErrors(doc, S).filter((e) => /apart/.test(e))).toEqual([])
    const out = interpretBlueprint(doc, S)
    expect(out.issues.some((i) => /sit exactly/.test(i.message))).toBe(false)
  })

  it('flags off-grid spacing on any node, including an unset prop whose default is off-grid', () => {
    const offGridDefault = {
      ...W3C_MANIFEST,
      components: {
        ...W3C_MANIFEST.components,
        Container: {
          ...W3C_MANIFEST.components.Container,
          props: {
            ...W3C_MANIFEST.components.Container.props,
            padding: { ...W3C_MANIFEST.components.Container.props.padding, defaultValue: 'spacing-core-md' },
          },
        },
      },
    }
    const errors = frameLayoutErrors(
      { version: 1, screen: { model: 'home', level: 1 }, root: { type: 'Container', props: { padding: 'spacing-core-none' }, children: [{ type: 'Container' }] } },
      offGridDefault,
    )
    expect(errors).toEqual([
      expect.stringMatching(/^root › Container\[0\] <Container>: padding "spacing-core-md" is 20px — off the 8pt grid/),
    ])
  })

  it('lets exactly one direct child of the root be anchored', () => {
    const nested = frameLayoutErrors(
      { version: 1, root: { type: 'Stack', children: [{ type: 'Stack', children: [{ type: 'Button', anchor: true }] }] } },
      S,
    )
    expect(nested.some((e) => /only a direct child of the root can be anchored/.test(e))).toBe(true)

    const twice = frameLayoutErrors(
      { version: 1, root: { type: 'Stack', children: [{ type: 'Button', anchor: true }, { type: 'Button', anchor: true }] } },
      S,
    )
    expect(twice.some((e) => /2 children are anchored/.test(e))).toBe(true)

    const once = frameLayoutErrors(
      { version: 1, screen: { model: 'home', level: 1 }, root: { type: 'Stack', children: [{ type: 'Text' }, { type: 'Button', anchor: true }] } },
      S,
    )
    expect(once).toEqual([])
  })

  it('rejects a statically centered master layout, but not centered content inside it', () => {
    const errors = frameLayoutErrors(
      {
        version: 1,
        screen: { model: 'home', level: 1 },
        root: {
          type: 'Stack',
          props: { align: 'center', justify: 'center' },
          children: [{ type: 'Stack', props: { align: 'center' } }],
        },
      },
      S,
    )
    expect(errors).toEqual([
      expect.stringMatching(/^root <Stack>: align "center" — the stack that holds the components always stretches/),
      expect.stringMatching(/^root <Stack>: justify "center" statically centers the master layout .*use "start"/),
    ])
  })
})
