/**
 * The original W3C Design Tokens (DTCG) JSON behind `src/styles/global.css`,
 * kept verbatim so `w3c-manifest.ts` can run it through the SAME `parseDesignTokens`
 * adapter Phase 7A built for imported Storybook design systems (`token-adapter.ts`)
 * — rather than re-deriving a second, possibly-drifting copy of these values by hand.
 */

export const W3C_TOKEN_SOURCE = {
  color: {
    core: {
      neutral: {
        white: { $value: '#EEEEEE', $type: 'color' },
        'white-alpha-0': { $value: '#EEEEEE00', $type: 'color' },
        'light-grey': { $value: '#888888', $type: 'color' },
        'medium-grey': { $value: '#3F3F3F', $type: 'color' },
        'dark-grey': { $value: '#191919', $type: 'color' },
        black: { $value: '#000000', $type: 'color' },
        'grey-mid': { $value: '#999999', $type: 'color' },
        'dark-blue-grey': { $value: '#34343C', $type: 'color' },
        charcoal: { $value: '#17161B', $type: 'color' },
        slate: { $value: '#2B313A', $type: 'color' },
      },
      primary: {
        night: {
          light: { $value: '#35C7F3', $type: 'color' },
          dark: { $value: '#414FFD', $type: 'color' },
        },
        day: {
          light: { $value: '#00E1C0', $type: 'color' },
          dark: { $value: '#00E879', $type: 'color' },
        },
        evening: {
          light: { $value: '#E7C300', $type: 'color' },
          dark: { $value: '#ED6001', $type: 'color' },
        },
      },
      complementary: {
        error: { $value: '#DE2C2C', $type: 'color' },
        confirmation: { $value: '#11BB0E', $type: 'color' },
        alert: { $value: '#FFA90A', $type: 'color' },
        live: { $value: '#FD4142', $type: 'color' },
      },
    },
    opacity: {
      background: { $value: '#191F274D', $type: 'color' },
      'base-rounded': { $value: '#2B313A33', $type: 'color' },
      dark: {
        '10': { $value: '#0000001A', $type: 'color' },
        '20': { $value: '#00000033', $type: 'color' },
        '30': { $value: '#0000004D', $type: 'color' },
        '50': { $value: '#00000080', $type: 'color' },
        '70': { $value: '#000000B3', $type: 'color' },
      },
      light: {
        '10': { $value: '#FFFFFF1A', $type: 'color' },
        '20': { $value: '#FFFFFF33', $type: 'color' },
        '30': { $value: '#FFFFFF4D', $type: 'color' },
        '50': { $value: '#FFFFFF80', $type: 'color' },
        '70': { $value: '#FFFFFFB3', $type: 'color' },
      },
    },
    semantic: {
      theme: {
        'day-dark': { $value: '{color.core.primary.night.dark}', $type: 'color' },
        'day-light': { $value: '{color.core.primary.night.light}', $type: 'color' },
        'evening-dark': { $value: '{color.core.primary.day.dark}', $type: 'color' },
        'evening-light': { $value: '{color.core.primary.day.light}', $type: 'color' },
        'night-dark': { $value: '{color.core.primary.evening.dark}', $type: 'color' },
        'night-light': { $value: '{color.core.primary.evening.light}', $type: 'color' },
      },
      functional: {
        'background-primary': { $value: '{color.core.neutral.dark-grey}', $type: 'color' },
        'background-elevated': { $value: '{color.core.neutral.medium-grey}', $type: 'color' },
        'background-overlay': { $value: '{color.opacity.base-rounded}', $type: 'color' },
        'text-primary': { $value: '{color.core.neutral.white}', $type: 'color' },
        'text-secondary': { $value: '{color.core.neutral.light-grey}', $type: 'color' },
        'text-inverse': { $value: '{color.core.neutral.black}', $type: 'color' },
        'border-subtle': { $value: '{color.opacity.light.10}', $type: 'color' },
        'border-default': { $value: '{color.opacity.light.20}', $type: 'color' },
        'status-error': { $value: '{color.core.complementary.error}', $type: 'color' },
        'status-success': { $value: '{color.core.complementary.confirmation}', $type: 'color' },
        'status-warning': { $value: '{color.core.complementary.alert}', $type: 'color' },
        'status-live': { $value: '{color.core.complementary.live}', $type: 'color' },
      },
    },
  },
  gradient: {
    primary: {
      night: {
        $type: 'gradient',
        $value: [
          { color: '{color.core.primary.night.dark}', position: 0.3 },
          { color: '{color.core.primary.night.light}', position: 1 },
        ],
      },
      day: {
        $type: 'gradient',
        $value: [
          { color: '{color.core.primary.day.dark}', position: 0.3 },
          { color: '{color.core.primary.day.light}', position: 1 },
        ],
      },
      evening: {
        $type: 'gradient',
        $value: [
          { color: '{color.core.primary.evening.dark}', position: 0.3 },
          { color: '{color.core.primary.evening.light}', position: 1 },
        ],
      },
    },
    inverse: {
      night: {
        $type: 'gradient',
        $value: [
          { color: '{color.core.primary.night.light}', position: 0 },
          { color: '{color.core.primary.night.dark}', position: 0.7 },
        ],
      },
      day: {
        $type: 'gradient',
        $value: [
          { color: '{color.core.primary.day.light}', position: 0 },
          { color: '{color.core.primary.day.dark}', position: 1 },
        ],
      },
      evening: {
        $type: 'gradient',
        $value: [
          { color: '{color.core.primary.evening.light}', position: 0 },
          { color: '{color.core.primary.evening.dark}', position: 0.7 },
        ],
      },
    },
    complementary: {
      shiny: {
        $type: 'gradient',
        $value: [
          { color: '{color.core.neutral.grey-mid}', position: 0 },
          { color: '{color.core.neutral.white}', position: 1 },
        ],
      },
      'diagonal-light': {
        $type: 'gradient',
        $value: [
          { color: '{color.opacity.light.70}', position: 0 },
          { color: '{color.opacity.dark.30}', position: 0.6 },
        ],
      },
      'linear-light': {
        $type: 'gradient',
        $value: [
          { color: '{color.core.neutral.white}', position: 0 },
          { color: '{color.core.neutral.white-alpha-0}', position: 1 },
        ],
      },
      dark: {
        $type: 'gradient',
        $value: [
          { color: '{color.core.neutral.dark-blue-grey}', position: 0 },
          { color: '{color.core.neutral.charcoal}', position: 1 },
        ],
      },
      live: {
        $type: 'gradient',
        $value: [
          { color: '{color.core.complementary.live}', position: 0 },
          { color: '{color.core.complementary.error}', position: 0.7 },
        ],
      },
    },
  },
  dimension: {
    radius: {
      core: {
        none: { $value: '0px', $type: 'dimension' },
        xs: { $value: '4px', $type: 'dimension' },
        sm: { $value: '8px', $type: 'dimension' },
        md: { $value: '12px', $type: 'dimension' },
        lg: { $value: '16px', $type: 'dimension' },
        xl: { $value: '20px', $type: 'dimension' },
        '2xl': { $value: '24px', $type: 'dimension' },
        '3xl': { $value: '28px', $type: 'dimension' },
        '4xl': { $value: '32px', $type: 'dimension' },
        '5xl': { $value: '36px', $type: 'dimension' },
        '6xl': { $value: '40px', $type: 'dimension' },
        '7xl': { $value: '48px', $type: 'dimension' },
        '8xl': { $value: '56px', $type: 'dimension' },
        '9xl': { $value: '64px', $type: 'dimension' },
        '10xl': { $value: '88px', $type: 'dimension' },
        full: { $value: '100px', $type: 'dimension' },
      },
    },
    spacing: {
      core: {
        none: { $value: '0px', $type: 'dimension' },
        '3xs': { $value: '4px', $type: 'dimension' },
        '2xs': { $value: '8px', $type: 'dimension' },
        xs: { $value: '12px', $type: 'dimension' },
        sm: { $value: '16px', $type: 'dimension' },
        md: { $value: '20px', $type: 'dimension' },
        lg: { $value: '24px', $type: 'dimension' },
        xl: { $value: '32px', $type: 'dimension' },
        '2xl': { $value: '40px', $type: 'dimension' },
        '3xl': { $value: '48px', $type: 'dimension' },
        '4xl': { $value: '64px', $type: 'dimension' },
        '5xl': { $value: '80px', $type: 'dimension' },
        '6xl': { $value: '96px', $type: 'dimension' },
      },
    },
  },
  typography: {
    fontFamily: {
      primary: { $value: 'Inter', $type: 'fontFamily' },
    },
    fontWeight: {
      regular: { $value: 400, $type: 'fontWeight' },
      medium: { $value: 500, $type: 'fontWeight' },
      bold: { $value: 700, $type: 'fontWeight' },
      'extra-bold': { $value: 800, $type: 'fontWeight' },
    },
    fontSize: {
      xs: { $value: '10px', $type: 'dimension' },
      sm: { $value: '12px', $type: 'dimension' },
      md: { $value: '14px', $type: 'dimension' },
      base: { $value: '16px', $type: 'dimension' },
      lg: { $value: '18px', $type: 'dimension' },
      xl: { $value: '20px', $type: 'dimension' },
      '2xl': { $value: '24px', $type: 'dimension' },
      '3xl': { $value: '28px', $type: 'dimension' },
    },
    letterSpacing: {
      tight: { $value: '-0.01em', $type: 'dimension' },
      tighter: { $value: '-0.02em', $type: 'dimension' },
    },
    lineHeight: {
      tight: { $value: 1.1, $type: 'number' },
      normal: { $value: 1.2, $type: 'number' },
    },
  },
} as const
