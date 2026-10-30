/**
 * Alert Bug — Figma UI Kit node 2033:4126.
 *
 * The bug that tells the viewer there is something interactive waiting, sitting
 * in the bottom-right corner of the clean broadcast. It is the whole of a nível 0
 * screen: no menu, no rail, just the picture and this.
 *
 * Two styles, and they are not decoration: `interface` is the product's own bug,
 * the one the kit draws and focus can reach; `transmission` is the broadcaster's
 * mark, laid over the picture by the transmission itself, larger and never
 * focusable.
 *
 * The mark is artwork, not kit chrome, so it arrives as `src`, the way the main
 * menu takes its avatar and channel bug; a neutral circle stands in when there is
 * none.
 *
 * `motion` is the bug's own entrance: the mark fades and scales up, the ring of
 * the focus ring (a halo, spinning for as long as the bug is on screen) opens
 * around it, and "Conteúdo interativo" rises from behind the mark. It stays 8s
 * and leaves the same way backwards. The motion is CSS only — transform and
 * opacity — so it runs on Chrome 68 and Safari 16. Without `motion` the bug is
 * the still mark, as before.
 *
 * Where it sits is `AlertBugAnchor`: the margins are measured from the Globo's
 * mark (the sphere), not from the halo or the text around it.
 */

import { useEffect, useState } from 'react'
import type { AnimationEvent, CSSProperties, ReactNode } from 'react'
import { FocusRing, spacing, token, type InteractionState } from '@/primitives'
import './ui-kit.css'

export type AlertBugStyle = 'interface' | 'transmission'
/**
 * `enter` plays the 800ms entrance and stays; `stay` is the settled composition;
 * `exit` plays the 800ms exit; `cycle` is entrance → 8s → exit, on its own.
 */
export type AlertBugMotion = 'enter' | 'stay' | 'exit' | 'cycle'
type AlertBugState = Extract<InteractionState, 'default' | 'focus'>

const MARK = token('--dimension-size-semantic-alert-bug-mark')
const HALO = token('--dimension-size-semantic-alert-bug-halo')
const RING = token('--dimension-border-width-semantic-focus-ring')
const BETWEEN = `(${HALO} - ${MARK}) / 2`

/**
 * What the motion reads. The easing is the kit's spring (damping 15, stiffness 56) as a
 * cubic-bezier, because `linear()` needs Chrome 113; the stay is 8s; the halo is born at
 * 0.8 of its size, which is the mark's (82 of 102).
 */
const MOTION_VARS = {
  '--_alert-bug-duration': token('--motion-semantic-duration'),
  '--_alert-bug-ease': 'cubic-bezier(0.19, 0.06, 0.24, 1)',
  '--_alert-bug-stay': '8000ms',
  '--_alert-bug-from-scale': '0.9',
  '--_alert-bug-out-scale': '0.9',
  '--_alert-bug-mark': MARK,
  '--_alert-bug-halo': HALO,
  '--_alert-bug-ring-width': RING,
  '--_alert-bug-ring-gap': `calc(${BETWEEN} - ${RING})`,
  '--_alert-bug-halo-from': '0.8',
  '--_alert-bug-text-rise': spacing('4xl'),
  '--_alert-bug-text-gap': `calc(${BETWEEN} + ${spacing('2xs')})`,
  '--_alert-bug-spin': token('--motion-semantic-focus-cycle-duration'),
} as CSSProperties

interface AlertBugProps {
  /** Whose mark this is. Default `interface`. */
  bugStyle?: AlertBugStyle
  /** Only the interface bug takes focus. Default `default`. */
  interactionState?: AlertBugState
  /** The mark itself. A neutral circle stands in when there is none. */
  src?: string
  /** Accessible name — the bug is artwork-only. */
  label?: string
  /** Adds the halo and the text and plays the entrance and exit. Without it the bug is still. */
  motion?: AlertBugMotion
  /** Dissolve only, with no scale, rise or spin — what the viewer asked their system for. The media query does the same on its own. */
  reducedMotion?: boolean
  /** The exit has finished (`exit`, or the end of a `cycle`); the bug is no longer drawn. */
  onExited?: () => void
  onClick?: () => void
}

/** The corner bug that says an interactivity is waiting — the kit’s own (`interface`, focusable) or the broadcaster’s (`transmission`). */
export function AlertBug({
  bugStyle = 'interface',
  interactionState,
  src,
  label = 'Conteúdo interativo',
  motion,
  reducedMotion = false,
  onExited,
  onClick,
}: AlertBugProps): ReactNode {
  const focus = (interactionState ?? 'default') === 'focus' && bugStyle === 'interface'
  const [exited, setExited] = useState(false)

  // A new motion plays again from the start.
  useEffect(() => setExited(false), [motion])

  function handleAnimationEnd(event: AnimationEvent<HTMLElement>): void {
    if (event.target !== event.currentTarget) return
    if (event.animationName.indexOf('-out-') === -1) return
    setExited(true)
    onExited?.()
  }

  return (
    <button
      type="button"
      className="sfs-alert-bug sfs-motion sfs-focusable"
      data-style={bugStyle}
      data-state={focus ? 'focus' : 'default'}
      data-motion={exited ? 'exited' : motion}
      data-reduced={reducedMotion ? '' : undefined}
      style={motion ? MOTION_VARS : undefined}
      aria-label={label}
      onClick={onClick}
    >
      {motion ? (
        <>
          <span className="sfs-alert-bug-text text-body-md-bold" aria-hidden>
            Conteúdo
            <br />
            interativo
          </span>
          <span className="sfs-alert-bug-halo" aria-hidden>
            <span className="sfs-alert-bug-halo-grow">
              <span className="sfs-alert-bug-halo-spin" />
            </span>
          </span>
        </>
      ) : null}
      <span className="sfs-alert-bug-circle" onAnimationEnd={handleAnimationEnd}>
        {focus ? <FocusRing shape="pill" /> : null}
        {src ? (
          <img src={src} alt="" className="sfs-alert-bug-mark" />
        ) : (
          <span className="sfs-alert-bug-mark" data-empty="" />
        )}
      </span>
    </button>
  )
}

interface AlertBugAnchorProps {
  children: ReactNode
}

/**
 * Where the alert bug sits on the picture: over the Globo's own mark, in the
 * bottom-right corner. The margins are the sphere's edge to the screen's edge —
 * 118 px to the right and 56 px to the bottom on a 1920×1080 frame — held as
 * percentages (6.1458% and 5.1852%) so they follow the frame (79 px and 37 px at
 * 1280×720, the kit's own frame). The sphere is 82 px there (124 px at 1920×1080) and the
 * halo 102 px (152 px). The halo and the text hang outside the sphere and do not move it.
 *
 * It fills its nearest positioned ancestor, which has to be the whole 16:9
 * frame. Stack it above the screen's `ScreenOverlay model="alert"`, which is
 * the bottom-right shade that keeps the bug legible over the picture.
 */
export function AlertBugAnchor({ children }: AlertBugAnchorProps): ReactNode {
  return (
    <div className="sfs-alert-bug-anchor">
      <div className="sfs-alert-bug-anchor-spot">{children}</div>
    </div>
  )
}
