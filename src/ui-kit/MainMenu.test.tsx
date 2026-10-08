import { readFileSync } from 'node:fs'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { focusOutline } from '@/primitives'
import { MainMenu } from './MainMenu'

const html = (node: ReactElement): string => renderToStaticMarkup(node)
const css = readFileSync(new URL('./ui-kit.css', import.meta.url), 'utf8')
const primitives = readFileSync(new URL('../primitives/primitives.css', import.meta.url), 'utf8')

describe('<MainMenu>', () => {
  it('draws the TV focus on the channel bug as the outside outline, from data-focused', () => {
    const bug = (out: string) => out.match(/<button[^>]*data-focus-item="channel-bug"[^>]*>/)?.[0] ?? ''
    expect(bug(html(<MainMenu focusedItem="channel-bug" />))).toContain('class="sfs-main-menu-bug sfs-motion sfs-focusable"')
    expect(bug(html(<MainMenu focusedItem="channel-bug" />))).toContain('data-focused=""')
    expect(bug(html(<MainMenu />))).not.toContain('data-focused')
    expect(bug(html(<MainMenu focusedItem="channel-bug" />))).not.toContain('style=')

    // The rule is focusOutline, and the same declarations as real keyboard focus,
    // so the two (equal specificity) cannot disagree whichever sheet loads last.
    const declarations = `outline: ${focusOutline.outline};\n  outline-offset: ${focusOutline.outlineOffset};`
    expect(css).toContain(`.sfs-main-menu-bug[data-focused] {\n  ${declarations}`)
    expect(primitives).toContain(`.sfs-focusable:focus-visible {\n  ${declarations}`)
  })

  it('carries only sizes inline, as --_size on the content circles', () => {
    const out = html(<MainMenu avatarSrc="a.png" />)
    expect(out).toContain('<img src="a.png" alt="" class="sfs-main-menu-circle" style="--_size:var(--dimension-size-semantic-avatar)"/>')
    expect(out).toContain('<span class="sfs-main-menu-circle" data-empty="" style="--_size:var(--dimension-size-semantic-channel-bug)"></span>')
  })

  it('cycles from the tick: one invisible out-of-flow animation, present only with several items', () => {
    expect(html(<MainMenu miscellaneousTitle="Tempo" />)).not.toContain('sfs-carousel-tick')
    const out = html(<MainMenu focusedItem={null} miscellaneousItems={[{ title: 'A' }, { title: 'B' }]} />)
    expect(out).toContain('<span aria-hidden="true" class="sfs-carousel-tick"></span>')
    expect(out).toContain('<span class="sfs-main-menu-cycle" data-fade=""><span class="sfs-main-menu-cycle-layer">')
    expect(primitives).toMatch(
      /\.sfs-carousel-tick \{\s*position: absolute;\s*opacity: 0;\s*pointer-events: none;\s*animation: sfs-carousel-tick var\(--motion-semantic-carousel-step\) linear infinite;/,
    )
  })
})
