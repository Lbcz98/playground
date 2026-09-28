/**
 * Primitive values — the only raw numbers and hex codes allowed in the whole app.
 *
 * Nothing else in the codebase may contain a literal color, pixel size, radius or
 * shadow. `tokens.ts` gives these primitives *semantic* names, `tailwind.config.ts`
 * turns them into the only utility classes that exist, and the ComponentRegistry is
 * the only place those classes are written. The AI agent can therefore never
 * introduce a value that is not in this file.
 */

export const palette = {
  transparent: 'transparent',
  current: 'currentColor',
  white: '#ffffff',
  gray: {
    50: '#f7f8fa',
    100: '#eef0f4',
    200: '#e2e5ec',
    300: '#cdd2dd',
    400: '#9aa1b1',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2430',
    900: '#12151d',
  },
  blue: {
    100: '#e6efff',
    300: '#9dc0ff',
    500: '#2f6bff',
    600: '#1f52d6',
    700: '#173fa6',
  },
  green: {
    100: '#e2f6ea',
    500: '#1f9d55',
    600: '#17803f',
  },
  red: {
    100: '#fde7e7',
    500: '#e5484d',
    600: '#c62a2f',
  },
} as const

/**
 * Spacing / gap / padding scale. Named steps only — no numeric ladder.
 *
 * The names and values are the DTV kit's own spacing scale
 * (`--dimension-spacing-core-*` in `styles/global.css`), so the canvas, the
 * Inspector, the agent's vocabulary and the UI Kit components all mean the same
 * thing by "sm" — and a screen can sit its rail the 40px above the menu that the
 * kit specifies.
 */
export const spacingScale = {
  none: '0px',
  '3xs': '4px',
  '2xs': '8px',
  xs: '12px',
  sm: '16px',
  md: '20px',
  lg: '24px',
  xl: '32px',
  '2xl': '40px',
  '3xl': '48px',
  '4xl': '64px',
  '5xl': '80px',
  '6xl': '96px',
} as const

export const radiusScale = {
  none: '0px',
  sm: '6px',
  md: '10px',
  lg: '16px',
  full: '9999px',
} as const

/** [fontSize, lineHeight] pairs. */
export const fontSizeScale = {
  xs: ['12px', '16px'],
  sm: ['14px', '20px'],
  md: ['16px', '24px'],
  lg: ['20px', '28px'],
  xl: ['24px', '32px'],
  '2xl': ['32px', '40px'],
} as const

export const fontWeightScale = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

export const shadowScale = {
  none: 'none',
  sm: '0 1px 2px rgba(18, 21, 29, 0.08)',
  md: '0 4px 12px rgba(18, 21, 29, 0.10)',
  lg: '0 12px 32px rgba(18, 21, 29, 0.16)',
} as const

export const fontFamilyStack = [
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
]

/**
 * Master frame geometry, in CSS pixels. Layouts are designed on the 1280×720 HD
 * base and every frame renders upscaled 1.5× — 1920×1080. All spacing sits on
 * the 8pt grid; `offGridAllowed` are the only exceptions, kept for tight spacing
 * inside a component. See `src/shared/layout/frame.ts` for the rules built on it.
 */
export const frameSpec = {
  baseWidth: 1280,
  baseHeight: 720,
  upscale: 1.5,
  grid: 8,
  margin: 32,
  gutter: 16,
  offGridAllowed: [4, 12],
} as const

/**
 * Content Card height rule — Figma UI Kit "Button Tall" (2472:120292). The card's
 * height is a count of grid steps: any multiple of `frameSpec.grid`, from room
 * for its inset top and bottom up to `maxHeight`. Width is a token
 * (`dimension.size.semantic.content-card-width`); only the height varies by use.
 */
export const contentCardSpec = {
  /** The height the card ships at in Figma. */
  height: 440,
  /** The tallest a card may be. */
  maxHeight: 456,
  /** Its inset on every side — the spacing step, so the smallest card is two of these. */
  inset: 'lg',
  /**
   * Table Cell rows a tallest card's body holds under a header and a footer —
   * measured in the app on 2026-09-28, not derived: re-measure if a row, header or
   * footer token changes. The component's own JSDoc states the same numbers for
   * imported systems (held equal by catalog-storybook-parity.test.ts).
   */
  rowsAtMax: { team: 9, athlete: 12, scout: 8 },
} as const
