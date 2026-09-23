/**
 * Rounded Button — Figma UI Kit node 2273:96230 ("Back Button").
 *
 * A specific use of `RoundButtonShell` (the back arrow); see that file for the
 * shell itself, which MainMenu's avatar/clock/weather/logo buttons also use.
 */

import type { ReactNode } from 'react'
import { fromFocusFlag, resolveInteractionState, size } from '@/primitives'
import backFocusIcon from './icons/back-focus.svg'
import backRestIcon from './icons/back-rest.svg'
import { RoundButtonShell, type RoundButtonState } from './RoundButtonShell'

export interface RoundedButtonProps {
  /** Default `focus`. */
  interactionState?: RoundButtonState
  /** @deprecated Use `interactionState` (`focus` or `default`). */
  focus?: boolean
  /** Accessible name — the control is icon-only. */
  label?: string
  onClick?: () => void
}

/** The icon-only round control that steps back a level. */
export function RoundedButton({
  interactionState,
  focus: legacyFocus,
  label = 'Back',
  onClick,
}: RoundedButtonProps): ReactNode {
  const state = resolveInteractionState(
    'ui-kit/RoundedButton',
    interactionState,
    { prop: 'focus', value: fromFocusFlag(legacyFocus) },
    'focus',
  )
  const focus = state === 'focus'
  const iconSize = size(focus ? 'icon-xl' : 'icon-round-rest')

  return (
    <RoundButtonShell interactionState={state} label={label} onClick={onClick}>
      <img
        src={focus ? backFocusIcon : backRestIcon}
        alt=""
        style={{ width: iconSize, height: iconSize, display: 'block' }}
      />
    </RoundButtonShell>
  )
}
