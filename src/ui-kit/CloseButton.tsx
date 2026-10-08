/**
 * Close Button — Figma UI Kit node 3359:8601.
 *
 * The control that closes an interactivity, anchored in the corner the focus is
 * on. It is the same `RoundButtonShell` as the back arrow — the `round-button`
 * target around the `round-button-circle`, the kit's one `<FocusRing>` — and
 * differs only in the mark it carries, which is the whole point of the pair:
 * closing and stepping back are different intents, so a nível 3 screen says
 * which one it means.
 *
 * `<RoundedButton>` is the back arrow and stays that; reach for this one to
 * dismiss, not to navigate.
 */

import type { ReactNode } from 'react'
import closeFocusIcon from './icons/close-focus.svg'
import closeRestIcon from './icons/close-rest.svg'
import { RoundButtonShell, type RoundButtonState } from './RoundButtonShell'
import './ui-kit.css'

export interface CloseButtonProps {
  /** Default `focus`. */
  interactionState?: RoundButtonState
  /** Accessible name — the control is icon-only. */
  label?: string
  onClick?: () => void
}

/** The icon-only round control that closes an interactivity. */
export function CloseButton({
  interactionState,
  label = 'Fechar',
  onClick,
}: CloseButtonProps): ReactNode {
  const state = interactionState ?? 'focus'

  return (
    <RoundButtonShell interactionState={state} label={label} onClick={onClick}>
      <img src={state === 'focus' ? closeFocusIcon : closeRestIcon} alt="" className="sfs-round-button-icon" />
    </RoundButtonShell>
  )
}
