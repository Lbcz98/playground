'use client'
import { createElement, useCallback, useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { Screen } from '@/ui-kit/Screen'
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

/** `hidden` needs no file (standards/flow.md): level 0, the video alone. A `hidden.tsx` in the folder replaces this. */
const Hidden = (): ReactNode => <Screen model="alert" level={0} />

/**
 * The back control of a level-3 screen: the kit's round button drawn in the anchored group (the main menu's
 * round buttons carry `data-focus-item`). A click on it, or Enter while it is the focused element, is Back.
 */
const BACK_CONTROL = '.sfs-round-button:not([data-focus-item])'
const backControlFocused = (): boolean => !!document.querySelector(`${BACK_CONTROL}[data-state="focus"]`)

/** Where a flow's files come from: the bundler of the app here, the render harness in `npm run check:flow`. */
export interface FlowSource {
  flow: () => Promise<{ default: unknown }>
  state: (name: string) => Promise<{ default: unknown }>
}

/** The flow folder `protos/<designer>/<flow>/`, played. */
export function FlowPlayer({ designer, flow }: { designer: string; flow: string }) {
  const loadFlow = useCallback(() => import(`../../../protos/${designer}/${flow}/flow.ts`), [designer, flow])
  const loadState = useCallback((name: string) => import(`../../../protos/${designer}/${flow}/${name}.tsx`), [designer, flow])
  return <Flow key={`${designer}/${flow}`} flow={loadFlow} state={loadState} />
}

/**
 * The state on screen, called as a function instead of mounted as its own component: every state returns a
 * `<Screen>`, so React sees the same element in the same place and updates the frame and whatever lines up
 * inside it (the kit's transitions run between states) instead of tearing the screen down and building another.
 * ponytail: a state that calls hooks itself would break here (the hooks of two states are not the same list);
 * states are stateless by the standard (standards/flow.md). If that changes, mount it keyed by state again.
 */
function StateView({ state }: { state: unknown }): ReactNode {
  return typeof state === 'function' ? (state as () => ReactNode)() : createElement(state as ComponentType)
}

/**
 * Plays a flow with the keyboard, as a TV remote: arrows and Enter follow the transitions
 * of `flow.ts` and never wrap (no transition, nothing happens). Back (Esc, Backspace, GoBack,
 * BrowserBack, key codes 4/8/27/461/10009) retraces the states visited, unless the state declares a
 * `back` transition. `hidden` is level 0: any arrow returns to `start`. R restarts. The back control of a
 * level-3 screen (a click, or Enter while it is focused) is Back too.
 *
 * Every state is loaded when the flow opens, and a state still loading leaves the one before it
 * on screen: a key press never shows an empty frame.
 */
export function Flow({ flow, state }: FlowSource) {
  const [data, setData] = useState<FlowData | null>(null)
  const [trail, setTrail] = useState<string[]>([])
  const [states, setStates] = useState<Record<string, unknown>>({})

  useEffect(() => {
    let live = true
    flow().then((m) => {
      if (!live) return
      const loaded = m.default as FlowData
      setData(loaded)
      setTrail([loaded.start])
      for (const name of new Set([loaded.start, ...loaded.transitions.flatMap((t) => [t.from, t.to])]))
        state(name)
          .catch((e: unknown) => {
            if (name !== 'hidden') throw e
            return { default: Hidden }
          })
          .then((s) => live && setStates((all) => ({ ...all, [name]: s.default })))
    })
    return () => {
      live = false
    }
  }, [flow, state])

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
      let key = KEYS[e.key] ?? (isBack ? 'back' : e.key === 'r' ? 'restart' : null)
      if (key === 'enter' && backControlFocused()) key = 'back'
      if (!key) return
      e.preventDefault()
      press(key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press])

  // The last state of the trail that has loaded: the one asked for, or the one already on screen while it loads.
  const shown = [...trail].reverse().find((s) => s in states)

  return (
    <>
      {/* `contents`: no box of its own, only the place to hear a click on the back control. */}
      <div style={{ display: 'contents' }} onClick={(e) => (e.target as Element).closest(BACK_CONTROL) && press('back')}>
        <Stage>{shown ? <StateView state={states[shown]} /> : null}</Stage>
      </div>
      <div
        data-flow-state={shown}
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
        {shown} · ← ↑ ↓ → Enter · Esc volta · R reinicia
      </div>
    </>
  )
}
