/**
 * Primitives — the lowest-level UI components, built only from the generated
 * token layer (`src/styles/global.css` + `global-tokens.ts`, compiled from
 * `tokens/tokens.json`). Higher-level components compose these.
 */

export { Box, type BoxElement, type BoxProps } from './Box'
export { Button, type ButtonProps, type ButtonSize, type ButtonStatus, type ButtonVariant } from './Button'
export { Heading, type HeadingLevel, type HeadingProps, type HeadingWeight } from './Heading'
export { Stack, type StackAlign, type StackJustify, type StackProps } from './Stack'
export { Text, type TextElement, type TextProps } from './Text'
export {
  GRID_SPACING,
  OFF_GRID_SPACING,
  RADIUS_STEPS,
  size,
  spacing,
  textClass,
  token,
  type BorderColor,
  type GridSpacing,
  type OpacityRole,
  type RadiusStep,
  type SemanticVar,
  type SizeRole,
  type SpacingStep,
  type StatusColor,
  type SurfaceColor,
  type TextColor,
} from './tokens'
