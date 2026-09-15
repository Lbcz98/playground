/**
 * The token scales behind the "Global CSS Tokens" design system, read straight
 * from `tokens/tokens.json` — the same contract `src/styles/global.css` is
 * compiled from — so `w3c-manifest.ts` can run them through the SAME
 * `parseDesignTokens` adapter Phase 7A built for imported Storybook design
 * systems (`token-adapter.ts`), never a second, drifting copy.
 *
 * Deliberately not the whole file:
 *   - `dimension.border-width` and `opacity`: `ManifestTokens` has no slot for
 *     either, and token-adapter's colours regex matches `border(?!-radius)`, so
 *     border widths would land in the colours dict.
 *   - the `typography.<style>.<weight>` composites: those are the `.text-*`
 *     utility classes, not scale values.
 */

import tokens from '../../../tokens/tokens.json'

const { fontFamily, fontWeight, fontSize, letterSpacing, lineHeight } = tokens.typography

export const W3C_TOKEN_SOURCE = {
  color: tokens.color,
  gradient: tokens.gradient,
  dimension: {
    radius: tokens.dimension.radius,
    spacing: tokens.dimension.spacing,
  },
  typography: { fontFamily, fontWeight, fontSize, letterSpacing, lineHeight },
}
