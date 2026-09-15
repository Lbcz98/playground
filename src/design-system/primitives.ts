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

/** Spacing / gap / padding scale. Named steps only — no numeric ladder. */
export const spacingScale = {
  none: '0px',
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
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
