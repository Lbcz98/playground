import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { OVERLAY_DIRECTIONS, Overlay, SCREEN_MODEL_IDS, ScreenOverlay } from './Overlay'
import { DTV_SCREEN_LAYERS } from '@/shared/design-system/screen-layers'

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

describe('ScreenOverlay', () => {
  it('paints a model’s shades, bottom to top, with the tokens the layer rule names', () => {
    for (const model of DTV_SCREEN_LAYERS.models) {
      const html = renderToStaticMarkup(<ScreenOverlay model={model.id} />)
      const painted = [...html.matchAll(/data-shade="([^"]+)" style="[^"]*?(?:background-color|background-image):var\((--[^)]+)\)/g)]
      expect(painted.map((m) => m[1])).toEqual(model.shades)
      for (const [, shade, name] of painted) {
        expect(name).toBe(DTV_SCREEN_LAYERS.shades[shade as keyof typeof DTV_SCREEN_LAYERS.shades])
      }
    }
  })

  it('draws the Home model as scrim + bottom + both corners, and nothing for an unknown model', () => {
    const home = renderToStaticMarkup(<ScreenOverlay model="home" />)
    expect(home).toContain(SCRIM)
    expect(home.match(/data-shade=/g)).toHaveLength(4)
    expect(home).toContain('aria-hidden="true"')
    expect(renderToStaticMarkup(<ScreenOverlay model="hero" />)).toBe('')
    expect(SCREEN_MODEL_IDS).toHaveLength(DTV_SCREEN_LAYERS.models.length)
  })
})
