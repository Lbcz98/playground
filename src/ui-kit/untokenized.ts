/**
 * Component SIZES measured off the Figma UI Kit. These are all that remain
 * without a token: the set has scales for spacing, radius, border-width and
 * opacity, but none for component width/height.
 *
 * Everything else in `src/ui-kit/` resolves through `var(--…)`. Values that
 * fell between steps were snapped to the nearest one rather than parked here —
 * see the note on each component.
 *
 * Allowlisted in `scripts/check-tokens.mjs` alongside `primitives.ts` and
 * `global.css`.
 */

/** Card button — large (Focus/Selected) and small (Default) frames. */
export const CARD = {
  focusWidth: '208px',
  focusHeight: '160px',
  defaultWidth: '158px',
  defaultHeight: '122px',
} as const

/** Rounded (back) button. The focus icon is 32px, which IS on the spacing scale. */
export const ROUNDED = {
  outerSize: '88px',
  circleSize: '72px',
  /** Sits between the 24px and 32px steps; kept exact because it is a size. */
  iconRestSize: '28px',
} as const

/** Wide (insert) button. Its 40px height IS on the spacing scale. */
export const WIDE = {
  width: '240px',
} as const
