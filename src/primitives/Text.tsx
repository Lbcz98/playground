/**
 * Text — the lowest-level typography primitive.
 *
 * Its look is exactly one generated `.text-*` utility class (`variant`, one of
 * the contract's typography composites), one functional colour role and,
 * optionally, one semantic opacity role. There is no `style` or `className`
 * escape hatch, so text can't drift off the type scale. For headings, use
 * `<Heading>`.
 */

import { createElement, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import type { TextStyle } from '@/styles/global-tokens'
import { opacity as opacityRole, textClass, textColor, type OpacityRole, type TextColor } from './tokens'

export type TextElement =
  | 'span'
  | 'p'
  | 'div'
  | 'label'
  | 'strong'
  | 'em'
  | 'small'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, 'style' | 'className' | 'color'> {
  /** A `.text-*` utility class from global.css. */
  variant?: TextStyle
  /** A functional text role, a `status-*` colour, or `inherit` to take the parent's. */
  color?: TextColor | 'inherit'
  /** A semantic opacity role, e.g. `title` for a 90% headline. */
  opacity?: OpacityRole
  as?: TextElement
  align?: 'start' | 'center' | 'end'
  /** One line, ellipsised. */
  truncate?: boolean
  /** Only meaningful with `as="label"`. */
  htmlFor?: string
  children?: ReactNode
}

const truncated: CSSProperties = {
  display: 'block',
  minWidth: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
}

export function Text({
  variant = 'body-md-regular',
  color = 'primary',
  opacity,
  as = 'span',
  align,
  truncate = false,
  ...rest
}: TextProps): ReactNode {
  return createElement(as, {
    ...rest,
    className: textClass(variant),
    style: {
      margin: 0,
      color: textColor(color),
      opacity: opacity ? opacityRole(opacity) : undefined,
      textAlign: align,
      ...(truncate ? truncated : undefined),
    },
  })
}
