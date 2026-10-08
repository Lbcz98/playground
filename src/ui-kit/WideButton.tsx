/**
 * Wide Button — Figma UI Kit node 3386:10618 ("Insert Button").
 *
 * Every colour, radius, gap, size and text style resolves to a semantic token
 * or a grid spacing step from `src/styles/global.css`. Focus draws the kit's
 * one `<FocusRing>` (this button's recipe is the one it standardised on), rest
 * and loading its one `<RestingBorder>`, and loading its one `<Spinner>`.
 */

import type { ReactNode } from 'react'
import { FocusRing, RestingBorder, Spinner, Text, type InteractionState } from '@/primitives'
import arrowLeftIcon from './icons/arrow-left.svg'
import arrowRightIcon from './icons/arrow-right.svg'
import './ui-kit.css'

export type WideButtonStatus = Extract<InteractionState, 'default' | 'focus' | 'loading' | 'disabled'>

export interface WideButtonProps {
  /** Default `focus`. */
  interactionState?: WideButtonStatus
  /** The call to action, e.g. "Assistir". */
  label?: string
  /** Shows the icon before the label. */
  iconLeft?: boolean
  /** Shows the icon after the label. */
  iconRight?: boolean
  onClick?: () => void
}

function hasRestingBorder(state: WideButtonStatus): boolean {
  return state === 'default' || state === 'loading'
}

/** The pill call-to-action of a screen — text with optional icons. */
export function WideButton({
  interactionState,
  label,
  iconLeft = false,
  iconRight = false,
  onClick,
}: WideButtonProps): ReactNode {
  const state = interactionState ?? 'focus'
  const isLoading = state === 'loading'
  const isDisabled = state === 'disabled'

  return (
    <button
      className="sfs-wide-button sfs-motion sfs-focusable"
      data-state={state}
      type="button"
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      onClick={isLoading ? undefined : onClick}
    >
      {state === 'focus' && <FocusRing shape="pill" />}
      <span className="sfs-wide-button-content">
        {isLoading ? (
          <Spinner size="icon-md" />
        ) : (
          <>
            {iconLeft && <img src={arrowLeftIcon} alt="" className="sfs-wide-button-icon" />}
            <Text variant="body-sm-bold" opacity={isDisabled ? 'state-disabled' : undefined} truncate>
              {label}
            </Text>
            {iconRight && <img src={arrowRightIcon} alt="" className="sfs-wide-button-icon" />}
          </>
        )}
      </span>
      {hasRestingBorder(state) && <RestingBorder shape="pill" />}
    </button>
  )
}
