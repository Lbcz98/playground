/**
 * RoundButtonShell — the circular button frame shared by every round control in
 * the kit ("ShapesHdMotionless" in Figma: RoundedButton's back button, and the
 * avatar/clock/weather/logo buttons in MainMenu are all the same outer hit
 * target and inner circle with a gradient focus ring, just with different
 * content — see untokenized.ts's ROUNDED constants for the exact sizes).
 *
 * Extracted so that shell only exists once — content and its sizing are the
 * caller's job.
 */

import type { CSSProperties, ReactNode } from 'react'
import { ROUNDED } from './untokenized'

export interface RoundButtonShellProps {
  focus?: boolean
  /** Accessible name — every consumer so far is icon/image-only. */
  label: string
  onClick?: () => void
  children?: ReactNode
}

const root: CSSProperties = {
  position: 'relative',
  width: ROUNDED.outerSize,
  height: ROUNDED.outerSize,
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
  width: ROUNDED.circleSize,
  height: ROUNDED.circleSize,
  borderRadius: 'var(--dimension-radius-core-full)',
  overflow: 'hidden',
  display: 'grid',
  placeItems: 'center',
}

const restCircle: CSSProperties = {
  ...circle,
  backgroundColor: 'var(--color-opacity-background)',
  border: 'var(--dimension-border-width-semantic-button) solid var(--color-opacity-light-20)',
}

const focusCircle: CSSProperties = {
  ...circle,
  // Same focus color as every other control (Button, WideButton) —
  // gradient-inverse-night was this shell's own guess, since RoundedButton's
  // source node exported the gradient as a flattened image with no literal
  // color classes to read; cross-checking against a second Figma file (the
  // Handoff/DTV round button) confirmed every focus ring shares one gradient.
  backgroundImage: 'var(--gradient-primary-night)',
}

const focusInset: CSSProperties = {
  position: 'absolute',
  inset: 'var(--dimension-border-width-semantic-focus-ring)',
  borderRadius: 'var(--dimension-radius-core-full)',
  overflow: 'hidden',
  backgroundColor: 'var(--color-opacity-dark-70)',
  backgroundImage: 'linear-gradient(180deg, var(--color-core-neutral-charcoal) 0%, transparent 100%)',
}

const focusGlow: CSSProperties = {
  position: 'absolute',
  insetInline: 0,
  top: 0,
  height: '50%',
  opacity: 'var(--opacity-semantic-illumination-strong)',
  backgroundImage:
    'radial-gradient(ellipse at 50% 0%, var(--color-core-primary-night-light) 0%, transparent 70%)',
}

export function RoundButtonShell({
  focus = false,
  label,
  onClick,
  children,
}: RoundButtonShellProps): ReactNode {
  return (
    <button type="button" aria-label={label} onClick={onClick} style={root}>
      <span style={focus ? focusCircle : restCircle}>
        {focus && (
          <span style={focusInset}>
            <span style={focusGlow} />
          </span>
        )}
        <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
          {children}
        </span>
      </span>
    </button>
  )
}
