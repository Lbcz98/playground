/**
 * Wide Button — Figma UI Kit node 3386:10618 ("Insert Button").
 *
 * Every colour, radius, gap and text style resolves to a `--*` custom property
 * from `src/styles/global.css`. The handful of values the token set has no
 * entry for live in `./untokenized`.
 */

import type { CSSProperties, ReactNode } from 'react'
import arrowLeftIcon from './icons/arrow-left.svg'
import arrowRightIcon from './icons/arrow-right.svg'
import spinnerIcon from './icons/spinner.svg'
import { WIDE } from './untokenized'

export type WideButtonStatus = 'default' | 'focus' | 'loading' | 'disabled'

export interface WideButtonProps {
  status?: WideButtonStatus
  label?: string
  iconLeft?: boolean
  iconRight?: boolean
  onClick?: () => void
}

const root: CSSProperties = {
  position: 'relative',
  width: WIDE.width,
  height: 'var(--dimension-spacing-core-2xl)',
  padding: 0,
  border: 'none',
  background: 'none',
  borderRadius: 'var(--dimension-radius-core-2xl)',
  overflow: 'hidden',
  cursor: 'pointer',
}

/** The gradient frame: a night-gradient fill with a dark inset sitting on top. */
const focusFrame: CSSProperties = {
  position: 'absolute',
  inset: 0,
  borderRadius: 'var(--dimension-radius-core-full)',
  backgroundImage: 'var(--gradient-primary-night)',
}

const focusInset: CSSProperties = {
  position: 'absolute',
  inset: 'var(--dimension-border-width-semantic-focus-ring)',
  borderRadius: 'var(--dimension-radius-core-4xl)',
  overflow: 'hidden',
  backgroundColor: 'var(--color-opacity-dark-70)',
  backgroundImage: 'linear-gradient(0deg, var(--color-core-neutral-charcoal) 0%, transparent 100%)',
}

const focusGlow: CSSProperties = {
  position: 'absolute',
  insetInline: 0,
  bottom: 0,
  height: 'var(--dimension-spacing-core-xl)',
  opacity: 'var(--opacity-semantic-overlay)',
  backgroundImage:
    'radial-gradient(ellipse at 50% 100%, var(--color-core-primary-night-light) 0%, transparent 70%)',
}

const center: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--dimension-spacing-core-2xs)',
  borderRadius: 'var(--dimension-radius-core-4xl)',
}

const icon: CSSProperties = {
  width: 'var(--dimension-spacing-core-sm)',
  height: 'var(--dimension-spacing-core-sm)',
  flexShrink: 0,
  display: 'block',
}

function centerFor(status: WideButtonStatus): CSSProperties {
  if (status === 'focus') return center
  const surface: CSSProperties = {
    ...center,
    backgroundColor: 'var(--color-opacity-background)',
  }
  if (status === 'disabled') return surface
  return {
    ...surface,
    border:
      'var(--dimension-border-width-semantic-button) solid var(--color-opacity-light-70)',
  }
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
            style={{
              width: 'var(--dimension-spacing-core-md)',
              height: 'var(--dimension-spacing-core-md)',
              display: 'block',
            }}
          />
        ) : (
          <>
            {iconLeft && <img src={arrowLeftIcon} alt="" style={icon} />}
            <span
              className="text-body-sm-bold"
              style={{
                color: 'var(--color-core-neutral-white)',
                whiteSpace: 'nowrap',
                opacity: isDisabled ? 'var(--opacity-semantic-content-muted)' : undefined,
              }}
            >
              {label}
            </span>
            {iconRight && <img src={arrowRightIcon} alt="" style={icon} />}
          </>
        )}
      </span>
    </button>
  )
}
