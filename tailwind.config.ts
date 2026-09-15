import type { Config } from 'tailwindcss'
import {
  palette,
  spacingScale,
  radiusScale,
  fontSizeScale,
  fontWeightScale,
  shadowScale,
  fontFamilyStack,
  frameSpec,
} from './src/design-system/primitives'

/**
 * The theme is *replaced*, not extended. Only these tokens produce classes, so a
 * value like `p-[10px]` or `bg-[#ff0000]` cannot resolve. Arbitrary-value syntax is
 * additionally blocked at lint time by `scripts/check-tokens.mjs`.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  corePlugins: {
    // No absolute positioning on the canvas — layout is Stack (flex) only.
    float: false,
    clear: false,
  },
  theme: {
    colors: {
      transparent: palette.transparent,
      current: palette.current,
      page: palette.gray[100],
      surface: palette.white,
      subtle: palette.gray[50],
      line: palette.gray[200],
      'line-strong': palette.gray[300],
      ink: palette.gray[900],
      'ink-muted': palette.gray[500],
      'ink-inverse': palette.white,
      brand: palette.blue[500],
      'brand-hover': palette.blue[600],
      'brand-subtle': palette.blue[100],
      'brand-strong': palette.blue[700],
      danger: palette.red[500],
      'danger-hover': palette.red[600],
      'danger-subtle': palette.red[100],
      success: palette.green[500],
      'success-subtle': palette.green[100],
    },
    spacing: { ...spacingScale },
    borderRadius: { ...radiusScale },
    fontSize: Object.fromEntries(
      Object.entries(fontSizeScale).map(([key, [size, lineHeight]]) => [
        key,
        [size, lineHeight] as [string, string],
      ]),
    ),
    fontWeight: { ...fontWeightScale },
    boxShadow: { ...shadowScale },
    fontFamily: {
      sans: fontFamilyStack,
      mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
    },
    extend: {
      ringWidth: {
        DEFAULT: '2px',
      },
      ringColor: {
        DEFAULT: palette.blue[500],
      },
      // The canvas stage's master frame (app chrome, not user content).
      width: {
        'panel-sm': '260px',
        'panel-md': '320px',
        'panel-lg': '360px',
        // The canvas frame is always laid out on the HD base; upscaling is a transform.
        frame: `${frameSpec.baseWidth}px`,
      },
      height: {
        frame: `${frameSpec.baseHeight}px`,
      },
      padding: {
        'frame-margin': `${frameSpec.margin}px`,
      },
      gap: {
        'frame-gutter': `${frameSpec.gutter}px`,
      },
      maxHeight: {
        trace: '200px',
        inspector: '300px',
      },
    },
  },
  plugins: [],
} satisfies Config
