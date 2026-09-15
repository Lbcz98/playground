/**
 * Rounded Button — Figma UI Kit node 2273:96230 ("Back Button").
 *
 * A specific use of `RoundButtonShell` (the back arrow); see that file for the
 * shell itself, which MainMenu's avatar/clock/weather/logo buttons also use.
 */

import type { ReactNode } from 'react'
import backFocusIcon from './icons/back-focus.svg'
import backRestIcon from './icons/back-rest.svg'
import { RoundButtonShell } from './RoundButtonShell'
import { ROUNDED } from './untokenized'

export interface RoundedButtonProps {
  focus?: boolean
  /** Accessible name — the control is icon-only. */
  label?: string
  onClick?: () => void
}

export function RoundedButton({
  focus = true,
  label = 'Back',
  onClick,
}: RoundedButtonProps): ReactNode {
  const iconSize = focus ? 'var(--dimension-spacing-core-xl)' : ROUNDED.iconRestSize

  return (
    <RoundButtonShell focus={focus} label={label} onClick={onClick}>
      <img
        src={focus ? backFocusIcon : backRestIcon}
        alt=""
        style={{ width: iconSize, height: iconSize, display: 'block' }}
      />
    </RoundButtonShell>
  )
}
