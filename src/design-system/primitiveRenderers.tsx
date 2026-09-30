/**
 * How the Exploratory vocabulary renders on the canvas (phase 9E). Every value is a
 * token of the active system, read through its CSS variable; nothing here is a raw
 * value. A Proposal is a placeholder — a dotted box that says what it would be — and
 * never the real component.
 */

import type { ReactElement, ReactNode } from 'react'
import { cx } from '@/lib/cx'
import type { ManifestTokens } from '@/shared/design-system/manifest'
import { PROPOSAL_TYPE, type PrimitiveType } from '@/shared/design-system/primitives'
import { tokenVar } from './cssVars'

type Render = (props: Record<string, unknown>, children: ReactNode) => ReactElement

const token = (group: keyof ManifestTokens, value: unknown): string | undefined =>
  typeof value === 'string' && value ? tokenVar(group, value) : undefined

const FLEX_ALIGN: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' }
const FLEX_JUSTIFY: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between' }

export const PRIMITIVE_RENDERERS: Record<PrimitiveType | typeof PROPOSAL_TYPE, Render> = {
  'primitive:Box': (props, children) => (
    <div
      className="flex flex-col"
      style={{
        padding: token('spacing', props.padding),
        backgroundColor: token('colors', props.background),
        borderRadius: token('radius', props.radius),
      }}
    >
      {children}
    </div>
  ),
  'primitive:Stack': (props, children) => (
    <div
      className={cx('flex', props.direction === 'horizontal' ? 'flex-row' : 'flex-col')}
      style={{
        gap: token('spacing', props.gap),
        alignItems: FLEX_ALIGN[String(props.align)],
        justifyContent: FLEX_JUSTIFY[String(props.justify)],
      }}
    >
      {children}
    </div>
  ),
  'primitive:Text': (props) => (
    <span
      style={{
        color: token('colors', props.color),
        fontSize: token('typography', props.size),
        fontWeight: token('typography', props.weight),
      }}
    >
      {String(props.text ?? '')}
    </span>
  ),
  [PROPOSAL_TYPE]: (props) => {
    const api = props.proposedApi && typeof props.proposedApi === 'object' ? Object.entries(props.proposedApi as Record<string, unknown>) : []
    return (
      <div
        data-proposal
        className="flex flex-col gap-3xs rounded-md border-2 border-dotted border-brand bg-brand-subtle p-sm text-sm text-brand-strong"
      >
        <span className="font-semibold">Proposta · {String(props.description ?? '')}</span>
        {api.length > 0 ? (
          <span className="text-xs">{api.map(([name, type]) => `${name}: ${String(type)}`).join(' · ')}</span>
        ) : null}
      </div>
    )
  },
}
