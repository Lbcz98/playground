/**
 * RoundButtonShell — the circular button frame shared by every round control in
 * the kit ("ShapesHdMotionless" in Figma: RoundedButton's back button, and the
 * login/schedule/miscellaneous/program buttons in MainMenu are all the same outer hit
 * target and inner circle, just with different content — see the
 * `round-button` size tokens for the exact sizes).
 *
 * At rest the circle draws the kit's one `<RestingBorder>`; focused, its one
 * `<FocusRing>`. Both sit inside the circle, so it is the same size in either state.
 *
 * Extracted so that shell only exists once — content and its sizing are the
 * caller's job.
 */

import type { CSSProperties, ReactNode } from 'react'
import {
  FocusRing,
  RestingBorder,
  size,
  token,
  type InteractionState,
} from '@/primitives'

export type RoundButtonState = Extract<InteractionState, 'default' | 'focus'>

export interface RoundButtonShellProps {
  /** Default `default`. */
  interactionState?: RoundButtonState
  /** Accessible name — every consumer so far is icon/image-only. */
  label: string
  onClick?: () => void
  /** Names the button for the canvas' remote-style navigation (a menu's item id). */
  focusItem?: string
  children?: ReactNode
}

const root: CSSProperties = {
  position: 'relative',
  width: size('round-button'),
  height: size('round-button'),
  padding: 0,
  border: 'none',
  // So the keyboard-focus outline follows the circle.
  borderRadius: token('--dimension-radius-semantic-pill'),
  background: 'none',
  cursor: 'pointer',
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
}

const circle: CSSProperties = {
  position: 'relative',
  width: size('round-button-circle'),
  height: size('round-button-circle'),
  borderRadius: token('--dimension-radius-semantic-pill'),
  overflow: 'hidden',
  display: 'grid',
  placeItems: 'center',
}

const restCircle: CSSProperties = {
  ...circle,
  backgroundColor: token('--color-semantic-functional-background-translucent'),
}

export function RoundButtonShell({
  interactionState,
  label,
  onClick,
  focusItem,
  children,
}: RoundButtonShellProps): ReactNode {
  const focus =
    (interactionState ?? 'default') === 'focus'

  return (
    <button type="button" className="sfs-motion sfs-focusable" aria-label={label} data-focus-item={focusItem} onClick={onClick} style={root}>
      <span style={focus ? circle : restCircle}>
        {focus ? <FocusRing shape="pill" /> : <RestingBorder shape="pill" />}
        <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
          {children}
        </span>
      </span>
    </button>
  )
}
