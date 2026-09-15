/**
 * RoundButtonShell — the circular button frame shared by every round control in
 * the kit ("ShapesHdMotionless" in Figma: RoundedButton's back button, and the
 * avatar/clock/weather/logo buttons in MainMenu are all the same outer hit
 * target and inner circle with a gradient focus ring, just with different
 * content — see the `round-button` size tokens for the exact sizes).
 *
 * Focus draws the kit's one `<FocusRing>` inside the circle.
 *
 * Extracted so that shell only exists once — content and its sizing are the
 * caller's job.
 */

import type { CSSProperties, ReactNode } from 'react'
import { FocusRing, size, token } from '@/primitives'

export interface RoundButtonShellProps {
  focus?: boolean
  /** Accessible name — every consumer so far is icon/image-only. */
  label: string
  onClick?: () => void
  children?: ReactNode
}

const root: CSSProperties = {
  position: 'relative',
  width: size('round-button'),
  height: size('round-button'),
  padding: 0,
  border: 'none',
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
  border: `${token('--dimension-border-width-semantic-button')} solid ${token('--color-semantic-functional-border-default')}`,
}

export function RoundButtonShell({
  focus = false,
  label,
  onClick,
  children,
}: RoundButtonShellProps): ReactNode {
  return (
    <button type="button" aria-label={label} onClick={onClick} style={root}>
      <span style={focus ? circle : restCircle}>
        {focus && <FocusRing shape="pill" />}
        <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
          {children}
        </span>
      </span>
    </button>
  )
}
