/**
 * Heading — `<Text>` locked to the contract's heading styles.
 *
 * `level` picks the size (tokens.json defines heading-3 to heading-5) and, unless
 * `as` overrides it, the matching h3–h5 element. A TV screen's title is often a
 * visually modest h1 — pass `as="h1"` rather than reaching for a bigger style.
 */

import type { ReactNode } from 'react'
import type { TextStyle } from '@/styles/global-tokens'
import { Text, type TextProps } from './Text'

export type HeadingLevel = 3 | 4 | 5
export type HeadingWeight = 'medium' | 'bold'

export interface HeadingProps extends Omit<TextProps, 'variant' | 'as' | 'htmlFor'> {
  level?: HeadingLevel
  weight?: HeadingWeight
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export function Heading({ level = 3, weight = 'bold', as, ...rest }: HeadingProps): ReactNode {
  // `satisfies` fails the build if tokens.json ever drops one of these pairs.
  const variant = `heading-${level}-${weight}` as const satisfies TextStyle
  return <Text {...rest} variant={variant} as={as ?? `h${level}`} />
}
