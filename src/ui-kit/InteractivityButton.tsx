/**
 * Interactivity Button — Figma UI Kit node 2457:117489.
 *
 * The 10-foot card button: a media thumbnail slot over an overline/title/
 * subtitle stack, with an optional live badge and check mark. Focus draws the
 * kit's one `<FocusRing>`; Default and Selected are translucent cards with the
 * kit's one `<RestingBorder>` that dim their content.
 *
 * Figma positions the content with percentage insets; those resolve to a plain
 * padding box, so this uses flow layout instead.
 */

import type { ReactNode } from 'react'
import { FocusRing, RestingBorder, Text, token, vars, type InteractionState } from '@/primitives'
import type { TextStyle } from '@/styles/global-tokens'
import checkIcon from './icons/check.svg'
import { LabelVideo } from './LabelVideo'
import './ui-kit.css'

export type InteractivityButtonState = Extract<InteractionState, 'default' | 'focus' | 'selected'>

export interface InteractivityButtonProps {
  /** Default `focus`. */
  interactionState?: InteractivityButtonState
  /** The card’s title — as an interactivity, the only text it carries. */
  title?: string
  /** Small line above the title (schedule section only). */
  overline?: string
  /** Small line under the title (schedule section only). */
  subtitle?: string
  /** Renders the "AO VIVO" badge. */
  live?: boolean
  /** Renders the check mark in the thumbnail's top-right. */
  check?: boolean
  /** Renders the sponsor row — its wording ("Publicidade") and, when given, the partner's logo. */
  advertising?: { label: string; logoSrc?: string }
  /** Fills the thumbnail slot. */
  thumbnail?: ReactNode
  onClick?: () => void
}

const isLarge = (state: InteractivityButtonState): boolean => state !== 'default'

/** One card in a rail (the catalog’s InteractivityButton): a title, and in the schedule section an overline, subtitle and live badge. */
export function InteractivityButton({
  interactionState,
  title,
  overline,
  subtitle,
  live = false,
  check = false,
  advertising,
  thumbnail,
  onClick,
}: InteractivityButtonProps): ReactNode {
  const state = interactionState ?? 'focus'
  const large = isLarge(state)
  const secondary: TextStyle = large ? 'footnote-bold' : 'caption-bold'
  const titleStyle: TextStyle = large ? 'body-md-bold' : 'body-sm-bold'

  return (
    <button
      type="button"
      className="sfs-interactivity-button sfs-motion sfs-focusable"
      data-state={state}
      onClick={onClick}
      style={vars({
        '--_inset': token(
          large ? '--dimension-spacing-semantic-card-inset-expanded' : '--dimension-spacing-semantic-card-inset',
        ),
      })}
    >
      {state === 'focus' ? (
        <FocusRing shape="card-expanded" />
      ) : (
        <>
          <span className="sfs-interactivity-button-fill" />
          <RestingBorder shape={large ? 'card-expanded' : 'card'} width="card" />
        </>
      )}

      <span className="sfs-interactivity-button-header">
        {live ? (
          <span className="sfs-interactivity-button-live">
            <LabelVideo kind="live" interactionState="focus" mini />
          </span>
        ) : (
          <span />
        )}
        {check && <img src={checkIcon} alt="" className="sfs-interactivity-button-check" />}
      </span>

      {thumbnail && <span className="sfs-interactivity-button-thumbnail">{thumbnail}</span>}

      <span className="sfs-interactivity-button-body">
        {overline && (
          <span className="sfs-interactivity-button-supporting">
            <Text variant={secondary} color="muted">
              {overline}
            </Text>
          </span>
        )}
        <Text variant={titleStyle}>{title}</Text>
        {subtitle && (
          <span className="sfs-interactivity-button-supporting">
            <Text variant={secondary} color="muted">
              {subtitle}
            </Text>
          </span>
        )}
        {advertising && (
          <span className="sfs-interactivity-button-advertising">
            <span className="sfs-interactivity-button-supporting">
              <Text variant={secondary} color="muted">
                {advertising.label}
              </Text>
            </span>
            {advertising.logoSrc ? (
              <img src={advertising.logoSrc} alt="" className="sfs-interactivity-button-logo" />
            ) : null}
          </span>
        )}
      </span>
    </button>
  )
}
