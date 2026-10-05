'use client'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'
import { Stage } from '../../Stage'

interface FlowData {
  start: string
  transitions: { from: string; key: 'up' | 'down' | 'left' | 'right' | 'enter'; to: string }[]
}

const KEYS: Record<string, FlowData['transitions'][number]['key']> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Enter: 'enter',
}

/**
 * Plays a flow folder with the keyboard, as a TV remote: arrows and Enter follow the transitions
 * of `flow.ts`; Backspace or Esc go back along the states visited (a link to a state already
 * behind returns to it, like the player of the canvas); R restarts.
 */
export function FlowPlayer({ designer, flow }: { designer: string; flow: string }) {
  const [data, setData] = useState<FlowData | null>(null)
  const [trail, setTrail] = useState<string[]>([])

  useEffect(() => {
    let live = true
    import(`../../../protos/${designer}/${flow}/flow.ts`).then((m) => {
      if (!live) return
      setData(m.default as FlowData)
      setTrail([(m.default as FlowData).start])
    })
    return () => {
      live = false
    }
  }, [designer, flow])

  const press = useCallback(
    (key: string) => {
      if (!data) return
      setTrail((t) => {
        const current = t[t.length - 1]
        if (key === 'back') return t.length > 1 ? t.slice(0, -1) : t
        if (key === 'restart') return [data.start]
        const hop = data.transitions.find((x) => x.from === current && x.key === key)
        if (!hop) return t
        const behind = t.lastIndexOf(hop.to)
        return behind >= 0 ? t.slice(0, behind + 1) : [...t, hop.to]
      })
    },
    [data],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = KEYS[e.key] ?? (e.key === 'Backspace' || e.key === 'Escape' ? 'back' : e.key === 'r' ? 'restart' : null)
      if (!key) return
      e.preventDefault()
      press(key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press])

  const current = trail[trail.length - 1]
  const States = useMemo(() => new Map<string, ComponentType>(), [designer, flow])
  const State = current
    ? (States.get(current) ??
      (() => {
        const component = dynamic(() => import(`../../../protos/${designer}/${flow}/${current}.tsx`))
        States.set(current, component)
        return component
      })())
    : null

  return (
    <>
      <Stage>{State ? <State /> : null}</Stage>
      <div
        style={{
          position: 'fixed',
          right: 12,
          bottom: 8,
          font: '12px system-ui, sans-serif',
          color: '#666',
          background: 'rgba(255,255,255,.85)',
          padding: '4px 8px',
          borderRadius: 6,
        }}
      >
        {current} · ← ↑ ↓ → Enter · Esc volta · R reinicia
      </div>
    </>
  )
}
