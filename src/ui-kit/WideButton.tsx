/**
 * Wide Button — Figma UI Kit node 3386:10618 ("Insert Button").
 *
 * Every colour, radius, gap, size and text style resolves to a semantic token
 * or a grid spacing step from `src/styles/global.css`. Focus draws the kit's
 * one `<FocusRing>` (this button's recipe is the one it standardised on), rest
 * and loading its one `<RestingBorder>`, and loading its one `<Spinner>`.
 */

import type { CSSProperties, ReactNode } from 'react'
import { FocusRing, RestingBorder, size, spacing, Spinner, Text, token } from '@/primitives'
import arrowLeftIcon from './icons/arrow-left.svg'
import arrowRightIcon from './icons/arrow-right.svg'

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

function hasRestingBorder(status: WideButtonStatus): boolean {
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
      aria-busy={isLoading || undefined}
      onClick={isLoading ? undefined : onClick}
      style={{ ...root, cursor: isDisabled ? 'not-allowed' : isLoading ? 'progress' : 'pointer' }}
    >
      {status === 'focus' && <FocusRing shape="pill" />}
      <span style={centerFor(status)}>
        {isLoading ? (
          <Spinner size="icon-md" />
        ) : (
          <>
            {iconLeft && <img src={arrowLeftIcon} alt="" style={icon} />}
            <Text variant="body-sm-bold" opacity={isDisabled ? 'state-disabled' : undefined} truncate>
              {label}
            </Text>
            {iconRight && <img src={arrowRightIcon} alt="" style={icon} />}
          </>
        )}
      </span>
      {hasRestingBorder(status) && <RestingBorder shape="pill" />}
    </button>
  )
}
