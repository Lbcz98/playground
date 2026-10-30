'use client'
import { createElement, useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
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
 * State files are prefetched when the flow opens. A transition commits to the trail only after
 * its destination loads, leaving the last valid frame visible while loading or on failure.
 */
export function Flow({ flow, state }: FlowSource) {
  type View = { shown?: unknown; name?: string; phase: 'loading' | 'ready' | 'error'; error?: string }
  type Result = { ok: true; value: unknown } | { ok: false; error: unknown }
  const [view, setView] = useState<View>({ phase: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const pressRef = useRef<(key: PlayKey) => void>(() => {})
  const retryRef = useRef<() => void>(() => {})

  useEffect(() => {
    let live = true
    let data: FlowFile | undefined
    let trail: string[] = []
    let pending = false
    let failed = false
    let requested: string[] = []
    let requestId = 0
    const files = new Map<string, Promise<Result>>()
    setView({ phase: 'loading' })

    const load = (name: string, refresh = false): Promise<Result> => {
      if (refresh) files.delete(name)
      const previous = files.get(name)
      if (previous) return previous
      const result = state(name).then(
        (module): Result => ({ ok: true, value: module.default }),
        (error): Result => name === HIDDEN_STATE
          ? { ok: true, value: Hidden }
          : { ok: false, error },
      )
      files.set(name, result)
      return result
    }

    const request = (next: string[], refresh = false) => {
      const name = next[next.length - 1]
      requested = next
      pending = true
      failed = false
      const id = ++requestId
      setView((old) => ({ ...old, phase: 'loading', error: undefined }))
      void load(name, refresh).then((result) => {
        if (!live || id !== requestId) return
        pending = false
        if (!result.ok) {
          failed = true
          setView((old) => ({ ...old, phase: 'error', error: String(result.error) }))
          return
        }
        trail = next
        setView({ shown: result.value, name, phase: 'ready' })
      })
    }

    pressRef.current = (key) => {
      if (!data || pending || failed) return
      const next = playStep(data, trail, key)
      if (next === trail || (next.length === trail.length && next.every((name, i) => name === trail[i]))) return
      request(next)
    }
    retryRef.current = () => {
      if (pending) return
      if (!data) setAttempt((n) => n + 1)
      else if (failed) request(requested, true)
    }

    void flow().then(
      (module) => {
        if (!live) return
        data = module.default as FlowFile
        for (const name of new Set([data.start, ...data.transitions.flatMap((t) => [t.from, t.to])])) void load(name)
        request([data.start])
      },
      (error: unknown) => {
        if (!live) return
        failed = true
        setView({ phase: 'error', error: String(error) })
      },
    )
    return () => {
      live = false
      requestId++
      pressRef.current = () => {}
      retryRef.current = () => {}
    }
  }, [flow, state, attempt])

  const press = useCallback((key: PlayKey) => pressRef.current(key), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // The retry button takes its own keys: Enter there is a click, not the remote's Enter.
      if (e.target instanceof Element && e.target.closest('[data-flow-retry]')) return
      let key = remoteKey(e)
      if (key === 'enter' && backControlFocused()) key = 'back'
      if (!key) return
      e.preventDefault()
      press(key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press])

  return (
    <>
      {/* `contents`: no box of its own, only the place to hear a click on the back control. */}
      <div style={{ display: 'contents' }} onClick={(e) => (e.target as Element).closest(BACK_CONTROL) && press('back')}>
        <Stage>{view.name ? <StateView state={view.shown} /> : null}</Stage>
      </div>
      {view.phase !== 'ready' && (
        <div role={view.phase === 'error' ? 'alert' : 'status'} aria-live="polite" style={{ position: 'fixed', left: 12, bottom: 12, padding: '8px 12px', background: '#fff', color: '#222', font: '14px system-ui, sans-serif' }}>
          {view.phase === 'loading' ? 'Carregando tela…' : (
            <>Não foi possível carregar a tela. <span>{view.error}</span> <button type="button" data-flow-retry autoFocus onClick={() => retryRef.current()}>Tentar novamente</button></>
          )}
        </div>
      )}
      <div
        data-flow-state={view.name}
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
        {view.name} · ← ↑ ↓ → Enter · Esc volta · R reinicia
      </div>
    </>
  )
}
