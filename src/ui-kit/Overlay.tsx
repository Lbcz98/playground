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

import type { ReactNode } from 'react'
import { DTV_SCREEN_LAYERS, screenModel } from '@/shared/design-system/screen-layers'
import './ui-kit.css'

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

interface OverlayProps {
  /** The edge the content sits on. Default `bottom`. */
  direction?: OverlayDirection
}

export function Overlay({ direction = 'bottom' }: OverlayProps): ReactNode {
  // Scrim and shade per direction are in ui-kit.css (`data-overlay`).
  return <div aria-hidden className="sfs-overlay" data-overlay={direction} />
}

/**
 * CardScrim — the card-level scrim (DESIGN.md section 5.4). A shade that fades
 * the artwork on a card into the card's own background at the edge where the
 * text sits, so text over an image stays legible. It is the one gradient a
 * card draws over its image: `--gradient-semantic-card-scrim`, charcoal at the
 * text edge to transparent.
 *
 * It fills its nearest positioned ancestor, which is the image's box, and never
 * takes pointer events. Use it only when text or a label sits on the image.
 */
export function CardScrim(): ReactNode {
  return <div aria-hidden className="sfs-card-scrim" />
}

/** Every DTV screen model, in the order of the Figma Modelos table's levels. */
export const SCREEN_MODEL_IDS: readonly string[] = DTV_SCREEN_LAYERS.models.map((model) => model.id)

interface ScreenOverlayProps {
  /** A layer model id, e.g. `home` or `interactivity-cards-right`. */
  model: string
}

export function ScreenOverlay({ model }: ScreenOverlayProps): ReactNode {
  const found = screenModel(DTV_SCREEN_LAYERS, model)
  if (!found) return null
  return (
    <div aria-hidden className="sfs-screen-overlay" data-screen-model={found.id}>
      {found.shades.map((shade) => (
        <div key={shade} className="sfs-screen-overlay-shade" data-shade={shade} />
      ))}
    </div>
  )
}
