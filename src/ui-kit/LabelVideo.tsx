/**
 * Label-Video — Figma UI Kit node 2033:4528.
 *
 * The status pill that sits on a card: AO VIVO or REPLAY, focused (gradient fill
 * + volume icon) or resting (translucent). `mini` is the compact AO VIVO chip the
 * small card uses.
 *
 * Figma pins each variant to a hug-content width; those are left to the content
 * here so the pill sizes itself from its own padding and label.
 */

import type { ReactNode } from 'react'
import { textClass, type InteractionState } from '@/primitives'
import volumeOnIcon from './icons/volume-on.svg'
import './ui-kit.css'

export type LabelVideoKind = 'live' | 'replay'

export interface LabelVideoProps {
  /** `live` says AO VIVO, `replay` says REPLAY. */
  kind?: LabelVideoKind
  /** Focused: gradient fill with the volume icon. Default: translucent chip. Default `focus`. */
  interactionState?: Extract<InteractionState, 'default' | 'focus'>
  /** Compact chip — live only, no icon. */
  mini?: boolean
}

const LABEL: Record<LabelVideoKind, string> = {
  live: 'AO VIVO',
  replay: 'REPLAY',
}

/** The AO VIVO / REPLAY chip that says what the video behind the screen is. */
export function LabelVideo({
  kind = 'live',
  interactionState,
  mini = false,
}: LabelVideoProps): ReactNode {
  const state = interactionState ?? 'focus'
  const compact = mini && kind === 'live'
  const showIcon = state === 'focus' && !compact

  return (
    <span
      className={`sfs-label-video ${textClass(compact ? 'caption-extra-bold' : 'body-sm-extra-bold')} sfs-motion`}
      data-kind={kind}
      data-state={state}
      data-mini={compact ? '' : undefined}
    >
      {showIcon && <img src={volumeOnIcon} alt="" className="sfs-label-video-icon" />}
      {LABEL[kind]}
    </span>
  )
}
