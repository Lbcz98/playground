/**
 * Rounded Button — Figma UI Kit node 2273:96230 ("Back Button").
 *
 * A specific use of `RoundButtonShell` (the back arrow); see that file for the
 * shell itself, which MainMenu's login/schedule/miscellaneous/program buttons also use.
 */

import type { ReactNode } from 'react'
import backFocusIcon from './icons/back-focus.svg'
import backRestIcon from './icons/back-rest.svg'
import { RoundButtonShell, type RoundButtonState } from './RoundButtonShell'
import './ui-kit.css'

export interface RoundedButtonProps {
  /** Default `focus`. */
  interactionState?: RoundButtonState
  /** Accessible name — the control is icon-only. */
  label?: string
  onClick?: () => void
}

/** The icon-only round control that steps back a level. */
export function RoundedButton({
  interactionState,
  label = 'Voltar',
  onClick,
}: RoundedButtonProps): ReactNode {
  const state = interactionState ?? 'focus'

  return (
    <RoundButtonShell interactionState={state} label={label} onClick={onClick}>
      <img src={state === 'focus' ? backFocusIcon : backRestIcon} alt="" className="sfs-round-button-icon" />
    </RoundButtonShell>
  )
}
