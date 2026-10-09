'use client'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'
import { Stage } from '../../Stage'

interface FlowData {
  start: string
  transitions: { from: string; key: 'up' | 'down' | 'left' | 'right' | 'enter' | 'back'; to: string }[]
}

const KEYS: Record<string, FlowData['transitions'][number]['key']> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Enter: 'enter',
}

const BACK_KEYS = ['Escape', 'Backspace', 'GoBack', 'BrowserBack', 'Back']
const BACK_CODES = [4, 8, 27, 461, 10009]

/**
 * Plays a flow folder with the keyboard, as a TV remote: arrows and Enter follow the transitions
 * of `flow.ts` and never wrap (no transition, nothing happens). Back (Esc, Backspace, GoBack,
 * BrowserBack, key codes 4/8/27/461/10009) retraces the states visited, unless the state declares a
 * `back` transition. `hidden` is level 0: any arrow returns to `start`. R restarts.
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
        if (key === 'restart') return [data.start]
        // `hidden` is level 0 (video only): any arrow brings the flow back to its start.
        if (current === 'hidden') return key === 'enter' || key === 'back' ? t : [data.start]
        // Back retraces to the previous state (focus memory) unless the state declares its own `back`.
        const hop = data.transitions.find((x) => x.from === current && x.key === key)
        if (key === 'back' && !hop) return t.length > 1 ? t.slice(0, -1) : t
        if (!hop) return t
        const behind = t.lastIndexOf(hop.to)
        return behind >= 0 ? t.slice(0, behind + 1) : [...t, hop.to]
      })
    },
    [data],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isBack = BACK_KEYS.includes(e.key) || BACK_CODES.includes(e.keyCode)
      const key = KEYS[e.key] ?? (isBack ? 'back' : e.key === 'r' ? 'restart' : null)
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
