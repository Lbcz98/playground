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
 * none. Figma also carries a `Motion` variant — the bug's pulse — which is a
 * motion spec, not a state, and is left to the app.
 */

import type { ReactNode } from 'react'
import { FocusRing, type InteractionState } from '@/primitives'
import './ui-kit.css'

export type AlertBugStyle = 'interface' | 'transmission'
export type AlertBugState = Extract<InteractionState, 'default' | 'focus'>

export interface AlertBugProps {
  /** Whose mark this is. Default `interface`. */
  bugStyle?: AlertBugStyle
  /** Only the interface bug takes focus. Default `default`. */
  interactionState?: AlertBugState
  /** The mark itself. A neutral circle stands in when there is none. */
  src?: string
  /** Accessible name — the bug is artwork-only. */
  label?: string
  onClick?: () => void
}

/** The corner bug that says an interactivity is waiting — the kit’s own (`interface`, focusable) or the broadcaster’s (`transmission`). */
export function AlertBug({
  bugStyle = 'interface',
  interactionState,
  src,
  label = 'Conteúdo interativo',
  onClick,
}: AlertBugProps): ReactNode {
  const focus = (interactionState ?? 'default') === 'focus' && bugStyle === 'interface'

  return (
    <button
      type="button"
      className="sfs-alert-bug sfs-motion sfs-focusable"
      data-style={bugStyle}
      data-state={focus ? 'focus' : 'default'}
      aria-label={label}
      onClick={onClick}
    >
      <span className="sfs-alert-bug-circle">
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
