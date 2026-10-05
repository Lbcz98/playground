/**
 * Screen — the 1280×720 DTV frame as a kit component.
 *
 * The layer rule (Camadas) in one element, bottom to top: video → overlay →
 * content. The overlay is never free-form: `model` names one of the screen
 * models (`SCREEN_MODEL_IDS`) and the frame paints that model's shades. The
 * content layer is transparent, so the video and the shades show through.
 *
 * The frame owns the safe-area margin and the gutter: the root of the content
 * adds none, and the modules inside sit one gutter apart. One group may be
 * `anchored` — the floating action area (a Back button, a widget cluster) —
 * and the frame pins it to the bottom corner on the side the TV focus is on.
 *
 * It is the same frame the canvas draws (`ScreenFrame` in `src/canvas`), but
 * composed from JSX children instead of a node tree, and built only from the
 * token helpers, so a screen exported from the canvas — or written by hand —
 * drops into any app that already uses the kit.
 *
 * The `data-screen-*` attributes are the contract the layout checks read off the
 * rendered screen (`renderAudit`, `focusReading`); keep them.
 */

import type { CSSProperties, ReactNode } from 'react'
import { spacing } from '@/primitives'
import { frameSpec } from '@/design-system/primitives'
import { ScreenOverlay } from './Overlay'

/** The navigation level of the screen (Camadas): 0 clean broadcast, 1 home, 2 rail, 3 one interactivity. */
export type ScreenLevel = 0 | 1 | 2 | 3

/** The side of the frame the TV focus is on. It decides the anchored group's corner. */
export type ScreenFocusSide = 'left' | 'right'

export interface ScreenProps {
  /** The layer model whose shades sit between the video and the content, e.g. `home`. */
  model: string
  /** The navigation level. Descriptive: the model fixes it, and checks read it off the screen. */
  level?: ScreenLevel
  /** Where the TV focus is. Default `right`: the anchored group pins bottom-right. */
  focusSide?: ScreenFocusSide
  /** The anchored element group, pinned to the bottom corner on the focus side. */
  anchored?: ReactNode
  /** What stands in for the video behind the shades. Default: nothing, so the real video shows through. */
  video?: ReactNode
  /** How the frame is shown; the layout itself is always 1280×720. 1.5 shows it at 1920×1080. Default 1. */
  scale?: number
  /** The content: a root layout container, with no margin of its own. */
  children?: ReactNode
}

const fill: CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none' }

/** The 1280×720 DTV frame every screen is built in: video, overlay shades, then a transparent content layer. */
export function Screen({
  model,
  level,
  focusSide = 'right',
  anchored,
  video,
  scale = 1,
  children,
}: ScreenProps): ReactNode {
  const frame: CSSProperties = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing('sm'),
    boxSizing: 'border-box',
    width: frameSpec.baseWidth,
    height: frameSpec.baseHeight,
    padding: spacing('xl'),
    overflow: 'hidden',
    transformOrigin: scale === 1 ? undefined : 'top left',
    transform: scale === 1 ? undefined : `scale(${scale})`,
  }
  const zone = focusSide === 'left' ? 'bottom-left' : 'bottom-right'

  return (
    <div data-screen-layer="video" data-screen-level={level} data-focus={focusSide} style={frame}>
      {video ? <div style={fill}>{video}</div> : null}
      <div aria-hidden data-screen-layer="overlay" style={fill}>
        <ScreenOverlay model={model} />
      </div>
      <div
        data-screen-layer="content"
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gridTemplateRows: 'minmax(0, 1fr)',
          flex: 1,
          minHeight: 0,
        }}
      >
        {children}
      </div>
      {anchored ? (
        <div
          data-anchor-zone={zone}
          style={{
            position: 'relative',
            display: 'flex',
            gap: spacing('sm'),
            justifyContent: zone === 'bottom-left' ? 'flex-start' : 'flex-end',
          }}
        >
          {anchored}
        </div>
      ) : null}
    </div>
  )
}
