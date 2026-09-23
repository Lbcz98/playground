/**
 * Button — Figma UI Kit node 2457:117489.
 *
 * The 10-foot card button: a media thumbnail slot over an overline/title/
 * subtitle stack, with an optional live badge and check mark. Focus draws the
 * kit's one `<FocusRing>`; Default and Selected are translucent cards with the
 * kit's one `<RestingBorder>` that dim their content.
 *
 * Figma positions the content with percentage insets; those resolve to a plain
 * padding box, so this uses flow layout instead.
 */

import type { CSSProperties, ReactNode } from 'react'
import {
  FocusRing,
  resolveInteractionState,
  RestingBorder,
  size,
  spacing,
  Text,
  token,
  type InteractionState,
} from '@/primitives'
import type { TextStyle } from '@/styles/global-tokens'
import checkIcon from './icons/check.svg'
import { LabelVideo } from './LabelVideo'

export type ButtonState = Extract<InteractionState, 'default' | 'focus' | 'selected'>

export interface ButtonProps {
  /** Default `focus`. */
  interactionState?: ButtonState
  /** @deprecated Use `interactionState` — same values. */
  state?: ButtonState
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

const isLarge = (state: ButtonState): boolean => state !== 'default'

function cardRadius(state: ButtonState): string {
  return token(isLarge(state) ? '--dimension-radius-semantic-card-expanded' : '--dimension-radius-semantic-card')
}

function rootFor(state: ButtonState): CSSProperties {
  const large = isLarge(state)
  return {
    position: 'relative',
    width: size(large ? 'card-expanded-width' : 'card-width'),
    height: size(large ? 'card-expanded-height' : 'card-height'),
    padding: token(
      large ? '--dimension-spacing-semantic-card-inset-expanded' : '--dimension-spacing-semantic-card-inset',
    ),
    border: 'none',
    background: 'none',
    borderRadius: cardRadius(state),
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    textAlign: 'start',
  }
}

/** Default / Selected: the translucent fill, with the resting border drawn over it as a sibling. */
function cardFill(state: ButtonState): CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    borderRadius: cardRadius(state),
    backgroundColor: token('--color-semantic-functional-background-translucent'),
  }
}

const layer: CSSProperties = { position: 'relative' }

/** Supporting text blends by luminosity over the card, as in Figma. A flex wrapper keeps the line box exact. */
const luminosity: CSSProperties = { display: 'flex', mixBlendMode: 'luminosity' }

/** One card in a rail (the catalog’s InteractivityCard): a title, and in the schedule section an overline, subtitle and live badge. */
export function Button({
  interactionState,
  state: legacyState,
  title = 'Title',
  overline = 'Overline',
  subtitle = 'Subtitle',
  live = true,
  check = false,
  advertising,
  thumbnail,
  onClick,
}: ButtonProps): ReactNode {
  const state = resolveInteractionState('ui-kit/Button', interactionState, { prop: 'state', value: legacyState }, 'focus')
  const large = isLarge(state)
  const secondary: TextStyle = large ? 'footnote-bold' : 'caption-bold'
  const titleStyle: TextStyle = large ? 'body-md-bold' : 'body-sm-bold'

  return (
    <button type="button" onClick={onClick} style={rootFor(state)}>
      {state === 'focus' ? (
        <FocusRing shape="card-expanded" />
      ) : (
        <>
          <span style={cardFill(state)} />
          <RestingBorder shape={large ? 'card-expanded' : 'card'} width="card" />
        </>
      )}

      <span
        style={{
          ...layer,
          display: 'flex',
          alignItems: 'start',
          justifyContent: 'space-between',
          gap: spacing('2xs'),
        }}
      >
        {live ? (
          <span style={layer}>
            <LabelVideo kind="live" interactionState="focus" mini />
          </span>
        ) : (
          <span />
        )}
        {check && (
          <img
            src={checkIcon}
            alt=""
            style={{ width: size('icon-lg'), height: size('icon-lg'), display: 'block' }}
          />
        )}
      </span>

      {thumbnail && <span style={layer}>{thumbnail}</span>}

      <span
        style={{
          ...layer,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing('3xs'),
          opacity: state === 'focus' ? undefined : token('--opacity-semantic-content-muted'),
        }}
      >
        {overline && (
          <span style={luminosity}>
            <Text variant={secondary} color="muted">
              {overline}
            </Text>
          </span>
        )}
        <Text variant={titleStyle}>{title}</Text>
        {subtitle && (
          <span style={luminosity}>
            <Text variant={secondary} color="muted">
              {subtitle}
            </Text>
          </span>
        )}
        {advertising && (
          <span style={{ display: 'flex', alignItems: 'center', gap: spacing('2xs') }}>
            <span style={luminosity}>
              <Text variant={secondary} color="muted">
                {advertising.label}
              </Text>
            </span>
            {advertising.logoSrc ? (
              <img src={advertising.logoSrc} alt="" style={{ height: size('icon-lg'), display: 'block' }} />
            ) : null}
          </span>
        )}
      </span>
    </button>
  )
}
