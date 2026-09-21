/**
 * Content Card — Figma UI Kit "Button Tall" (2472:120292), ported as a composed card.
 *
 * The tall card for a vertical highlight — statistics, a line-up, a scoreboard. It
 * is a frame and three zones, and the zones are its own components so a screen
 * takes only the ones it needs:
 *
 *   <ContentCard>
 *     <ContentCardHeader overline="Copa do Mundo" title="Estatísticas" />
 *     <ContentCardBody>…</ContentCardBody>
 *     <ContentCardFooter caption="Atualizado há 1 min" />
 *   </ContentCard>
 *
 * Header, Body and Footer go in that order, each at most once, and any of them
 * may be left out. That is enforced where a card is composed from data — the
 * Blueprint validator, the interpreter and the palette all read one placement
 * rule (`placementError`, `slotOrderErrors` in the manifest) — so this component
 * only has to lay out what it is given.
 *
 * Geometry: Button Tall's own radius (`content-card`, 40), and the Content Card
 * spec's `lg` inset (24) on every side where Button Tall draws 36×32. The width is
 * fixed; the height is a count of 8pt grid steps, set per use, up to
 * `contentCardSpec.maxHeight`. The body takes whatever height the
 * header and footer leave, and the footer is pinned to the bottom edge whether or
 * not a body sits above it.
 *
 * At rest the card is translucent with the kit's one `<RestingBorder>` and its
 * content dimmed, like the other cards; focused, it draws the kit's one
 * `<FocusRing>` — and so moves with the kit's one focus motion — at full strength.
 *
 * Its own text spends at most three sizes (18, 14, 12) and two weights (bold,
 * medium), all in the kit's one face.
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
import { contentCardSpec, frameSpec, spacingScale } from '@/design-system/primitives'

export type ContentCardState = Extract<InteractionState, 'default' | 'focus'>

export interface ContentCardProps {
  /** Default `default`. */
  interactionState?: ContentCardState
  /**
   * Total height in px, a multiple of the 8pt grid up to `contentCardSpec.maxHeight`.
   * Anything else is snapped onto the grid and held inside the range. Default 440.
   */
  height?: number
  /** Any of `ContentCardHeader`, `ContentCardBody`, `ContentCardFooter`, in that order. */
  children?: ReactNode
}

const RADIUS = token('--dimension-radius-semantic-content-card')
const INSET = spacing(contentCardSpec.inset)

/**
 * The height as a count of grid steps, so it can only ever land on the grid: `2xs`
 * is the 8pt step itself. The smallest card is its inset top and bottom.
 */
function gridHeight(px: number): string {
  const grid = frameSpec.grid
  const minSteps = Math.ceil((2 * parseFloat(spacingScale[contentCardSpec.inset])) / grid)
  const maxSteps = Math.floor(contentCardSpec.maxHeight / grid)
  const steps = Math.min(maxSteps, Math.max(minSteps, Math.round(px / grid)))
  return `calc(${steps} * ${spacing('2xs')})`
}

export function ContentCard({ interactionState, height = contentCardSpec.height, children }: ContentCardProps): ReactNode {
  const state = resolveInteractionState(
    'ui-kit/ContentCard',
    interactionState,
    { prop: 'focus', value: undefined },
    'default',
  )
  const focus = state === 'focus'

  const frame: CSSProperties = {
    position: 'relative',
    boxSizing: 'border-box',
    width: size('content-card-width'),
    height: gridHeight(height),
    padding: INSET,
    borderRadius: RADIUS,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: focus ? undefined : token('--color-semantic-functional-background-translucent'),
  }

  const zones: CSSProperties = {
    position: 'relative',
    flex: '1 1 auto',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing('sm'),
    opacity: focus ? undefined : token('--opacity-semantic-content-muted'),
  }

  return (
    <div style={frame}>
      {focus ? <FocusRing shape="content-card" /> : <RestingBorder shape="content-card" width="card" />}
      <div style={zones}>{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Zones
// ---------------------------------------------------------------------------

export interface ContentCardHeaderProps {
  /** Small line above the title. Omitted or empty: not drawn. */
  overline?: string
  /** Default `Título`. Empty: not drawn. */
  title?: string
  /** Small line under the title. Omitted or empty: not drawn. */
  subtitle?: string
}

/** The top zone: overline, title and subtitle, held together by the `3xs` micro-gap. */
export function ContentCardHeader({ overline, title = 'Título', subtitle }: ContentCardHeaderProps): ReactNode {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing('3xs'), flexShrink: 0 }}>
      {overline ? (
        <Text as="span" variant="body-sm-medium" color="muted">
          {overline}
        </Text>
      ) : null}
      {title ? (
        <Text as="span" variant="body-lg-bold">
          {title}
        </Text>
      ) : null}
      {subtitle ? (
        <Text as="span" variant="body-sm-medium" color="muted">
          {subtitle}
        </Text>
      ) : null}
    </div>
  )
}

export interface ContentCardBodyProps {
  /** A quote under the body's content. Omitted or empty: not drawn. */
  quote?: string
  children?: ReactNode
}

/**
 * The main zone. It takes the height the header and footer leave and clips at the
 * card's inset rather than pushing past it.
 */
export function ContentCardBody({ quote, children }: ContentCardBodyProps): ReactNode {
  return (
    <div
      style={{
        flex: '1 1 auto',
        minHeight: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: spacing('xs'),
      }}
    >
      {children}
      {quote ? (
        <Text as="span" variant="body-lg-medium">
          {quote}
        </Text>
      ) : null}
    </div>
  )
}

export interface ContentCardFooterProps {
  /** A centred caption, drawn at 70% like Figma's. Omitted or empty: not drawn. */
  caption?: string
  /** Controls or a call to action, laid out beside the caption. */
  children?: ReactNode
}

/** The bottom zone, pinned to the card's bottom edge even when there is no body above it. */
export function ContentCardFooter({ caption, children }: ContentCardFooterProps): ReactNode {
  return (
    <div
      style={{
        marginTop: 'auto',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: spacing('2xs'),
      }}
    >
      {caption ? (
        <Text as="span" variant="footnote-medium" opacity="text-secondary" align="center">
          {caption}
        </Text>
      ) : null}
      {children}
    </div>
  )
}
