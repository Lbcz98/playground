import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { frameSpec } from '@/design-system/primitives'
import { DTV_SCREEN_LAYERS } from '@/shared/design-system/screen-layers'
import { Screen } from './Screen'

const render = (props: Parameters<typeof Screen>[0]): string => renderToStaticMarkup(<Screen {...props} />)

describe('Screen', () => {
  it('is the 1280×720 frame with the safe-area margin and the gutter from the spacing tokens', () => {
    const html = render({ model: 'home', children: 'x' })
    expect(html).toContain(`width:${frameSpec.baseWidth}px`)
    expect(html).toContain(`height:${frameSpec.baseHeight}px`)
    // 32px margin and 16px gutter are the xl and sm steps — named as tokens, never as pixels.
    expect(frameSpec.margin).toBe(32)
    expect(frameSpec.gutter).toBe(16)
    expect(html).toContain('padding:var(--dimension-spacing-core-xl)')
    expect(html).toContain('gap:var(--dimension-spacing-core-sm)')
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })

  it('stacks video, overlay and content, bottom to top, and paints the model it names', () => {
    const html = render({ model: 'home', level: 1, children: 'content' })
    const at = ['data-screen-layer="video"', 'data-screen-layer="overlay"', 'data-screen-layer="content"'].map((n) => html.indexOf(n))
    expect(at.every((i) => i >= 0)).toBe(true)
    expect([...at].sort((a, b) => a - b)).toEqual(at)
    expect(html).toContain('data-screen-model="home"')
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
    const content = html.slice(html.indexOf('data-screen-layer="content"'))
    expect(content.slice(0, content.indexOf('>'))).not.toContain('background')
  })

  it('pins the anchored group to the corner on the focus side, and only when there is one', () => {
    expect(render({ model: 'home', anchored: 'a' })).toContain('data-anchor-zone="bottom-right"')
    expect(render({ model: 'home', anchored: 'a', focusSide: 'left' })).toContain('data-anchor-zone="bottom-left"')
    expect(render({ model: 'home' })).not.toContain('data-anchor-zone')
  })

  it('shows the video behind the shades when one is given, and scales the frame without re-laying it out', () => {
    const html = render({ model: 'home', video: <i data-video /> , scale: 1.5 })
    expect(html.indexOf('data-video')).toBeLessThan(html.indexOf('data-screen-layer="overlay"'))
    expect(html).toContain('transform:scale(1.5)')
    expect(html).toContain(`width:${frameSpec.baseWidth}px`)
    expect(render({ model: 'home' })).not.toContain('transform')
  })
})
