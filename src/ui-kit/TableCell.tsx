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

import type { CSSProperties, ReactNode } from 'react'
import { size, spacing, Text, token } from '@/primitives'

const DIVIDER = `${token('--dimension-border-width-semantic-divider')} solid ${token('--color-semantic-functional-border-subtle')}`

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
  stats?: readonly string[]
}

export interface AthleteCellProps extends TableCellBase {
  type: 'athlete'
  /** Shirt number. Omitted: not drawn. */
  number?: string
  name: string
  yellowCard?: boolean
  redCard?: boolean
  /** Goals scored. `0` or omitted: not drawn. */
  goals?: number
  /** Who came on for them. Omitted: not drawn. */
  substitute?: string
}

export interface ScoutCellProps extends TableCellBase {
  type: 'scout'
  /** The stat being compared, centred whether or not the values are drawn. */
  label: string
  /** The two sides' values, left and right. Omitted: not drawn. */
  values?: readonly [string, string]
}

export type TableCellProps = TeamCellProps | AthleteCellProps | ScoutCellProps

const MAX_STATS = 4

function Row({
  height,
  divider,
  children,
}: {
  height: string
  divider?: boolean
  children: ReactNode
}): ReactNode {
  const style: CSSProperties = {
    boxSizing: 'border-box',
    height,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing('2xs'),
    borderBottom: divider ? DIVIDER : undefined,
  }
  return <div style={style}>{children}</div>
}

/** A mark that sits in the text, so it takes its size from the row's type. */
function Mark({ color, children }: { color: string; children: ReactNode }): ReactNode {
  return (
    <span style={{ display: 'flex', alignItems: 'center', color, flexShrink: 0 }} aria-hidden>
      {children}
    </span>
  )
}

const markSize: CSSProperties = { height: '1em', width: 'auto', display: 'block' }

function Card({ color }: { color: string }): ReactNode {
  return (
    <Mark color={color}>
      <svg viewBox="0 0 6 8" style={markSize} fill="none">
        <rect width="6" height="8" rx="1" fill="currentColor" />
      </svg>
    </Mark>
  )
}

function Ball(): ReactNode {
  return (
    <Mark color={token('--color-semantic-functional-text-primary')}>
      <svg viewBox="0 0 10 10" style={markSize} fill="none">
        <circle cx="5" cy="5" r="4.5" fill="currentColor" />
        <path d="M5 2.4 6.9 3.8 6.2 6.1H3.8L3.1 3.8Z" fill={token('--color-semantic-functional-background-primary')} />
      </svg>
    </Mark>
  )
}

function SubstitutionArrow(): ReactNode {
  return (
    <Mark color={token('--color-semantic-functional-status-error')}>
      <svg viewBox="0 0 8 8" style={markSize} fill="none">
        <path d="M0 1h8L4 7Z" fill="currentColor" />
      </svg>
    </Mark>
  )
}

function Heart(): ReactNode {
  return (
    <Mark color={token('--color-semantic-functional-status-error')}>
      <svg viewBox="0 0 12 11" style={markSize} fill="none">
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
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing('2xs'), flexShrink: 0 }}>
      {stats.slice(0, MAX_STATS).map((stat, i) => (
        <span key={i} style={{ display: 'block', width: size('table-stat-column') }}>
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
    <Row height={size('table-cell-md')} divider={divider}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing('2xs'), minWidth: 0 }}>
        {position ? (
          <Text as="span" variant="footnote-medium">
            {position}
          </Text>
        ) : null}
        {shield ? (
          <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{shield}</span>
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
    <Row height={size('table-cell-sm')} divider={divider}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing('3xs'), minWidth: 0 }}>
        {number ? (
          <Text as="span" variant="footnote-bold" color="secondary">
            {number}
          </Text>
        ) : null}
        <Text as="span" variant="footnote-bold" truncate>
          {name}
        </Text>
        {yellowCard ? <Card color={token('--color-semantic-functional-status-warning')} /> : null}
        {redCard ? <Card color={token('--color-semantic-functional-status-error')} /> : null}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing('3xs'), minWidth: 0 }}>
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
  const column: CSSProperties = { width: size('table-value-column'), flexShrink: 0 }
  return (
    <Row height={size('table-cell-lg')} divider={divider}>
      {values ? (
        <span style={column}>
          <Text as="span" variant="footnote-bold" align="start">
            {values[0]}
          </Text>
        </span>
      ) : null}
      <span style={{ flex: '1 1 auto', minWidth: 0 }}>
        <Text as="span" variant="body-sm-medium" align="center" truncate>
          {label}
        </Text>
      </span>
      {values ? (
        <span style={column}>
          <Text as="span" variant="footnote-bold" align="end">
            {values[1]}
          </Text>
        </span>
      ) : null}
    </Row>
  )
}

/** One table row. `type` picks which row it is; everything optional collapses when left out. */
export function TableCell(props: TableCellProps): ReactNode {
  if (props.type === 'athlete') return <AthleteCell {...props} />
  if (props.type === 'scout') return <ScoutCell {...props} />
  return <TeamCell {...props} />
}
