/**
 * Interactivity Menu — Figma UI Kit node 2968:9213, cross-checked against a
 * real usage (Handoff/DTV file, node 22440:81041, an audio-options rail).
 *
 * A horizontal rail of `Button` cards. At rest every item is `default`
 * (158×122). Once the rail is entered, the WHOLE ROW expands: the active item
 * becomes `focus` (208×160, gradient ring) and every other item becomes
 * `selected` (208×160, dimmed) — not back to `default`. The real usage
 * confirmed this scrolls: earlier items slide off the leading edge as focus
 * moves, so the row is horizontally scrollable and keeps the active card in
 * view rather than clipping it.
 *
 * Controlled, not self-navigating: `activeIndex` is the caller's state (a
 * real remote/keyboard handler lives in the app, not in this component) —
 * consistent with Button/WideButton/RoundedButton, none of which manage their
 * own interaction state either.
 */

import { Children, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { spacing, Stack, Text } from '@/primitives'
import { Button, type ButtonState } from './Button'

export interface InteractivityMenuItem {
  title: string
  /** Fills the card's thumbnail slot — an image, an icon, or nothing. */
  thumbnail?: ReactNode
  onClick?: () => void
}

export interface InteractivityMenuProps {
  /** The rail's cards. Ignored when `children` are given. */
  items?: InteractivityMenuItem[]
  /**
   * The cards, composed instead of described — how the canvas builds the rail,
   * where each card is its own node carrying its own interaction state. The row
   * then expands through those children rather than `activeIndex`.
   */
  children?: ReactNode
  /** Index of the focused item. `null`/`undefined` = the rail at rest, every
   *  item `default`. Any other index expands the whole row. */
  activeIndex?: number | null
  /** Optional label above the rail, right-aligned to match the source usage. */
  heading?: string
  /**
   * Which edge the cards sit on when they don't fill the row. The home screen
   * keeps its rail on the right, over the anchored side of the menu; a focused
   * rail (nível 2) starts from the left. Default `start`.
   */
  align?: 'start' | 'end'
}

/** Scrolls horizontally, so it stays a plain element rather than a Stack. */
const rail: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: spacing('2xs'),
  overflowX: 'auto',
}

function stateFor(index: number, activeIndex: number | null | undefined): ButtonState {
  if (activeIndex == null) return 'default'
  return index === activeIndex ? 'focus' : 'selected'
}

export function InteractivityMenu({
  items,
  children,
  activeIndex = null,
  heading,
  align = 'start',
}: InteractivityMenuProps): ReactNode {
  const itemRefs = useRef<Array<HTMLDivElement | null>>([])

  useEffect(() => {
    if (activeIndex == null) return
    itemRefs.current[activeIndex]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'nearest',
      block: 'nearest',
    })
  }, [activeIndex])

  return (
    <Stack gap="xs">
      {heading && (
        <Text as="div" variant="heading-5-bold" opacity="title" align="end">
          {heading}
        </Text>
      )}
      <div style={{ ...rail, justifyContent: align === 'end' ? 'flex-end' : 'flex-start' }}>
        {children != null
          ? Children.map(children, (card) => <div style={{ flexShrink: 0 }}>{card}</div>)
          : (items ?? []).map((item, index) => (
              <div
                key={index}
                ref={(el) => {
                  itemRefs.current[index] = el
                }}
                style={{ flexShrink: 0 }}
              >
                <Button
                  interactionState={stateFor(index, activeIndex)}
                  title={item.title}
                  overline=""
                  subtitle=""
                  live={false}
                  thumbnail={item.thumbnail}
                  onClick={item.onClick}
                />
              </div>
            ))}
      </div>
    </Stack>
  )
}
