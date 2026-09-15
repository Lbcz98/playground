/**
 * Button — Figma UI Kit node 2457:117489.
 *
 * The 10-foot card button: a media thumbnail slot over an overline/title/
 * subtitle stack, with an optional live badge and check mark. Focus draws the
 * Primary/Noite gradient frame; Default and Selected are translucent cards that
 * dim their content.
 *
 * Figma positions the content with percentage insets; those resolve to a plain
 * padding box, so this uses flow layout instead.
 */

import type { CSSProperties, ReactNode } from 'react'
import checkIcon from './icons/check.svg'
import { LabelVideo } from './LabelVideo'
import { CARD } from './untokenized'

export type ButtonState = 'default' | 'focus' | 'selected'

export interface ButtonProps {
  state?: ButtonState
  title?: string
  overline?: string
  subtitle?: string
  /** Renders the "AO VIVO" badge. */
  live?: boolean
  /** Renders the check mark in the thumbnail's top-right. */
  check?: boolean
  /** Renders the "Publicidade" row with a partner logo. */
  advertising?: { label: string; logoSrc: string }
  /** Fills the thumbnail slot. */
  thumbnail?: ReactNode
  onClick?: () => void
}

const isLarge = (state: ButtonState): boolean => state !== 'default'

function rootFor(state: ButtonState): CSSProperties {
  const large = isLarge(state)
  return {
    position: 'relative',
    width: large ? CARD.focusWidth : CARD.defaultWidth,
    height: large ? CARD.focusHeight : CARD.defaultHeight,
    padding: large
      ? 'var(--dimension-spacing-core-lg)'
      : 'var(--dimension-spacing-core-md)',
    border: 'none',
    background: 'none',
    borderRadius: large
      ? 'var(--dimension-radius-core-6xl)'
      : 'var(--dimension-radius-core-3xl)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    textAlign: 'start',
  }
}

/** Focus: the Primary/Noite gradient frame. */
const gradientFrame: CSSProperties = {
  position: 'absolute',
  inset: 0,
  borderRadius: 'var(--dimension-radius-core-6xl)',
  backgroundImage: 'var(--gradient-primary-night)',
}

const gradientInset: CSSProperties = {
  position: 'absolute',
  inset: 'var(--dimension-spacing-core-3xs)',
  borderRadius: 'var(--dimension-radius-core-5xl)',
  overflow: 'hidden',
  backgroundColor: 'var(--color-core-neutral-charcoal)',
  opacity: 'var(--opacity-semantic-overlay)',
}

const gradientGlow: CSSProperties = {
  position: 'absolute',
  insetInline: 0,
  bottom: 0,
  height: '65%',
  opacity: 'var(--opacity-semantic-illumination-strong)',
  filter: 'blur(var(--dimension-spacing-core-3xs))',
  backgroundImage:
    'radial-gradient(ellipse at 50% 100%, var(--color-core-primary-night-light) 0%, transparent 70%)',
}

const scrim: CSSProperties = {
  position: 'absolute',
  inset: 0,
  borderRadius: 'var(--dimension-radius-core-6xl)',
  backgroundColor: 'var(--color-opacity-background)',
}

/**
 * Default / Selected: a translucent card with a Diagonal Light gradient
 * stroke — confirmed as a bound style on this exact card in the original
 * Figma fetch, not the flat `--color-opacity-light-70` this used to render as
 * (Figma's own codegen flattens gradient borders to one of their stops; a
 * plain CSS `border` can't carry a gradient on a rounded shape either way).
 *
 * The fill and the ring are two SIBLING layers, not nested: `--color-opacity-
 * background` is itself only ~30% opaque, so an earlier version that
 * stacked it on top of the gradient as an inset let the gradient bleed
 * through the whole interior instead of staying confined to the edge. The
 * ring below uses a masked "hole" (`mask-composite: exclude`) so it has NO
 * pixels at all in its center — the fill sits fully behind it, at inset 0,
 * compositing against the real page background exactly like it does
 * everywhere else, never against the gradient.
 */
function cardRadius(state: ButtonState): string {
  return isLarge(state) ? 'var(--dimension-radius-core-6xl)' : 'var(--dimension-radius-core-3xl)'
}

function cardFill(state: ButtonState): CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    borderRadius: cardRadius(state),
    backgroundColor: 'var(--color-opacity-background)',
  }
}

function cardRing(state: ButtonState): CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    padding: 'var(--dimension-border-width-semantic-card)',
    borderRadius: cardRadius(state),
    backgroundImage: 'var(--gradient-complementary-diagonal-light)',
    WebkitMask: 'linear-gradient(black 0 0) content-box, linear-gradient(black 0 0)',
    WebkitMaskComposite: 'xor',
    mask: 'linear-gradient(black 0 0) content-box, linear-gradient(black 0 0)',
    maskComposite: 'exclude',
  } as CSSProperties
}

const layer: CSSProperties = { position: 'relative' }

export function Button({
  state = 'focus',
  title = 'Title',
  overline = 'Overline',
  subtitle = 'Subtitle',
  live = true,
  check = false,
  advertising,
  thumbnail,
  onClick,
}: ButtonProps): ReactNode {
  const large = isLarge(state)
  const secondary = large ? 'text-footnote-bold' : 'text-caption-bold'
  const titleClass = large ? 'text-body-md-bold' : 'text-body-sm-bold'

  return (
    <button type="button" onClick={onClick} style={rootFor(state)}>
      {state === 'focus' ? (
        <span style={gradientFrame}>
          <span style={gradientInset} />
          <span style={gradientGlow} />
          <span style={scrim} />
        </span>
      ) : (
        <>
          <span style={cardFill(state)} />
          <span style={cardRing(state)} />
        </>
      )}

      <span
        style={{
          ...layer,
          display: 'flex',
          alignItems: 'start',
          justifyContent: 'space-between',
          gap: 'var(--dimension-spacing-core-2xs)',
        }}
      >
        {live ? (
          <span style={layer}>
            <LabelVideo kind="live" focus mini />
          </span>
        ) : (
          <span />
        )}
        {check && (
          <img
            src={checkIcon}
            alt=""
            style={{
              width: 'var(--dimension-spacing-core-lg)',
              height: 'var(--dimension-spacing-core-lg)',
              display: 'block',
            }}
          />
        )}
      </span>

      {thumbnail && <span style={layer}>{thumbnail}</span>}

      <span
        style={{
          ...layer,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--dimension-spacing-core-3xs)',
          opacity: state === 'focus' ? undefined : 'var(--opacity-semantic-content-muted)',
        }}
      >
        {overline && (
          <span
            className={secondary}
            style={{ color: 'var(--color-opacity-light-70)', mixBlendMode: 'luminosity' }}
          >
            {overline}
          </span>
        )}
        <span
          className={titleClass}
          style={{ color: 'var(--color-semantic-functional-text-primary)' }}
        >
          {title}
        </span>
        {subtitle && (
          <span
            className={secondary}
            style={{ color: 'var(--color-opacity-light-70)', mixBlendMode: 'luminosity' }}
          >
            {subtitle}
          </span>
        )}
        {advertising && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--dimension-spacing-core-2xs)',
            }}
          >
            <span
              className={secondary}
              style={{ color: 'var(--color-opacity-light-70)', mixBlendMode: 'luminosity' }}
            >
              {advertising.label}
            </span>
            <img
              src={advertising.logoSrc}
              alt=""
              style={{ height: 'var(--dimension-spacing-core-lg)', display: 'block' }}
            />
          </span>
        )}
      </span>
    </button>
  )
}
