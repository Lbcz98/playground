'use client'
import { createElement, useCallback, useEffect, useState, type ComponentType, type ReactNode } from 'react'
import type { FlowFile } from '@/shared/export/flowFile'
import { BACK_CONTROL, HIDDEN_STATE, playStep, remoteKey, type PlayKey } from '@/shared/flowPlay'
import { Screen } from '@/ui-kit/Screen'
import { Stage } from '../../Stage'

/** `hidden` needs no file (standards/flow.md): level 0, the video alone. A `hidden.tsx` in the folder replaces this. */
const Hidden = (): ReactNode => <Screen model="alert" level={0} />

/** The back control of a level-3 screen: a click on it, or Enter while it is the focused element, is Back. */
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
  const [data, setData] = useState<FlowFile | null>(null)
  const [trail, setTrail] = useState<string[]>([])
  const [states, setStates] = useState<Record<string, unknown>>({})

  useEffect(() => {
    let live = true
    flow().then((m) => {
      if (!live) return
      const loaded = m.default as FlowFile
      setData(loaded)
      setTrail([loaded.start])
      for (const name of new Set([loaded.start, ...loaded.transitions.flatMap((t) => [t.from, t.to])]))
        state(name)
          .catch((e: unknown) => {
            if (name !== HIDDEN_STATE) throw e
            return { default: Hidden }
          })
          .then((s) => live && setStates((all) => ({ ...all, [name]: s.default })))
    })
    return () => {
      live = false
    }
  }, [flow, state])

  const press = useCallback(
    (key: PlayKey) => {
      if (data) setTrail((t) => playStep(data, t, key))
    },
    [data],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      let key = remoteKey(e)
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
