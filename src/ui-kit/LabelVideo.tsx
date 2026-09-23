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

import type { CSSProperties, ReactNode } from 'react'
import {
  fromFocusFlag,
  resolveInteractionState,
  size,
  spacing,
  textClass,
  token,
  type InteractionState,
} from '@/primitives'
import volumeOnIcon from './icons/volume-on.svg'

export type LabelVideoKind = 'live' | 'replay'

export interface LabelVideoProps {
  /** `live` says AO VIVO, `replay` says REPLAY. */
  kind?: LabelVideoKind
  /** Focused: gradient fill with the volume icon. Default: translucent chip. Default `focus`. */
  interactionState?: Extract<InteractionState, 'default' | 'focus'>
  /** @deprecated Use `interactionState` (`focus` or `default`). */
  focus?: boolean
  /** Compact chip — live only, no icon. */
  mini?: boolean
}

const LABEL: Record<LabelVideoKind, string> = {
  live: 'AO VIVO',
  replay: 'REPLAY',
}

const base: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingInline: spacing('2xs'),
  paddingBlock: spacing('3xs'),
  borderRadius: token('--dimension-radius-semantic-pill'),
  color: token('--color-semantic-functional-text-primary'),
  whiteSpace: 'nowrap',
}

function fillFor(kind: LabelVideoKind, focus: boolean): CSSProperties {
  if (!focus) return { backgroundColor: token('--color-semantic-functional-background-tint') }
  return kind === 'live'
    ? { backgroundImage: token('--gradient-semantic-status-live') }
    : { backgroundImage: token('--gradient-semantic-status-replay') }
}

/** The AO VIVO / REPLAY chip that says what the video behind the screen is. */
export function LabelVideo({
  kind = 'live',
  interactionState,
  focus: legacyFocus,
  mini = false,
}: LabelVideoProps): ReactNode {
  const focus =
    resolveInteractionState(
      'ui-kit/LabelVideo',
      interactionState,
      { prop: 'focus', value: fromFocusFlag(legacyFocus) },
      'focus',
    ) === 'focus'
  const compact = mini && kind === 'live'
  const showIcon = focus && !compact

  return (
    <span
      className={textClass(compact ? 'caption-extra-bold' : 'body-sm-extra-bold')}
      style={{
        ...base,
        ...fillFor(kind, focus),
        gap: spacing(showIcon ? '2xs' : '3xs'),
      }}
    >
      {showIcon && (
        <img
          src={volumeOnIcon}
          alt=""
          style={{ width: size('icon-sm'), height: size('icon-sm'), flexShrink: 0, display: 'block' }}
        />
      )}
      {LABEL[kind]}
    </span>
  )
}
