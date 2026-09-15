/**
 * Text — the lowest-level typography primitive.
 *
 * Its look is exactly one generated `.text-*` utility class (`variant`, one of
 * the contract's typography composites) plus one functional colour role. There
 * is no `style` or `className` escape hatch, so text can't drift off the type
 * scale. For headings, use `<Heading>`.
 */

import { createElement, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import type { TextStyle } from '@/styles/global-tokens'
import { textColor, type TextColor } from './tokens'

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
  as = 'span',
  align,
  truncate = false,
  ...rest
}: TextProps): ReactNode {
  return createElement(as, {
    ...rest,
    className: `text-${variant}`,
    style: {
      margin: 0,
      color: textColor(color),
      textAlign: align,
      ...(truncate ? truncated : undefined),
    },
  })
}
