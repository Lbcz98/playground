import { readFileSync } from 'node:fs'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ContentCard, ContentCardBody } from './ContentCard'

const html = (node: ReactElement): string => renderToStaticMarkup(node)
const css = readFileSync(new URL('./ui-kit.css', import.meta.url), 'utf8')
/** The declarations of the one rule with exactly this selector. */
const rule = (selector: string): string => {
  const at = css.indexOf(`\n${selector} {`)
  expect(at, selector).toBeGreaterThan(-1)
  return css.slice(at, css.indexOf('}', at))
}

describe('<ContentCard>', () => {
  it('is the card class with its state; only the height travels inline, as a count of grid steps', () => {
    const out = html(<ContentCard />)
    expect(out).toMatch(/^<div tabindex="0" class="sfs-content-card sfs-motion sfs-focusable" data-state="default" style="--_height:calc\(57 \* var\(--dimension-spacing-core-2xs\)\)">/)
    expect(out).toContain('<div class="sfs-content-card-zones" style="--_gap:var(--dimension-spacing-core-sm)">')
    expect(html(<ContentCard height={200} />)).toContain('data-sized="" style="--_height:calc(25 * var(--dimension-spacing-core-2xs))"')
  })

  it('takes its width, inset and radius from the tokens, and hugs up to the height unless one is set', () => {
    const card = rule('.sfs-content-card')
    expect(card).toContain('width: var(--dimension-size-semantic-content-card-width);')
    expect(card).toContain('padding: var(--dimension-spacing-core-lg);')
    expect(card).toContain('border-radius: var(--dimension-radius-semantic-content-card);')
    expect(rule('.sfs-content-card:not([data-sized])')).toContain('max-height: var(--_height);')
    expect(rule('.sfs-content-card[data-sized]')).toContain('height: var(--_height);')
  })

  it('at rest is translucent with its content dimmed; focused it draws the FocusRing and neither', () => {
    expect(rule(".sfs-content-card[data-state='default']")).toContain(
      'background-color: var(--color-semantic-functional-background-translucent);',
    )
    expect(rule(".sfs-content-card[data-state='default'] > .sfs-content-card-zones")).toContain(
      'opacity: var(--opacity-semantic-content-muted);',
    )
    const focused = html(<ContentCard interactionState="focus" />)
    expect(focused).toContain('data-state="focus"')
    expect(focused).toContain('data-focus-ring')
  })

  it('is one button only when it has something to do', () => {
    expect(html(<ContentCard />)).not.toContain('data-pressable')
    expect(html(<ContentCard onClick={() => {}} />)).toContain('data-pressable="" ')
    expect(rule('.sfs-content-card[data-pressable]')).toContain('cursor: pointer;')
  })

  it('a gap set per use is a pixel value: the zones take it as --_gap, the body re-points table-row-gap', () => {
    const out = html(
      <ContentCard gap={24}>
        <ContentCardBody gap={12} />
      </ContentCard>,
    )
    expect(out).toContain('<div class="sfs-content-card-zones" style="--_gap:24px">')
    expect(out).toContain('<div class="sfs-content-card-body" style="--dimension-spacing-semantic-table-row-gap:12px" data-card-body="">')
    expect(html(<ContentCardBody />)).toBe('<div class="sfs-content-card-body" data-card-body=""></div>')
    expect(rule('.sfs-content-card-zones')).toContain('gap: var(--_gap);')
    expect(rule('.sfs-content-card-body')).toContain('gap: var(--dimension-spacing-semantic-table-row-gap);')
  })
})
