import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import { MainMenu, type MainMenuItem } from '@/ui-kit/MainMenu'
import { focusableInNode } from './focusReading'

/**
 * Stand-in elements for a component's focusable buttons, built from its real
 * markup — enough of `matches` / `querySelector` / `contains` for the picker.
 */
function buttonsOf(node: ReactElement) {
  const html = renderToStaticMarkup(node)
  const buttons = [...html.matchAll(/<button([^>]*)>([\s\S]*?)<\/button>/g)].map(([, attrs, body]) => {
    const el = {
      item: attrs.match(/data-focus-item="([^"]+)"/)?.[1],
      matches: (selector: string) => selector === '[data-focused]' && /\sdata-focused(=|\s|$)/.test(attrs),
      querySelector: (selector: string) => (selector === '[data-focus-ring]' && body.includes('data-focus-ring') ? {} : null),
    }
    return { el: el as unknown as Element, item: el.item }
  })
  const host = { contains: (el: Element) => buttons.some((b) => b.el === el) } as unknown as Element
  return { host, buttons }
}

const readFocus = (node: ReactElement): string | undefined => {
  const { host, buttons } = buttonsOf(node)
  return focusableInNode(host, buttons)?.item
}

describe('focus reading — a selected node reports the button it draws focused', () => {
  it.each<MainMenuItem>(['program', 'login', 'schedule', 'miscellaneous', 'channel-bug'])('MainMenu focused on %s', (item) => {
    expect(readFocus(<MainMenu focusedItem={item} />)).toBe(item)
  })

  it('Program by default, not the first button (Login)', () => {
    expect(readFocus(<MainMenu />)).toBe('program')
  })

  it('with nothing drawn focused, the first button in the node', () => {
    expect(readFocus(<MainMenu focusedItem={null} />)).toBe('login')
  })

  it('nothing to read without a node', () => {
    expect(focusableInNode(null, buttonsOf(<MainMenu />).buttons)).toBeUndefined()
  })
})
