import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { frameSpec } from '@/design-system/primitives'
import { DTV_SCREEN_LAYERS } from '@/shared/design-system/screen-layers'
import { Screen } from './Screen'

const CSS = readFileSync(new URL('./ui-kit.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

/** The declarations of the rule whose selector list names `selector`, whitespace-normalised. */
function declarations(selector: string): string {
  for (const [, selectors, body] of CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (selectors.split(',').some((s) => s.trim() === selector)) return body.replace(/\s+/g, ' ').trim()
  }
  throw new Error(`no rule for ${selector} in ui-kit.css`)
}

const render = (props: Parameters<typeof Screen>[0]): string => renderToStaticMarkup(<Screen {...props} />)

describe('Screen', () => {
  it('is the 1280×720 frame with the safe-area margin and the gutter from the spacing tokens', () => {
    const html = render({ model: 'home', children: 'x' })
    // the base size is frameSpec's, passed as values; the rule reads them
    expect(html).toContain(`--_width:${frameSpec.baseWidth}px`)
    expect(html).toContain(`--_height:${frameSpec.baseHeight}px`)
    const frame = declarations('.sfs-screen')
    expect(frame).toContain('width: var(--_width);')
    expect(frame).toContain('height: var(--_height);')
    // 32px margin and 16px gutter are the xl and sm steps — named as tokens, never as pixels.
    expect(frameSpec.margin).toBe(32)
    expect(frameSpec.gutter).toBe(16)
    expect(frame).toContain('padding: var(--dimension-spacing-core-xl);')
    expect(frame).toContain('gap: var(--dimension-spacing-core-sm);')
    expect(html).toContain('class="sfs-screen"')
    expect(CSS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })

  it('stacks video, overlay and content, bottom to top, and paints the model it names', () => {
    const html = render({ model: 'home', level: 1, children: 'content' })
    const at = ['data-screen-layer="video"', 'data-screen-layer="overlay"', 'data-screen-layer="content"'].map((n) => html.indexOf(n))
    expect(at.every((i) => i >= 0)).toBe(true)
    expect([...at].sort((a, b) => a - b)).toEqual(at)
    expect(html).toContain('data-screen-model="home"')
    // the video, overlay and content layers fill the frame without taking events
    expect(declarations('.sfs-screen-layer')).toBe('position: absolute; inset: 0; pointer-events: none;')
    expect(html).toContain('data-screen-level="1"')
    // one div per shade of the model, in the model's order
    const shades = DTV_SCREEN_LAYERS.models.find((m) => m.id === 'home')!.shades
    expect([...html.matchAll(/data-shade="([^"]+)"/g)].map((m) => m[1])).toEqual(shades)
  })

  it('paints no shade for a model it does not know, rather than invent one', () => {
    const html = render({ model: 'nope', children: 'x' })
    expect(html).not.toContain('data-shade=')
    expect(html).toContain('data-screen-layer="overlay"')
  })

  it('keeps the content layer free of any background, so the video and the shades show through', () => {
    const html = render({ model: 'home', children: 'x' })
    const tag = html.match(/<div[^>]*data-screen-layer="content"[^>]*>/)![0]
    expect(tag).toContain('class="sfs-screen-content"')
    expect(tag).not.toContain('background')
    expect(tag).not.toContain('style=')
    expect(declarations('.sfs-screen-content')).not.toContain('background')
  })

  it('pins the anchored group to the corner on the focus side, and only when there is one', () => {
    expect(render({ model: 'home', anchored: 'a' })).toContain('data-anchor-zone="bottom-right"')
    expect(render({ model: 'home', anchored: 'a', focusSide: 'left' })).toContain('data-anchor-zone="bottom-left"')
    expect(render({ model: 'home' })).not.toContain('data-anchor-zone')
    expect(declarations(".sfs-screen-anchor[data-anchor-zone='bottom-left']")).toBe('justify-content: flex-start;')
    expect(declarations(".sfs-screen-anchor[data-anchor-zone='bottom-right']")).toBe('justify-content: flex-end;')
  })

  it('shows the video behind the shades when one is given, and scales the frame without re-laying it out', () => {
    const html = render({ model: 'home', video: <i data-video /> , scale: 1.5 })
    expect(html.indexOf('data-video')).toBeLessThan(html.indexOf('data-screen-layer="overlay"'))
    expect(html).toContain('data-scaled=""')
    expect(html).toContain('--_scale:1.5')
    expect(declarations(".sfs-screen[data-scaled]")).toBe('transform-origin: top left; transform: scale(var(--_scale));')
    // the layout size is untouched by the scale
    expect(html).toContain(`--_width:${frameSpec.baseWidth}px`)
    expect(render({ model: 'home' })).not.toContain('data-scaled')
  })
})
