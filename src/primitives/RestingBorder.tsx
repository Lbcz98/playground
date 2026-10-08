/**
 * RestingBorder — the one resting stroke every interactive control draws: the
 * `gradient.semantic.border.default` gradient (Diagonal Light) as a hairline ring.
 *
 * A CSS `border` can't carry a gradient on a rounded shape, so this is a masked
 * layer with a hole (`mask-composite: exclude`). It has no pixels inside the
 * stroke, so the control's own fill, sitting behind it, composites against the
 * page and never against the gradient — an earlier version that stacked a ~30%
 * opaque fill on top of a full gradient let it bleed through the whole interior.
 *
 * Absolutely positioned: render it inside a `position: relative` control.
 */

import type { ReactNode } from 'react'
import './primitives.css'
import { token, type RadiusRole, vars } from './tokens'

export interface RestingBorderProps {
  /** The control's corner shape. */
  shape: RadiusRole
  /** Which semantic stroke width to draw. Default `button`. */
  width?: 'button' | 'card'
}

export function RestingBorder({ shape, width = 'button' }: RestingBorderProps): ReactNode {
  return (
    <span
      aria-hidden
      className="sfs-resting-border"
      style={vars({
        '--_stroke': token(`--dimension-border-width-semantic-${width}`),
        '--_radius': token(`--dimension-radius-semantic-${shape}`),
      })}
    />
  )
}
