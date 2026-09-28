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

import type { CSSProperties, ReactNode } from 'react'
import {
  FocusRing,
  size,
  token,
  type InteractionState,
} from '@/primitives'

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

const PILL = token('--dimension-radius-semantic-pill')

/** The hit target is the transmission bug's edge, so neither style shifts the layout. */
const root: CSSProperties = {
  position: 'relative',
  width: size('alert-bug-transmission'),
  height: size('alert-bug-transmission'),
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
}

function edgeFor(bugStyle: AlertBugStyle, focus: boolean): string {
  if (bugStyle === 'transmission') return size('alert-bug-transmission')
  return focus ? size('alert-bug-focus') : size('alert-bug')
}

/** The corner bug that says an interactivity is waiting — the kit’s own (`interface`, focusable) or the broadcaster’s (`transmission`). */
export function AlertBug({
  bugStyle = 'interface',
  interactionState,
  src,
  label = 'Conteúdo interativo',
  onClick,
}: AlertBugProps): ReactNode {
  const state = (interactionState ?? 'default')
  const focus = state === 'focus' && bugStyle === 'interface'
  const edge = edgeFor(bugStyle, focus)
  const circle: CSSProperties = {
    position: 'relative',
    width: edge,
    height: edge,
    borderRadius: PILL,
    overflow: 'hidden',
    display: 'grid',
    placeItems: 'center',
  }

  return (
    <button type="button" className="sfs-motion" aria-label={label} onClick={onClick} style={root}>
      <span style={circle}>
        {focus ? <FocusRing shape="pill" /> : null}
        {src ? (
          <img src={src} alt="" style={{ width: edge, height: edge, borderRadius: PILL, objectFit: 'cover', display: 'block' }} />
        ) : (
          <span
            style={{
              width: edge,
              height: edge,
              borderRadius: PILL,
              backgroundColor: token('--color-semantic-functional-background-elevated'),
              display: 'block',
            }}
          />
        )}
      </span>
    </button>
  )
}
