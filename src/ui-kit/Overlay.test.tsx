import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { OVERLAY_DIRECTIONS, Overlay, SCREEN_MODEL_IDS, ScreenOverlay } from './Overlay'
import { DTV_SCREEN_LAYERS } from '@/shared/design-system/screen-layers'

const CSS = readFileSync(new URL('./ui-kit.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

/** The declarations of the rule whose selector list names `selector`, whitespace-normalised. */
function declarations(selector: string): string {
  for (const [, selectors, body] of CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (selectors.split(',').some((s) => s.trim() === selector)) return body.replace(/\s+/g, ' ').trim()
  }
  throw new Error(`no rule for ${selector} in ui-kit.css`)
}

const SCRIM = 'background-color: var(--color-semantic-overlay-scrim)'
/** The rule that lays the scrim: every direction but the notification's. */
const SCRIM_RULE = ".sfs-overlay:not([data-overlay='top-right'])"

describe('Overlay', () => {
  it('lays the scrim under a directional shade, from semantic tokens only', () => {
    const html = renderToStaticMarkup(<Overlay direction="bottom-left" />)
    expect(html).toContain('class="sfs-overlay"')
    expect(html).toContain('data-overlay="bottom-left"')
    expect(html).not.toContain('style=')
    // the scrim is laid for this direction (it is not the excluded one), and the shade is its gradient
    expect(declarations(SCRIM_RULE)).toBe(`${SCRIM};`)
    expect(declarations(".sfs-overlay[data-overlay='bottom-left']")).toBe(
      'background-image: var(--gradient-semantic-overlay-bottom-left);',
    )
    expect(CSS).not.toMatch(/--(color|gradient)-(core|overlay|opacity)-/)
  })

  it('is the scrim alone at base, and the shade alone for the top-right notification', () => {
    expect(renderToStaticMarkup(<Overlay direction="base" />)).toContain('data-overlay="base"')
    // base is not excluded from the scrim, and no rule gives it a shade
    expect(SCRIM_RULE).not.toContain("'base'")
    expect(CSS).not.toContain("data-overlay='base'")

    expect(renderToStaticMarkup(<Overlay direction="top-right" />)).toContain('data-overlay="top-right"')
    // top-right is the one direction the scrim rule excludes, and it has its gradient
    expect(SCRIM_RULE).toContain("'top-right'")
    expect(declarations(".sfs-overlay[data-overlay='top-right']")).toBe(
      'background-image: var(--gradient-semantic-overlay-top-right);',
    )
  })

  it('gives every direction but base its own gradient, and no other direction the scrim exclusion', () => {
    for (const direction of OVERLAY_DIRECTIONS.filter((d) => d !== 'base')) {
      expect(declarations(`.sfs-overlay[data-overlay='${direction}']`)).toBe(
        `background-image: var(--gradient-semantic-overlay-${direction});`,
      )
    }
    expect(SCRIM_RULE.match(/data-overlay=/g)).toHaveLength(1)
  })

  it('fills its positioned parent, stays out of the way, and hides from assistive tech', () => {
    expect(declarations('.sfs-overlay')).toBe('position: absolute; inset: 0; pointer-events: none;')
    for (const direction of OVERLAY_DIRECTIONS) {
      const html = renderToStaticMarkup(<Overlay direction={direction} />)
      expect(html).toContain('class="sfs-overlay"')
      expect(html).toContain('aria-hidden="true"')
      expect(html).not.toContain('style=')
    }
  })

  it('defaults to the bottom shade', () => {
    expect(renderToStaticMarkup(<Overlay />)).toContain('data-overlay="bottom"')
  })
})

describe('ScreenOverlay', () => {
  it('paints a model’s shades, bottom to top, with the tokens the layer rule names', () => {
    for (const model of DTV_SCREEN_LAYERS.models) {
      const html = renderToStaticMarkup(<ScreenOverlay model={model.id} />)
      expect(html).not.toContain('style=')
      const painted = [...html.matchAll(/class="sfs-screen-overlay-shade" data-shade="([^"]+)"/g)].map((m) => m[1])
      expect(painted).toEqual(model.shades)
      for (const shade of painted) {
        const name = DTV_SCREEN_LAYERS.shades[shade as keyof typeof DTV_SCREEN_LAYERS.shades]
        // the scrim is a colour, every other shade a gradient
        const property = shade === 'scrim' ? 'background-color' : 'background-image'
        expect(declarations(`.sfs-screen-overlay-shade[data-shade='${shade}']`)).toBe(`${property}: var(${name});`)
      }
    }
  })

  it('draws the Home model as scrim + bottom + both corners, and nothing for an unknown model', () => {
    const home = renderToStaticMarkup(<ScreenOverlay model="home" />)
    expect(home).toContain('data-shade="scrim"')
    expect(declarations(".sfs-screen-overlay-shade[data-shade='scrim']")).toBe(`${SCRIM};`)
    expect(home.match(/data-shade=/g)).toHaveLength(4)
    expect(home).toContain('aria-hidden="true"')
    expect(declarations('.sfs-screen-overlay')).toBe('position: absolute; inset: 0; pointer-events: none;')
    expect(renderToStaticMarkup(<ScreenOverlay model="hero" />)).toBe('')
    expect(SCREEN_MODEL_IDS).toHaveLength(DTV_SCREEN_LAYERS.models.length)
  })
})
