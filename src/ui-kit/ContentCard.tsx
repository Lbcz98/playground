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
 * fixed (288); by default the card hugs its content up to `contentCardSpec.maxHeight`
 * (456), or takes a height set per use as a count of 8pt grid steps. The body takes whatever height the
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

import {
  Children,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import {
  FocusRing,
  RestingBorder,
  spacing,
  Text,
  token,
  vars,
  type InteractionState,
} from '@/primitives'
import './ui-kit.css'
import { contentCardSpec, frameSpec, spacingScale } from '@/design-system/primitives'

export type ContentCardState = Extract<InteractionState, 'default' | 'focus'>

export interface ContentCardProps {
  /** Default `default`. */
  interactionState?: ContentCardState
  /**
   * Total height in px, from `48` to `456` in steps of `8` (the grid). Anything
   * else is snapped onto the grid and held inside the range. Omitted: the card
   * hugs its content, up to 456, like the Figma cards built from it.
   */
  height?: number
  /**
   * Space between the header, body and footer in px, from `0` to `40`, on the 8pt
   * scale: a multiple of 8, or 4 or 12. Omitted: 16, the kit's gutter.
   */
  gap?: number
  /**
   * Makes the whole card one button (Enter / Space too). The card is the only
   * interactive surface: nothing inside it may be a `<button>` or `<a>`.
   */
  onClick?: () => void
  /**
   * Rows per page, from `1` to `10` in steps of `1`: the body shows that many of its
   * rows, and a click on the card (or Enter / Space) shows the next ones, wrapping
   * back to the first. Omitted: every row at once.
   */
  rowsPerPage?: number
  /** Any of `ContentCardHeader`, `ContentCardBody`, `ContentCardFooter`, in that order. */
  children?: ReactNode
}

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

/**
 * Development only: a clickable card is the one control, so a `<button>` or `<a>`
 * inside it is a second control nested in the first. Checked after every render.
 */
export function warnOnNestedControls(card: Pick<HTMLElement, 'querySelector'> | null): void {
  const nested = card?.querySelector('button, a, [role="button"]')
  if (nested) {
    console.warn(
      `[ui-kit/ContentCard] a clickable card is one control: remove the nested <${nested.tagName.toLowerCase()}> and act in the card's onClick.`,
    )
  }
}

/**
 * The whole card as one button: a click, Enter or Space. A div, not a `<button>`:
 * the zones are block content, which a `<button>` may not hold.
 */
export function cardPress(onClick: () => void) {
  return {
    role: 'button',
    onClick,
    onKeyDown: (e: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault() // Space would scroll the page
      onClick()
    },
  }
}

/** The token the body's gap is (BODY_GAP in TableCell.tsx), by name: a `gap` set per use redefines it. */
const BODY_GAP_TOKEN = '--dimension-spacing-semantic-table-row-gap'

/** Which page of rows the card is on, for its body. */
const CardPage = createContext<{ page: number; rowsPerPage?: number }>({ page: 0 })

/** The tall card, 288 wide, for a vertical highlight (statistics, a line-up). Holds up to three zones — Header, Body, Footer — in that order. At its tallest its body holds 10 team rows, 10 athlete rows or 7 scout rows under a header and footer: for a longer table set rowsPerPage, and the viewer clicks the card for the next rows. */
export function ContentCard({ interactionState, height, gap, onClick, rowsPerPage, children }: ContentCardProps): ReactNode {
  const state = (interactionState ?? 'default')
  const focus = state === 'focus'
  const [page, setPage] = useState(0)
  const card = useRef<HTMLDivElement>(null)
  const act =
    rowsPerPage === undefined
      ? onClick
      : () => {
          setPage((p) => p + 1)
          onClick?.()
        }
  useEffect(() => {
    if (import.meta.env.DEV && act) warnOnNestedControls(card.current)
  })

  return (
    // Focusable: the viewer moves the TV focus onto the card from the rounded button.
    <div
      ref={card}
      tabIndex={0}
      className="sfs-content-card sfs-motion sfs-focusable"
      data-state={state}
      data-sized={height === undefined ? undefined : ''}
      data-pressable={act ? '' : undefined}
      // Omitted: hug the content, capped at the tallest card — what doesn't fit is
      // cut off by the body, where the render check sees it.
      style={vars({ '--_height': gridHeight(height ?? contentCardSpec.maxHeight) })}
      {...(act && cardPress(act))}
    >
      {focus ? <FocusRing shape="content-card" /> : <RestingBorder shape="content-card" width="card" />}
      <CardPage.Provider value={{ page, rowsPerPage }}>
        <div className="sfs-content-card-zones" style={vars({ '--_gap': gap === undefined ? spacing('sm') : `${gap}px` })}>
          {children}
        </div>
      </CardPage.Provider>
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

function VerifiedTick(): ReactNode {
  return (
    <span className="sfs-content-card-tick" aria-hidden>
      <svg viewBox="0 0 12 12" className="sfs-content-card-tick-glyph" fill="none">
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
    <div className="sfs-content-card-text">
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
        <div className="sfs-content-card-subtitle">
          {subtitle ? (
            <Text as="span" variant="body-sm-medium" color="muted">
              {subtitle}
            </Text>
          ) : null}
          {stats?.length ? (
            <div className="sfs-content-card-stats">
              {stats.map((stat, i) => (
                <span key={i} className="sfs-content-card-stat">
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
    <div className="sfs-content-card-header">
      {match ? (
        <div className="sfs-content-card-match">
          <div className="sfs-content-card-side">
            {match.home.badge ? <span className="sfs-content-card-badge">{match.home.badge}</span> : null}
            <Text as="span" variant="body-sm-bold" truncate>
              {match.home.name}
            </Text>
          </div>
          <div className="sfs-content-card-side">
            <Text as="span" variant="body-sm-bold" truncate>
              {match.away.name}
            </Text>
            {match.away.badge ? <span className="sfs-content-card-badge">{match.away.badge}</span> : null}
          </div>
        </div>
      ) : null}

      {partner ? (
        <div className="sfs-content-card-partner">
          {partner.logo ? <span className="sfs-content-card-badge">{partner.logo}</span> : null}
          <Text as="span" variant="body-sm-bold" truncate>
            {partner.name}
          </Text>
          {partner.verified ? <VerifiedTick /> : null}
        </div>
      ) : null}

      {overline || title || subtitle || stats?.length || icon ? (
        <div className="sfs-content-card-heading">
          {icon ? <span className="sfs-content-card-badge">{icon}</span> : null}
          {text}
        </div>
      ) : null}

      {ad ? (
        <div className="sfs-content-card-ad">
          <Text as="span" variant="caption-medium" color="muted">
            {ad.label}
          </Text>
          {ad.logo ? <span className="sfs-content-card-badge">{ad.logo}</span> : null}
        </div>
      ) : null}
    </div>
  )
}

export interface ContentCardBodyProps {
  /** A quote under the body's content. Omitted or empty: not drawn. */
  quote?: string
  /**
   * Space between the body's rows in px, from `0` to `40`, on the 8pt scale: a
   * multiple of 8, or 4 or 12. Scout rows still sit flush. Omitted: 8
   * (`table-row-gap`).
   */
  gap?: number
  /** The card's content — rows of Table Cells, or any stack of kit text. */
  children?: ReactNode
}

/**
 * The main zone. It takes the height the header and footer leave and clips at the
 * card's inset rather than pushing past it.
 */
export function ContentCardBody({ quote, gap, children }: ContentCardBodyProps): ReactNode {
  const { page, rowsPerPage } = useContext(CardPage)
  let rows = children
  if (rowsPerPage) {
    const all = Children.toArray(children)
    const first = (page % Math.max(1, Math.ceil(all.length / rowsPerPage))) * rowsPerPage
    rows = all.slice(first, first + rowsPerPage)
  }
  return (
    <div
      className="sfs-content-card-body"
      // A gap set per use re-points the table-row-gap token inside this body, so
      // the body's own gap, the flush rule for scout rows (primitives.css) and
      // anything a row spaces by that token all move together. Not a `--_` value:
      // it is the token itself that is redefined here, for the body's subtree.
      style={gap === undefined ? undefined : ({ [BODY_GAP_TOKEN]: `${gap}px` } as CSSProperties)}
      data-card-body=""
    >
      {rows}
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
  /** Text laid out beside the caption. Never a `<button>` or `<a>`: the card itself is the one control. */
  children?: ReactNode
}

/** The bottom zone, pinned to the card's bottom edge even when there is no body above it. */
export function ContentCardFooter({ caption, children }: ContentCardFooterProps): ReactNode {
  return (
    <div className="sfs-content-card-footer">
      {caption ? (
        <Text as="span" variant="footnote-medium" opacity="text-secondary" align="center">
          {caption}
        </Text>
      ) : null}
      {children}
    </div>
  )
}
