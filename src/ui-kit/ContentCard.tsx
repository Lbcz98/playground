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

/** The tall card for a vertical highlight (statistics, a line-up). Holds up to three zones — Header, Body, Footer — in that order. */
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
    outline: 'none',
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
    // Focusable: the viewer moves the TV focus onto the card from the rounded button.
    <div tabIndex={0} style={frame}>
      {focus ? <FocusRing shape="content-card" /> : <RestingBorder shape="content-card" width="card" />}
      <div style={zones}>{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Zones
// ---------------------------------------------------------------------------

export interface ContentCardHeaderMatch {
  /** The home side: its crest or flag, and its short name. */
  home: { badge?: ReactNode; name: string }
  /** The away side, drawn mirrored against the right edge. */
  away: { badge?: ReactNode; name: string }
}

export interface ContentCardHeaderPartner {
  logo?: ReactNode
  name: string
  /** Draws the verified tick after the name. */
  verified?: boolean
}

export interface ContentCardHeaderProps {
  /** Small line above the title. Omitted or empty: not drawn. */
  overline?: string
  /** Omitted or empty: not drawn — a header may be only a match, a partner or an ad tag. */
  title?: string
  /** Small line under the title. Omitted or empty: not drawn. */
  subtitle?: string
  /** A badge beside the title and subtitle — a flag, a crest, a channel mark. */
  icon?: ReactNode
  /** Two sides facing each other, instead of a title. */
  match?: ContentCardHeaderMatch
  /** Column headings beside the subtitle, on the same line — `Pts`, `J`, `V`. */
  stats?: string[]
  /** Who is presenting the card. */
  partner?: ContentCardHeaderPartner
  /** An advertising tag over a rule: its wording, and the advertiser's mark. */
  ad?: { label: string; logo?: ReactNode }
}

const badgeSlot: CSSProperties = { display: 'flex', alignItems: 'center', flexShrink: 0 }
const rowGap: CSSProperties = { display: 'flex', alignItems: 'center', gap: spacing('2xs'), minWidth: 0 }

function VerifiedTick(): ReactNode {
  return (
    <span style={{ ...badgeSlot, color: token('--color-semantic-functional-status-live') }} aria-hidden>
      <svg viewBox="0 0 12 12" style={{ height: '1em', width: 'auto', display: 'block' }} fill="none">
        <circle cx="6" cy="6" r="6" fill="currentColor" />
        <path
          d="M3.4 6.2 5.1 7.9 8.6 4.4"
          stroke={token('--color-semantic-functional-text-inverse')}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

/**
 * The top zone. Everything in it is optional and collapses when left out, so one
 * component covers the header the card actually needs:
 *
 *   plain text      `title`, with `overline` / `subtitle`
 *   with a badge    `icon` beside the text
 *   a match         `match`, the two sides facing each other
 *   a table heading `subtitle` + `stats`, the columns beside the second line
 *   a partner       `partner`, instead of the title
 *   an ad           `ad`, a tag over its rule
 */
export function ContentCardHeader({
  overline,
  title,
  subtitle,
  icon,
  match,
  stats,
  partner,
  ad,
}: ContentCardHeaderProps): ReactNode {
  const text = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing('3xs'), minWidth: 0, flex: '1 1 auto' }}>
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
      {subtitle || stats?.length ? (
        <div style={{ ...rowGap, justifyContent: 'space-between' }}>
          {subtitle ? (
            <Text as="span" variant="body-sm-medium" color="muted">
              {subtitle}
            </Text>
          ) : null}
          {stats?.length ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing('2xs'), flexShrink: 0 }}>
              {stats.map((stat, i) => (
                <span key={i} style={{ display: 'block', width: size('table-stat-column') }}>
                  <Text as="span" variant="body-sm-medium" color="subtle" align="center">
                    {stat}
                  </Text>
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing('2xs'), flexShrink: 0 }}>
      {match ? (
        <div style={{ ...rowGap, justifyContent: 'space-between' }}>
          <div style={rowGap}>
            {match.home.badge ? <span style={badgeSlot}>{match.home.badge}</span> : null}
            <Text as="span" variant="body-sm-bold" truncate>
              {match.home.name}
            </Text>
          </div>
          <div style={rowGap}>
            <Text as="span" variant="body-sm-bold" truncate>
              {match.away.name}
            </Text>
            {match.away.badge ? <span style={badgeSlot}>{match.away.badge}</span> : null}
          </div>
        </div>
      ) : null}

      {partner ? (
        <div style={rowGap}>
          {partner.logo ? <span style={badgeSlot}>{partner.logo}</span> : null}
          <Text as="span" variant="body-sm-bold" truncate>
            {partner.name}
          </Text>
          {partner.verified ? <VerifiedTick /> : null}
        </div>
      ) : null}

      {overline || title || subtitle || stats?.length || icon ? (
        <div style={{ ...rowGap, gap: spacing('sm') }}>
          {icon ? <span style={badgeSlot}>{icon}</span> : null}
          {text}
        </div>
      ) : null}

      {ad ? (
        <div
          style={{
            ...rowGap,
            gap: spacing('2xs'),
            paddingBottom: spacing('2xs'),
            borderBottom: `${token('--dimension-border-width-semantic-divider')} solid ${token('--color-semantic-functional-border-subtle')}`,
          }}
        >
          <Text as="span" variant="caption-medium" color="muted">
            {ad.label}
          </Text>
          {ad.logo ? <span style={badgeSlot}>{ad.logo}</span> : null}
        </div>
      ) : null}
    </div>
  )
}

export interface ContentCardBodyProps {
  /** A quote under the body's content. Omitted or empty: not drawn. */
  quote?: string
  /** The card's content — rows of Table Cells, or any stack of kit text. */
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
