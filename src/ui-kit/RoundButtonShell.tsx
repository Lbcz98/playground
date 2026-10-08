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

import type { ReactNode } from 'react'
import { FocusRing, RestingBorder, type InteractionState } from '@/primitives'
import './ui-kit.css'

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

export function RoundButtonShell({
  interactionState,
  label,
  onClick,
  focusItem,
  children,
}: RoundButtonShellProps): ReactNode {
  const state = interactionState ?? 'default'
  const focus = state === 'focus'

  return (
    <button
      type="button"
      className="sfs-round-button sfs-motion sfs-focusable"
      data-state={state}
      aria-label={label}
      data-focus-item={focusItem}
      onClick={onClick}
    >
      <span className="sfs-round-button-circle">
        {focus ? <FocusRing shape="pill" /> : <RestingBorder shape="pill" />}
        <span className="sfs-round-button-content">{children}</span>
      </span>
    </button>
  )
}
