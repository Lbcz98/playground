import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FocusRing, focusOutline, Spinner, size, token } from '.'

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

  it('insets the inner fill by the ring width and follows the shape', () => {
    expect(html(<FocusRing shape="card-expanded" />)).toContain(
      'border-radius:calc(var(--dimension-radius-semantic-card-expanded) - var(--dimension-border-width-semantic-focus-ring))',
    )
  })
})

describe('<Spinner>', () => {
  it('is decorative and sized by a size role', () => {
    const out = html(<Spinner size="icon-md" />)
    expect(out).toContain('alt=""')
    expect(out).toContain('class="sfs-spin"')
    expect(out).toContain('width:var(--dimension-size-semantic-icon-md)')
  })
})

describe('focusOutline', () => {
  it('moves the ring outside the content: ring width, outline colour and offset, all semantic', () => {
    expect(focusOutline).toEqual({
      outline: 'var(--dimension-border-width-semantic-focus-ring) solid var(--color-semantic-focus-outline)',
      outlineOffset: 'var(--dimension-spacing-semantic-focus-offset)',
    })
  })
})
