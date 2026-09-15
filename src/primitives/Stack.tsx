/**
 * Stack — a Box laid out as a flex row or column.
 *
 * The gap between children takes only grid spacing steps, like Box's padding,
 * and every Box prop still applies. This is the layout primitive: space things
 * with a Stack's gap, never with margins.
 */

import { createElement, type ReactNode } from 'react'
import { resolveBoxProps, type BoxProps } from './Box'
import { spacing, type GridSpacing } from './tokens'

export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
export type StackJustify = 'start' | 'center' | 'end' | 'between'

export interface StackProps extends BoxProps {
  /** Default `column`. */
  direction?: 'row' | 'column'
  gap?: GridSpacing
  /** Cross-axis alignment. Default `stretch`. */
  align?: StackAlign
  /** Main-axis distribution. Default `start`. */
  justify?: StackJustify
  wrap?: boolean
}

const FLEX_ALIGN: Record<StackAlign, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
}

const FLEX_JUSTIFY: Record<StackJustify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
}

export function Stack({
  direction = 'column',
  gap,
  align = 'stretch',
  justify = 'start',
  wrap = false,
  ...boxProps
}: StackProps): ReactNode {
  const { as, style, rest } = resolveBoxProps(boxProps)
  return createElement(as, {
    ...rest,
    style: {
      ...style,
      display: 'flex',
      flexDirection: direction,
      flexWrap: wrap ? 'wrap' : undefined,
      gap: gap ? spacing(gap) : undefined,
      alignItems: FLEX_ALIGN[align],
      justifyContent: FLEX_JUSTIFY[justify],
    },
  })
}
