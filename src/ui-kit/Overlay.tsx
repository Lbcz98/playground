/**
 * Overlay — Figma UI Kit node 3730:7871 ("Overlays", page Camadas e profundidade).
 *
 * The black shade that keeps content legible over video or imagery. A direction
 * names the edge the content sits on; its shade darkens that side. Every direction
 * lays the scrim (`color.semantic.overlay.scrim`, 10% black) under its shade, the
 * way the Figma variants stack their layers — except `top-right`, the notification
 * overlay, which is the shade alone. `base` is the scrim alone.
 *
 * It fills its nearest positioned ancestor and never takes pointer events, so a
 * template stacks it between the background and the content:
 * background → Overlay → content.
 */

import type { CSSProperties, ReactNode } from 'react'
import { token, type SemanticVar } from '@/primitives'

export type OverlayDirection =
  | 'base'
  | 'bottom'
  | 'left'
  | 'right'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'

export const OVERLAY_DIRECTIONS: readonly OverlayDirection[] = [
  'base',
  'bottom',
  'left',
  'right',
  'bottom-right',
  'bottom-left',
  'top-right',
]

export interface OverlayProps {
  /** The edge the content sits on. Default `bottom`. */
  direction?: OverlayDirection
}

const SHADE: Record<Exclude<OverlayDirection, 'base'>, SemanticVar> = {
  bottom: '--gradient-semantic-overlay-bottom',
  left: '--gradient-semantic-overlay-left',
  right: '--gradient-semantic-overlay-right',
  'bottom-right': '--gradient-semantic-overlay-bottom-right',
  'bottom-left': '--gradient-semantic-overlay-bottom-left',
  'top-right': '--gradient-semantic-overlay-top-right',
}

/** The notification overlay has no scrim in Figma (its base layer is hidden). */
const WITHOUT_SCRIM: ReadonlySet<OverlayDirection> = new Set(['top-right'])

const fill: CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
}

export function Overlay({ direction = 'bottom' }: OverlayProps): ReactNode {
  return (
    <div
      aria-hidden
      data-overlay={direction}
      style={{
        ...fill,
        // A background colour paints under the background image: scrim, then shade.
        backgroundColor: WITHOUT_SCRIM.has(direction) ? undefined : token('--color-semantic-overlay-scrim'),
        backgroundImage: direction === 'base' ? undefined : token(SHADE[direction]),
      }}
    />
  )
}
