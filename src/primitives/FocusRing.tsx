/**
 * FocusRing — the one focus treatment every focusable control draws.
 *
 * Standardised on WideButton's recipe: the focus-ring gradient as a frame, an
 * inner fill that fades up from the bottom, and a glow pooling up from the
 * bottom edge across the whole inner area. Every value is a semantic token,
 * so restyling focus across the kit is a tokens.json change.
 *
 * It also moves. The ring and its glow walk the primary ramps — noite → dia →
 * tarde → dia — over `motion.semantic.focus-cycle`, and because that is the one
 * focus treatment, every focusable control in the kit inherits the same motion
 * without knowing about it. The keyframes live in `primitives.css`; the inline
 * gradients below stay as the resting state underneath them, which is what a
 * reduced-motion viewer and the visual-regression freeze both see.
 *
 * Absolutely positioned: render it as the first child of a `position: relative`
 * control and layer the control's content above it.
 */

import type { CSSProperties, ReactNode } from 'react'
import { size, token, type RadiusRole } from './tokens'
import './primitives.css'

export interface FocusRingProps {
  /** The control's corner shape. The inner fill follows it, less the ring width. */
  shape: RadiusRole
}

const RING_WIDTH = token('--dimension-border-width-semantic-focus-ring')

const frame: CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  backgroundImage: token('--gradient-semantic-focus-ring'),
}

const inner: CSSProperties = {
  position: 'absolute',
  inset: RING_WIDTH,
  overflow: 'hidden',
  backgroundColor: token('--color-semantic-focus-inset'),
  backgroundImage: `linear-gradient(0deg, ${token('--color-semantic-focus-inset-fade')} 0%, transparent 100%)`,
}

const glow: CSSProperties = {
  position: 'absolute',
  inset: 0,
  opacity: token('--opacity-semantic-focus-glow'),
  backgroundImage:
    `radial-gradient(ellipse at 50% 100%, ${token('--color-semantic-focus-glow')} 0%, ` +
    `transparent ${size('focus-glow')})`,
}

export function FocusRing({ shape }: FocusRingProps): ReactNode {
  const outer = token(`--dimension-radius-semantic-${shape}`)
  return (
    <span aria-hidden className="sfs-focus-cycle" style={{ ...frame, borderRadius: outer }}>
      <span style={{ ...inner, borderRadius: `calc(${outer} - ${RING_WIDTH})` }}>
        <span className="sfs-focus-glow-cycle" style={glow} />
      </span>
    </span>
  )
}

/**
 * The focus treatment for content that fills its own hit target (the channel
 * bug's logo), where an inset ring would cover the content: the same ring width
 * moved outside as a CSS `outline`, `focus-offset` away from the edge. Spread it
 * onto the control's style, and give the control a border-radius so the outline
 * follows its shape.
 */
export const focusOutline: CSSProperties = {
  outline: `${RING_WIDTH} solid ${token('--color-semantic-focus-outline')}`,
  outlineOffset: token('--dimension-spacing-semantic-focus-offset'),
}
