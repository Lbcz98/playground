import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { Button as PrimitiveButton, resetDeprecationWarnings } from '@/primitives'
import { InteractivityButton } from './InteractivityButton'
import { InteractivityMenu } from './InteractivityMenu'
import { LabelVideo } from './LabelVideo'
import { MainMenu } from './MainMenu'
import { RoundButtonShell } from './RoundButtonShell'
import { RoundedButton } from './RoundedButton'
import { WideButton } from './WideButton'

const html = (node: ReactElement): string => renderToStaticMarkup(node)

let warn: MockInstance<typeof console.warn>

beforeEach(() => {
  resetDeprecationWarnings()
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  warn.mockRestore()
})

/** [component, deprecated prop, legacy render, the same thing with interactionState] */
const LEGACY_PROPS: Array<[string, string, () => ReactElement, () => ReactElement]> = [
  ['ui-kit/InteractivityButton', 'state', () => <InteractivityButton state="selected" />, () => <InteractivityButton interactionState="selected" />],
  ['ui-kit/WideButton', 'status', () => <WideButton status="loading" />, () => <WideButton interactionState="loading" />],
  [
    'ui-kit/RoundButtonShell',
    'focus',
    () => <RoundButtonShell label="Back" focus />,
    () => <RoundButtonShell label="Back" interactionState="focus" />,
  ],
  ['ui-kit/RoundedButton', 'focus', () => <RoundedButton focus={false} />, () => <RoundedButton interactionState="default" />],
  ['ui-kit/LabelVideo', 'focus', () => <LabelVideo focus={false} />, () => <LabelVideo interactionState="default" />],
  [
    'primitives/Button',
    'status',
    () => <PrimitiveButton status="disabled">Go</PrimitiveButton>,
    () => <PrimitiveButton interactionState="disabled">Go</PrimitiveButton>,
  ],
]

describe('deprecated state props', () => {
  it.each(LEGACY_PROPS)('%s: `%s` renders exactly what interactionState renders', (component, prop, legacy, next) => {
    expect(html(legacy())).toBe(html(next()))
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]![0]).toBe(
      `[${component}] \`${prop}\` is deprecated and will be removed. Use \`interactionState\` instead.`,
    )
  })

  it('warns once per component and prop, not once per render', () => {
    html(<WideButton status="default" />)
    html(<WideButton status="focus" />)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('lets interactionState win when a caller passes both', () => {
    expect(html(<WideButton status="loading" interactionState="focus" />)).toBe(
      html(<WideButton interactionState="focus" />),
    )
  })

  it('MainMenu: bugFocused maps onto focusedItem="channel-bug"', () => {
    expect(html(<MainMenu bugFocused />)).toBe(html(<MainMenu focusedItem="channel-bug" />))
    expect(html(<MainMenu bugFocused={false} />)).toBe(html(<MainMenu focusedItem="program" />))
    expect(warn.mock.calls[0]![0]).toContain('[ui-kit/MainMenu] `bugFocused` is deprecated')
  })

  it('MainMenu focuses exactly one item', () => {
    const rings = (node: ReactElement) => html(node).split('var(--gradient-semantic-focus-ring)').length - 1
    const outlines = (node: ReactElement) => html(node).split('var(--color-semantic-focus-outline)').length - 1
    expect(rings(<MainMenu />)).toBe(1)
    expect(rings(<MainMenu focusedItem="miscellaneous" />)).toBe(1)
    expect([rings(<MainMenu focusedItem="channel-bug" />), outlines(<MainMenu focusedItem="channel-bug" />)]).toEqual([0, 1])
    expect(rings(<MainMenu focusedItem={null} />) + outlines(<MainMenu focusedItem={null} />)).toBe(0)
  })

  it('Miscellaneous shows the dots of "more" only while focused', () => {
    expect(html(<MainMenu focusedItem="miscellaneous" />)).toContain('miscellaneous-focus')
    expect(html(<MainMenu />)).not.toContain('miscellaneous-focus')
  })

  it('no kit component uses a deprecated prop internally', () => {
    html(<InteractivityMenu items={[{ title: 'A' }, { title: 'B' }]} activeIndex={0} />)
    html(<InteractivityButton />)
    html(<RoundedButton />)
    html(<MainMenu />)
    expect(warn).not.toHaveBeenCalled()
  })
})
