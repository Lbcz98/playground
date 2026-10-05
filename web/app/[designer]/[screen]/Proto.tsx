'use client'
import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { Stage } from '../../Stage'
import { FlowPlayer } from './FlowPlayer'

/**
 * The kit is written without server components (hooks, no 'use client' marks), so a
 * prototype is loaded on this client side of the boundary — server-rendered first, then hydrated.
 */
export function Proto({ designer, screen, kind }: { designer: string; screen: string; kind: 'screen' | 'flow' }) {
  if (kind === 'flow') return <FlowPlayer designer={designer} flow={screen} />
  return <OneScreen designer={designer} screen={screen} />
}

function OneScreen({ designer, screen }: { designer: string; screen: string }) {
  const Screen = useMemo(() => dynamic(() => import(`../../../protos/${designer}/${screen}.tsx`)), [designer, screen])
  return (
    <Stage>
      <Screen />
    </Stage>
  )
}
