/**
 * Wide Button — Figma UI Kit node 3386:10618 ("Insert Button").
 *
 * Every colour, radius, gap, size and text style resolves to a semantic token
 * or a grid spacing step from `src/styles/global.css`.
 */

import type { CSSProperties, ReactNode } from 'react'
import { size, spacing, Text, token } from '@/primitives'
import arrowLeftIcon from './icons/arrow-left.svg'
import arrowRightIcon from './icons/arrow-right.svg'
import spinnerIcon from './icons/spinner.svg'

export type WideButtonStatus = 'default' | 'focus' | 'loading' | 'disabled'

export interface WideButtonProps {
  status?: WideButtonStatus
  label?: string
  iconLeft?: boolean
  iconRight?: boolean
  onClick?: () => void
}

const PILL = token('--dimension-radius-semantic-pill')

const root: CSSProperties = {
  position: 'relative',
  width: size('wide-button-width'),
  height: size('control-height'),
  padding: 0,
  border: 'none',
  background: 'none',
  borderRadius: PILL,
  overflow: 'hidden',
  cursor: 'pointer',
}

/** The gradient frame: a night-gradient fill with a dark inset sitting on top. */
const focusFrame: CSSProperties = {
  position: 'absolute',
  inset: 0,
  borderRadius: PILL,
  backgroundImage: token('--gradient-semantic-focus-ring'),
}

const focusInset: CSSProperties = {
  position: 'absolute',
  inset: token('--dimension-border-width-semantic-focus-ring'),
  borderRadius: PILL,
  overflow: 'hidden',
  backgroundColor: token('--color-semantic-focus-inset'),
  backgroundImage: `linear-gradient(0deg, ${token('--color-semantic-focus-inset-fade')} 0%, transparent 100%)`,
}

const focusGlow: CSSProperties = {
  position: 'absolute',
  insetInline: 0,
  bottom: 0,
  height: spacing('xl'),
  opacity: token('--opacity-semantic-overlay'),
  backgroundImage: `radial-gradient(ellipse at 50% 100%, ${token('--color-semantic-focus-glow')} 0%, transparent 70%)`,
}

const center: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing('2xs'),
  borderRadius: PILL,
}

const icon: CSSProperties = {
  width: size('icon-sm'),
  height: size('icon-sm'),
  flexShrink: 0,
  display: 'block',
}

/**
 * Default / Loading: a Diagonal Light gradient stroke, same reasoning as
 * Button's card — confirmed as a bound style on this component, and a plain
 * CSS border can't carry a gradient on a rounded shape.
 *
 * Rendered as a sibling AFTER the content span, not nested inside it:
 * the translucent background is itself only ~30% opaque, so insetting it
 * on top of a full gradient frame let the gradient bleed through the whole
 * interior instead of staying confined to the edge (a real bug an earlier
 * version had — see git history). This uses a masked "hole"
 * (`mask-composite: exclude`) so the ring has NO pixels in its center at
 * all — the content span's flat fill sits fully behind it at inset 0,
 * compositing against the real page background, never against the gradient.
 */
const diagonalRing: CSSProperties = {
  position: 'absolute',
  inset: 0,
  padding: token('--dimension-border-width-semantic-button'),
  borderRadius: PILL,
  backgroundImage: token('--gradient-semantic-border-default'),
  WebkitMask: 'linear-gradient(black 0 0) content-box, linear-gradient(black 0 0)',
  WebkitMaskComposite: 'xor',
  mask: 'linear-gradient(black 0 0) content-box, linear-gradient(black 0 0)',
  maskComposite: 'exclude',
} as CSSProperties

function hasDiagonalStroke(status: WideButtonStatus): boolean {
  return status === 'default' || status === 'loading'
}

function centerFor(status: WideButtonStatus): CSSProperties {
  if (status === 'focus') return center
  return { ...center, backgroundColor: token('--color-semantic-functional-background-translucent') }
}

export function WideButton({
  status = 'focus',
  label = 'Label',
  iconLeft = false,
  iconRight = false,
  onClick,
}: WideButtonProps): ReactNode {
  const isLoading = status === 'loading'
  const isDisabled = status === 'disabled'

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      style={{ ...root, cursor: isDisabled ? 'not-allowed' : 'pointer' }}
    >
      {status === 'focus' && (
        <span style={focusFrame}>
          <span style={focusInset}>
            <span style={focusGlow} />
          </span>
        </span>
      )}
      <span style={centerFor(status)}>
        {isLoading ? (
          <img
            src={spinnerIcon}
            alt=""
            style={{ width: size('icon-md'), height: size('icon-md'), display: 'block' }}
          />
        ) : (
          <>
            {iconLeft && <img src={arrowLeftIcon} alt="" style={icon} />}
            <Text variant="body-sm-bold" opacity={isDisabled ? 'content-muted' : undefined} truncate>
              {label}
            </Text>
            {iconRight && <img src={arrowRightIcon} alt="" style={icon} />}
          </>
        )}
      </span>
      {hasDiagonalStroke(status) && <span style={diagonalRing} />}
    </button>
  )
}
