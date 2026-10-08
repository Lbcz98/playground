/**
 * Box — the generic structural container.
 *
 * Padding takes only grid spacing steps (a multiple of 8, or the 4 and 12
 * exceptions — the frame's layout rule), the surface only functional background and border
 * roles, corners only the radius scale. There is no `style` or `className`:
 * everything a Box can look like is a token. For flex layout, use `<Stack>`.
 */

import { createElement, type AriaAttributes, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import {
  borderColor,
  radius as radiusStep,
  spacing,
  surface,
  token,
  type BorderColor,
  type GridSpacing,
  type RadiusStep,
  type SurfaceColor,
} from './tokens'

export type BoxElement =
  | 'div'
  | 'section'
  | 'article'
  | 'header'
  | 'footer'
  | 'nav'
  | 'main'
  | 'aside'
  | 'ul'
  | 'ol'
  | 'li'
  | 'span'

/**
 * The HTML attributes a primitive hands to its element: identity and accessibility (`id`, `role`,
 * `aria-*`, and `data-*`, which JSX takes without a declaration). Nothing that styles, scripts or
 * injects markup: no `style`, `className`, handlers or `dangerouslySetInnerHTML`.
 */
export type PassThroughProps = Pick<HTMLAttributes<HTMLElement>, 'id' | 'role'> & AriaAttributes

/** `rest` cut down to `PassThroughProps`. The types do not see a spread, so the cut is made here too. */
export function passThrough(rest: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(rest).filter(([key]) => key === 'id' || key === 'role' || /^(aria|data)-/.test(key)))
}

export interface BoxProps extends PassThroughProps {
  as?: BoxElement
  padding?: GridSpacing
  /** Overrides `padding` on the inline (left/right) edges. */
  paddingX?: GridSpacing
  /** Overrides `padding` on the block (top/bottom) edges. */
  paddingY?: GridSpacing
  background?: SurfaceColor
  /** A hairline border in a functional border colour. */
  border?: BorderColor
  radius?: RadiusStep
  /** Take the remaining space along the parent Stack's direction. */
  grow?: boolean
  children?: ReactNode
}

/**
 * Splits Box's own props from the pass-through HTML attributes and resolves them
 * to declarations — Stack uses this to layer flex layout over the same surface.
 */
export function resolveBoxProps<P extends BoxProps>({
  as = 'div',
  padding,
  paddingX,
  paddingY,
  background,
  border,
  radius,
  grow,
  children,
  ...rest
}: P) {
  const inline = paddingX ?? padding
  const block = paddingY ?? padding
  const style: CSSProperties = {
    boxSizing: 'border-box',
    margin: 0,
    paddingInline: inline ? spacing(inline) : 0,
    paddingBlock: block ? spacing(block) : 0,
    backgroundColor: background ? surface(background) : undefined,
    border: border
      ? `${token('--dimension-border-width-semantic-card')} solid ${borderColor(border)}`
      : undefined,
    borderRadius: radius ? radiusStep(radius) : undefined,
    flex: grow ? '1 1 0%' : undefined,
    minWidth: grow ? 0 : undefined,
    listStyle: as === 'ul' || as === 'ol' ? 'none' : undefined,
  }
  return { as, style, rest: { ...passThrough(rest), children } }
}

export function Box(props: BoxProps): ReactNode {
  const { as, style, rest } = resolveBoxProps(props)
  return createElement(as, { ...rest, style })
}
