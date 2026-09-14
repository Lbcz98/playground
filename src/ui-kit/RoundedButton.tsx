/**
 * Rounded Button — Figma UI Kit node 2273:96230 ("Back Button").
 *
 * The focus ring is the Inverse/Noite gradient with a dark inset on top, which
 * is how the kit draws every gradient-bordered surface.
 */

import type { CSSProperties, ReactNode } from 'react'
import backFocusIcon from './icons/back-focus.svg'
import backRestIcon from './icons/back-rest.svg'
import { ROUNDED } from './untokenized'

export interface RoundedButtonProps {
  focus?: boolean
  /** Accessible name — the control is icon-only. */
  label?: string
  onClick?: () => void
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
  backgroundImage: 'var(--gradient-inverse-night)',
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

export function RoundedButton({
  focus = true,
  label = 'Back',
  onClick,
}: RoundedButtonProps): ReactNode {
  const iconSize = focus ? 'var(--dimension-spacing-core-xl)' : ROUNDED.iconRestSize

  return (
    <button type="button" aria-label={label} onClick={onClick} style={root}>
      <span style={focus ? focusCircle : restCircle}>
        {focus && (
          <span style={focusInset}>
            <span style={focusGlow} />
          </span>
        )}
        <img
          src={focus ? backFocusIcon : backRestIcon}
          alt=""
          style={{
            position: 'relative',
            width: iconSize,
            height: iconSize,
            display: 'block',
          }}
        />
      </span>
    </button>
  )
}
