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
import volumeOnIcon from './icons/volume-on.svg'

export type LabelVideoKind = 'live' | 'replay'

export interface LabelVideoProps {
  kind?: LabelVideoKind
  /** Focused: gradient fill with the volume icon. Resting: translucent chip. */
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
  paddingInline: 'var(--dimension-spacing-core-2xs)',
  paddingBlock: 'var(--dimension-spacing-core-3xs)',
  borderRadius: 'var(--dimension-radius-core-full)',
  color: 'var(--color-semantic-functional-text-primary)',
  whiteSpace: 'nowrap',
}

function fillFor(kind: LabelVideoKind, focus: boolean): CSSProperties {
  if (!focus) return { backgroundColor: 'var(--color-opacity-light-10)' }
  return kind === 'live'
    ? { backgroundImage: 'var(--gradient-complementary-live)' }
    : { backgroundImage: 'var(--gradient-inverse-evening)' }
}

export function LabelVideo({
  kind = 'live',
  focus = true,
  mini = false,
}: LabelVideoProps): ReactNode {
  const compact = mini && kind === 'live'
  const showIcon = focus && !compact

  return (
    <span
      className={compact ? 'text-caption-extra-bold' : 'text-body-sm-extra-bold'}
      style={{
        ...base,
        ...fillFor(kind, focus),
        gap: showIcon
          ? 'var(--dimension-spacing-core-2xs)'
          : 'var(--dimension-spacing-core-3xs)',
      }}
    >
      {showIcon && (
        <img
          src={volumeOnIcon}
          alt=""
          style={{
            width: 'var(--dimension-spacing-core-sm)',
            height: 'var(--dimension-spacing-core-sm)',
            flexShrink: 0,
            display: 'block',
          }}
        />
      )}
      {LABEL[kind]}
    </span>
  )
}
