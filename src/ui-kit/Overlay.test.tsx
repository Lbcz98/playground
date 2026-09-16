import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { OVERLAY_DIRECTIONS, Overlay } from './Overlay'

const SCRIM = 'background-color:var(--color-semantic-overlay-scrim)'

describe('Overlay', () => {
  it('lays the scrim under a directional shade, from semantic tokens only', () => {
    const html = renderToStaticMarkup(<Overlay direction="bottom-left" />)
    expect(html).toContain(SCRIM)
    expect(html).toContain('background-image:var(--gradient-semantic-overlay-bottom-left)')
    expect(html).not.toMatch(/--(color|gradient)-(core|overlay|opacity)-/)
  })

  it('is the scrim alone at base, and the shade alone for the top-right notification', () => {
    const base = renderToStaticMarkup(<Overlay direction="base" />)
    expect(base).toContain(SCRIM)
    expect(base).not.toContain('background-image')

    const notification = renderToStaticMarkup(<Overlay direction="top-right" />)
    expect(notification).not.toContain(SCRIM)
    expect(notification).toContain('background-image:var(--gradient-semantic-overlay-top-right)')
  })

  it('fills its positioned parent, stays out of the way, and hides from assistive tech', () => {
    for (const direction of OVERLAY_DIRECTIONS) {
      const html = renderToStaticMarkup(<Overlay direction={direction} />)
      expect(html).toContain('position:absolute')
      expect(html).toContain('inset:0')
      expect(html).toContain('pointer-events:none')
      expect(html).toContain('aria-hidden="true"')
    }
  })

  it('defaults to the bottom shade', () => {
    expect(renderToStaticMarkup(<Overlay />)).toContain('--gradient-semantic-overlay-bottom)')
  })
})
