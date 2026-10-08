import { readFileSync } from 'node:fs'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CloseButton } from '@/ui-kit/CloseButton'
import { LabelVideo } from '@/ui-kit/LabelVideo'
import { FocusRing, focusOutline, RestingBorder, Spinner, size, token } from '.'

const html = (node: ReactElement): string => renderToStaticMarkup(node)

describe('typed token helpers', () => {
  it('token() takes semantic names only', () => {
    expect(token('--color-semantic-focus-glow')).toBe('var(--color-semantic-focus-glow)')
    // @ts-expect-error — components may not name a core token.
    token('--color-core-primary-noite-light')
  })

  it('size() takes semantic size roles only', () => {
    expect(size('control-height')).toBe('var(--dimension-size-semantic-control-height)')
    // @ts-expect-error — a spacing step is not a size role.
    size('2xl')
  })
})

describe('<FocusRing>', () => {
  it('draws the shared ring from semantic tokens only', () => {
    const out = html(<FocusRing shape="card-expanded" />)
    expect(out).toContain('aria-hidden="true"')
    expect(out).toContain('var(--gradient-semantic-focus-ring)')
    expect(out).toContain('var(--color-semantic-focus-inset)')
    expect(out).toContain('var(--opacity-semantic-focus-glow)')
    expect(out).not.toMatch(/var\(--[\w-]*-core-/)
  })

  it('is layered like Figma: a fill over the whole shape, then the ring as a band on top', () => {
    const out = html(<FocusRing shape="card-expanded" />)
    expect(out).toContain('border-radius:var(--dimension-radius-semantic-card-expanded)')
    // The gradient sits only on the band (padding = ring width, masked out of the middle)...
    expect(out).toMatch(/class="sfs-focus-cycle sfs-ring-band"[^>]*padding:var\(--dimension-border-width-semantic-focus-ring\)/)
    // ...and the fill comes before it, so nothing blue lies under the interior.
    expect(out.indexOf('--color-semantic-focus-inset)')).toBeLessThan(out.indexOf('--gradient-semantic-focus-ring'))
  })
})

describe('<Spinner>', () => {
  it('is decorative and sized by a size role', () => {
    const out = html(<Spinner size="icon-md" />)
    expect(out).toContain('alt=""')
    // The class sizes it from `--_size`; the role is all the inline style carries.
    expect(out).toContain('class="sfs-spinner sfs-spin"')
    expect(out).toContain('style="--_size:var(--dimension-size-semantic-icon-md)"')
  })
})

describe('<RestingBorder>', () => {
  it('is a decorative layer whose stroke and corner are semantic tokens', () => {
    const out = html(<RestingBorder shape="pill" width="card" />)
    expect(out).toContain('aria-hidden="true"')
    expect(out).toContain('class="sfs-resting-border"')
    expect(out).toContain('--_stroke:var(--dimension-border-width-semantic-card)')
    expect(out).toContain('--_radius:var(--dimension-radius-semantic-pill)')
  })
})

describe('class-styled kit components', () => {
  it('carry their state as data attributes and no static inline style', () => {
    const focused = html(<CloseButton />)
    expect(focused).toMatch(/<button type="button" class="sfs-round-button sfs-motion sfs-focusable" data-state="focus"/)
    expect(focused).toContain('data-focus-ring')
    const resting = html(<CloseButton interactionState="default" />)
    expect(resting).toContain('data-state="default"')
    expect(resting).toContain('class="sfs-resting-border"')
    // Only component-local values (`--_name`) are left inline, outside the FocusRing.
    for (const style of resting.matchAll(/style="([^"]*)"/g)) {
      expect(style[1].split(';').every((declaration) => declaration.startsWith('--_'))).toBe(true)
    }
  })

  it('LabelVideo says its kind, state and size to the stylesheet', () => {
    expect(html(<LabelVideo kind="replay" />)).toMatch(/data-kind="replay" data-state="focus"><img[^>]*class="sfs-label-video-icon"/)
    const mini = html(<LabelVideo mini />)
    expect(mini).toContain('data-mini=""')
    expect(mini).not.toContain('<img')
    expect(html(<LabelVideo kind="replay" mini interactionState="default" />)).not.toContain('data-mini')
    expect(mini).not.toContain('style=')
  })
})

describe('focusOutline', () => {
  it('moves the ring outside the content: ring width, outline colour and offset, all semantic', () => {
    expect(focusOutline).toEqual({
      outline: 'var(--dimension-border-width-semantic-focus-ring) solid var(--color-semantic-focus-outline)',
      outlineOffset: 'var(--dimension-spacing-semantic-focus-offset)',
    })
  })

  it('is also what real keyboard focus draws, unless the control already shows its <FocusRing>', () => {
    const css = readFileSync(new URL('./primitives.css', import.meta.url), 'utf8')
    expect(css).toMatch(
      /\.sfs-focusable:focus-visible \{\s*outline: var\(--dimension-border-width-semantic-focus-ring\) solid var\(--color-semantic-focus-outline\);\s*outline-offset: var\(--dimension-spacing-semantic-focus-offset\);/,
    )
    expect(css).toMatch(/\.sfs-focusable:focus-visible:has\(\[data-focus-ring\]\) \{\s*outline: none;/)
  })
})
