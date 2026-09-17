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
 *
 * `ScreenOverlay` is the layer rule (Camadas) in one element: a whole screen
 * model's combination of shades (`shared/design-system/screen-layers.ts`, Figma
 * page "Overlay" → Modelos), each piece the same token `Overlay` uses. A screen
 * uses exactly one of them.
 */

import type { CSSProperties, ReactNode } from 'react'
import { token, type SemanticVar } from '@/primitives'
import type { ShadeId } from '@/shared/design-system/manifest'
import { DTV_SCREEN_LAYERS, screenModel } from '@/shared/design-system/screen-layers'

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

/** Every DTV screen model, in the order of the Figma Modelos table's levels. */
export const SCREEN_MODEL_IDS: readonly string[] = DTV_SCREEN_LAYERS.models.map((model) => model.id)

export interface ScreenOverlayProps {
  /** A layer model id, e.g. `home` or `interactivity-cards-right`. */
  model: string
}

function shadeStyle(shade: ShadeId): CSSProperties {
  return shade === 'scrim'
    ? { ...fill, backgroundColor: token('--color-semantic-overlay-scrim') }
    : { ...fill, backgroundImage: token(SHADE[shade]) }
}

export function ScreenOverlay({ model }: ScreenOverlayProps): ReactNode {
  const found = screenModel(DTV_SCREEN_LAYERS, model)
  if (!found) return null
  return (
    <div aria-hidden data-screen-model={found.id} style={fill}>
      {found.shades.map((shade) => (
        <div key={shade} data-shade={shade} style={shadeStyle(shade)} />
      ))}
    </div>
  )
}
