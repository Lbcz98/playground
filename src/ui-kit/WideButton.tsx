/**
 * Wide Button — Figma UI Kit node 3386:10618 ("Insert Button").
 *
 * Every colour, radius, gap, size and text style resolves to a semantic token
 * or a grid spacing step from `src/styles/global.css`. Focus draws the kit's
 * one `<FocusRing>` (this button's recipe is the one it standardised on), rest
 * and loading its one `<RestingBorder>`, and loading its one `<Spinner>`.
 */

import type { CSSProperties, ReactNode } from 'react'
import {
  FocusRing,
  resolveInteractionState,
  RestingBorder,
  size,
  spacing,
  Spinner,
  Text,
  token,
  type InteractionState,
} from '@/primitives'
import arrowLeftIcon from './icons/arrow-left.svg'
import arrowRightIcon from './icons/arrow-right.svg'

export type WideButtonStatus = Extract<InteractionState, 'default' | 'focus' | 'loading' | 'disabled'>

export interface WideButtonProps {
  /** Default `focus`. */
  interactionState?: WideButtonStatus
  /** @deprecated Use `interactionState` — same values. */
  status?: WideButtonStatus
  /** The call to action, e.g. "Assistir". */
  label?: string
  /** Shows the icon before the label. */
  iconLeft?: boolean
  /** Shows the icon after the label. */
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

function hasRestingBorder(state: WideButtonStatus): boolean {
  return state === 'default' || state === 'loading'
}

function centerFor(state: WideButtonStatus): CSSProperties {
  if (state === 'focus') return center
  return { ...center, backgroundColor: token('--color-semantic-functional-background-translucent') }
}

/** The pill call-to-action of a screen — text with optional icons. */
export function WideButton({
  interactionState,
  status,
  label,
  iconLeft = false,
  iconRight = false,
  onClick,
}: WideButtonProps): ReactNode {
  const state = resolveInteractionState('ui-kit/WideButton', interactionState, { prop: 'status', value: status }, 'focus')
  const isLoading = state === 'loading'
  const isDisabled = state === 'disabled'

  return (
    <button
      className="sfs-motion"
      type="button"
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      onClick={isLoading ? undefined : onClick}
      style={{ ...root, cursor: isDisabled ? 'not-allowed' : isLoading ? 'progress' : 'pointer' }}
    >
      {state === 'focus' && <FocusRing shape="pill" />}
      <span style={centerFor(state)}>
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
      {hasRestingBorder(state) && <RestingBorder shape="pill" />}
    </button>
  )
}
