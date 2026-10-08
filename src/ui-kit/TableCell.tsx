/**
 * Table Cell — Figma UI Kit "Table Cell", the one row a Content Card table is built from.
 *
 * A table is a stack of these, so a row is the unit a screen reasons about:
 *
 *   <ContentCardBody>
 *     <TableCell type="scout" label="Posse de bola" values={['49%', '51%']} divider />
 *     <TableCell name="SAO" position="1" shield={<Shield />} stats={['16', '6', '5']} />
 *     <TableCell type="athlete" number="2" name="Félix Torrez" goals={2} />
 *   </ContentCardBody>
 *
 * Three rows, each with its own height token, so a table lands on the 8pt grid
 * whatever it is made of: `team` (24) carries a badge beside its text, `athlete`
 * (16) is a single line, and `scout` (40) reads as a heading between two values.
 *
 * Every part beyond the name is optional and collapses when left out — a team
 * without a shield closes up flush left, a scout row without values keeps its
 * label centred. The shield is a slot rather than a fixed set, because the badge
 * is a flag, a crest or a competition mark depending on the screen.
 *
 * Its text spends three sizes (14, 12, 10) and two weights, in the kit's one face.
 */

import type { ReactNode } from 'react'
import { Text, token } from '@/primitives'
import './ui-kit.css'

interface TableCellBase {
  /** The rule under the row. Default off — a table draws it under a heading, not every row. */
  divider?: boolean
}

export interface TeamCellProps extends TableCellBase {
  type?: 'team'
  /** Standing or group position. Omitted: not drawn, and the row closes up. */
  position?: string
  /** The team's crest or flag. Omitted: not drawn. */
  shield?: ReactNode
  name: string
  /** Marks the team as the viewer's own. */
  favorite?: boolean
  /** Up to four columns, each one `table-stat-column` wide so they line up down the table. */
  stats?: string[]
}

export interface AthleteCellProps extends TableCellBase {
  type: 'athlete'
  /** Shirt number. Omitted: not drawn. */
  number?: string
  name: string
  yellowCard?: boolean
  redCard?: boolean
  /** Goals scored, from `0` to `9` in steps of `1`. `0` or omitted: not drawn. */
  goals?: number
  /** Who came on for them. Omitted: not drawn. */
  substitute?: string
}

export interface ScoutCellProps extends TableCellBase {
  type: 'scout'
  /** The stat being compared, centred whether or not the values are drawn. */
  label: string
  /** The two sides' values, left and right. Omitted: not drawn. */
  values?: [string, string]
}

export type TableCellProps = TeamCellProps | AthleteCellProps | ScoutCellProps

/**
 * Every prop any row takes, in one flat shape — the implementation signature, and
 * what Storybook's docgen documents (it can't read a union of props). Callers
 * still get the strict per-row union through `TableCell`'s one overload.
 */
export interface TableCellFields {
  /** Which row: `team` (the default), `athlete` or `scout`. */
  type?: 'team' | 'athlete' | 'scout'
  /** The team or athlete's name (team and athlete rows). */
  name?: string
  /** The stat being compared, centred (scout rows). */
  label?: string
  /** Standing or group position (team rows). Omitted: not drawn, and the row closes up. */
  position?: string
  /** The team's crest or flag (team rows). Omitted: not drawn. */
  shield?: ReactNode
  /** Marks the team as the viewer's own (team rows). */
  favorite?: boolean
  /** Up to four columns, each one `table-stat-column` wide so they line up down the table (team rows). */
  stats?: string[]
  /** Shirt number (athlete rows). Omitted: not drawn. */
  number?: string
  /** A yellow card beside the name (athlete rows). */
  yellowCard?: boolean
  /** A red card beside the name (athlete rows). */
  redCard?: boolean
  /** Goals scored (athlete rows), from `0` to `9` in steps of `1`. `0` or omitted: not drawn. */
  goals?: number
  /** Who came on for them (athlete rows). Omitted: not drawn. */
  substitute?: string
  /** The two sides' values, left and right (scout rows). Omitted: not drawn. */
  values?: [string, string]
  /** The rule under the row. Default off — a table draws it under a heading, not every row. */
  divider?: boolean
}

const MAX_STATS = 4

/**
 * The gap `ContentCardBody` puts between its children (`table-row-gap`, the `2xs`
 * step the user set for team and athlete tables); primitives.css cancels it for
 * scout rows. Scout rows cancel it between each other and sit flush
 * under their dividers, as in Figma's Estatísticas card (primitives.css).
 */
export const BODY_GAP = token('--dimension-spacing-semantic-table-row-gap')

type RowType = 'team' | 'athlete' | 'scout'

function Row({
  type,
  divider,
  flush,
  children,
}: {
  type: RowType
  divider?: boolean
  /**
   * Scout rows sit flush, as in Figma's Estatísticas card: primitives.css cancels
   * the body's gap above every scout row that follows another.
   */
  flush?: boolean
  children: ReactNode
}): ReactNode {
  // Each row keeps its height (ui-kit.css): in a body too short for it, it is cut
  // off (and the render check reports it) rather than every row squeezed.
  return (
    <div
      className="sfs-table-cell"
      data-type={type}
      data-divider={divider ? '' : undefined}
      data-flush-row={flush ? '' : undefined}
    >
      {children}
    </div>
  )
}

type MarkKind = 'card-warning' | 'card-error' | 'ball' | 'substitution' | 'heart'

/** A mark that sits in the text, so it takes its size from the row's type. */
function Mark({ kind, children }: { kind: MarkKind; children: ReactNode }): ReactNode {
  return (
    <span className="sfs-table-cell-mark" data-mark={kind} aria-hidden>
      {children}
    </span>
  )
}

function Card({ kind }: { kind: 'card-warning' | 'card-error' }): ReactNode {
  return (
    <Mark kind={kind}>
      <svg className="sfs-table-cell-glyph" viewBox="0 0 6 8" fill="none">
        <rect width="6" height="8" rx="1" fill="currentColor" />
      </svg>
    </Mark>
  )
}

function Ball(): ReactNode {
  return (
    <Mark kind="ball">
      <svg className="sfs-table-cell-glyph" viewBox="0 0 10 10" fill="none">
        <circle cx="5" cy="5" r="4.5" fill="currentColor" />
        <path d="M5 2.4 6.9 3.8 6.2 6.1H3.8L3.1 3.8Z" fill={token('--color-semantic-functional-background-primary')} />
      </svg>
    </Mark>
  )
}

function SubstitutionArrow(): ReactNode {
  return (
    <Mark kind="substitution">
      <svg className="sfs-table-cell-glyph" viewBox="0 0 8 8" fill="none">
        <path d="M0 1h8L4 7Z" fill="currentColor" />
      </svg>
    </Mark>
  )
}

function Heart(): ReactNode {
  return (
    <Mark kind="heart">
      <svg className="sfs-table-cell-glyph" viewBox="0 0 12 11" fill="none">
        <path
          d="M6 10.5 1.2 5.9A2.9 2.9 0 0 1 6 2.4a2.9 2.9 0 0 1 4.8 3.5Z"
          fill="currentColor"
        />
      </svg>
    </Mark>
  )
}

function Stats({ stats }: { stats: readonly string[] }): ReactNode {
  return (
    <div className="sfs-table-cell-stats">
      {stats.slice(0, MAX_STATS).map((stat, i) => (
        <span key={i} className="sfs-table-cell-stat">
          <Text
            as="span"
            variant={i === 0 ? 'body-sm-bold' : 'body-sm-medium'}
            color={i === MAX_STATS - 1 ? 'subtle' : 'primary'}
            align="center"
          >
            {stat}
          </Text>
        </span>
      ))}
    </div>
  )
}

function TeamCell({ position, shield, name, favorite, stats, divider }: TeamCellProps): ReactNode {
  return (
    <Row type="team" divider={divider}>
      <div className="sfs-table-cell-group">
        {position ? (
          <Text as="span" variant="footnote-medium">
            {position}
          </Text>
        ) : null}
        {shield ? (
          <span className="sfs-table-cell-shield">{shield}</span>
        ) : null}
        <Text as="span" variant="body-sm-medium" truncate>
          {name}
        </Text>
        {favorite ? <Heart /> : null}
      </div>
      {stats && stats.length ? <Stats stats={stats} /> : null}
    </Row>
  )
}

function AthleteCell({
  number,
  name,
  yellowCard,
  redCard,
  goals,
  substitute,
  divider,
}: AthleteCellProps): ReactNode {
  return (
    <Row type="athlete" divider={divider}>
      <div className="sfs-table-cell-group">
        {number ? (
          <Text as="span" variant="footnote-bold" color="secondary">
            {number}
          </Text>
        ) : null}
        <Text as="span" variant="footnote-bold" truncate>
          {name}
        </Text>
        {yellowCard ? <Card kind="card-warning" /> : null}
        {redCard ? <Card kind="card-error" /> : null}
        {goals ? (
          <>
            <Ball />
            <Text as="span" variant="caption-medium">
              ({goals})
            </Text>
          </>
        ) : null}
      </div>
      {substitute ? (
        <div className="sfs-table-cell-group">
          <SubstitutionArrow />
          <Text as="span" variant="footnote-medium" truncate>
            {substitute}
          </Text>
        </div>
      ) : null}
    </Row>
  )
}

function ScoutCell({ label, values, divider }: ScoutCellProps): ReactNode {
  return (
    <Row type="scout" divider={divider} flush>
      {values ? (
        <span className="sfs-table-cell-value">
          <Text as="span" variant="footnote-bold" align="start">
            {values[0]}
          </Text>
        </span>
      ) : null}
      <span className="sfs-table-cell-label">
        <Text as="span" variant="body-sm-medium" align="center" truncate>
          {label}
        </Text>
      </span>
      {values ? (
        <span className="sfs-table-cell-value">
          <Text as="span" variant="footnote-bold" align="end">
            {values[1]}
          </Text>
        </span>
      ) : null}
    </Row>
  )
}

/** One table row. `type` picks which row it is; everything optional collapses when left out. */
export function TableCell(props: TableCellProps): ReactNode
/** One table row. `type` picks which row it is; everything optional collapses when left out. */
export function TableCell(props: TableCellFields): ReactNode {
  // The overload holds every call to one row's props; the flat signature is for docgen.
  const row = props as TableCellProps
  if (row.type === 'athlete') return <AthleteCell {...row} />
  if (row.type === 'scout') return <ScoutCell {...row} />
  return <TeamCell {...row} />
}
