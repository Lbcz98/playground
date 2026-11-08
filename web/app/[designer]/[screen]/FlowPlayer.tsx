'use client'
import { createElement, useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import type { FlowFile } from '@/shared/export/flowFile'
import { BACK_CONTROL, HIDDEN_STATE, NOTICE_IDLE, noticeOnState, noticeOnTimer, playStep, remoteKey, type NoticeState, type PlayKey } from '@/shared/flowPlay'
import { FlowNoticeContext } from '@/ui-kit/flowNotice'
import { Screen } from '@/ui-kit/Screen'
import { Stage } from '../../Stage'
import { isTvMode } from '../../tv'

/** `hidden` needs no file (standards/flow.md): level 0, the video alone. A `hidden.tsx` in the folder replaces this. */
const Hidden = (): ReactNode => <Screen model="alert" level={0} />

/** How long the notice's layer stays on after its message is told to leave: the kit's leaving motion (`motion.semantic.notification-*`) has to finish. */
const NOTICE_LEAVE_MS = 1500
/** The layer mounts closed and opens a moment later, so the message plays its arrival instead of just appearing. */
const NOTICE_ARRIVE_MS = 60

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
  const [notice, setNotice] = useState<NoticeState>(NOTICE_IDLE)
  const [noticeLayer, setNoticeLayer] = useState<{ screen?: unknown; mounted: boolean }>({ mounted: false })
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
    /** The states whose file has arrived, so a key press can switch without waiting a microtask. */
    const loaded = new Map<string, Result>()
    setView({ phase: 'loading' })
    setNotice(NOTICE_IDLE)
    setNoticeLayer({ mounted: false })

    // The flow's notice (flow.ts `notice`): a hidden count, then a message laid over whatever state is on screen.
    let noticeNow: NoticeState = NOTICE_IDLE
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const later = (ms: number, run: () => void) => {
      const id = setTimeout(() => {
        timers.delete(id)
        if (live) run()
      }, ms)
      timers.add(id)
    }
    const stopTimers = () => {
      timers.forEach(clearTimeout)
      timers.clear()
    }
    const setNoticeNow = (next: NoticeState) => {
      noticeNow = next
      setNotice(next)
    }
    const landed = (name: string) => {
      const rule = data?.notice
      if (!rule) return
      const before = noticeNow
      const next = noticeOnState(rule, before, name)
      if (next === before) return
      setNoticeNow(next)
      if (next.phase === 'counting') {
        later(rule.after * 1000, () => {
          setNoticeLayer((old) => ({ ...old, mounted: true }))
          later(NOTICE_ARRIVE_MS, () => {
            setNoticeNow(noticeOnTimer(noticeNow, 'arrive'))
            later(rule.during * 1000, () => {
              setNoticeNow(noticeOnTimer(noticeNow, 'leave'))
              later(NOTICE_LEAVE_MS, () => setNoticeLayer((old) => ({ ...old, mounted: false })))
            })
          })
        })
      } else if (next.phase === 'cancelled') {
        stopTimers()
        later(NOTICE_LEAVE_MS, () => setNoticeLayer((old) => ({ ...old, mounted: false })))
      }
    }

    const load = (name: string, refresh = false): Promise<Result> => {
      if (refresh) { files.delete(name); loaded.delete(name) }
      const previous = files.get(name)
      if (previous) return previous
      const result = state(name).then(
        (module): Result => ({ ok: true, value: module.default }),
        (error): Result => name === HIDDEN_STATE
          ? { ok: true, value: Hidden }
          : { ok: false, error },
      )
      files.set(name, result)
      void result.then((r) => { if (files.get(name) === result) loaded.set(name, r) })
      return result
    }

    const request = (next: string[], refresh = false) => {
      const name = next[next.length - 1]
      requested = next
      // Already loaded (every state is prefetched when the flow opens): go straight to it in one render. Passing through
      // `loading` re-rendered the whole screen and put the status label in and out of the page on every key, which
      // cost the TV (Chrome 68) a second render per key press.
      const ready = refresh ? undefined : loaded.get(name)
      if (ready?.ok) {
        ++requestId
        pending = false
        failed = false
        trail = next
        setView({ shown: ready.value, name, phase: 'ready' })
        landed(name)
        return
      }
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
        landed(name)
      })
    }

    pressRef.current = (key) => {
      if (!data || pending || failed) return
      if (key === 'restart') {
        // R starts the show over, notice included.
        stopTimers()
        setNoticeNow(NOTICE_IDLE)
        setNoticeLayer((old) => ({ ...old, mounted: false }))
      }
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
        if (data.notice) {
          void load(data.notice.state).then((result) => {
            if (live && result.ok) setNoticeLayer((old) => ({ ...old, screen: result.value }))
          })
        }
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
      stopTimers()
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

  // On the TV the remote's Back never reaches the page: Chrome 68 and the Android WebView turn it into history.back(),
  // which left the flow. In TV mode one history entry stands in front of the flow and each Back that pops it is the
  // flow's Back (then the entry is put back). At `hidden` (level 0), or when a Back changed nothing (the start state
  // has no Back), the next Back leaves the flow, as it would leave the app on a TV.
  const shownName = useRef(view.name)
  shownName.current = view.name
  const backFrom = useRef<string | undefined>(undefined)
  useEffect(() => {
    backFrom.current = undefined
  }, [view.name])
  useEffect(() => {
    if (!isTvMode()) return
    const arm = () => window.history.pushState({ ...window.history.state, tvBack: true }, '')
    arm()
    const onPop = () => {
      if (shownName.current === HIDDEN_STATE || backFrom.current === shownName.current) {
        window.history.back()
        return
      }
      backFrom.current = shownName.current
      press('back')
      arm()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [press])

  return (
    <>
      {/* `contents`: no box of its own, only the place to hear a click on the back control. */}
      <div style={{ display: 'contents' }} onClick={(e) => (e.target as Element).closest(BACK_CONTROL) && press('back')}>
        <FlowNoticeContext.Provider value={{ open: notice.phase === 'open', badge: notice.badge }}>
          <Stage>
            {view.name ? <StateView state={view.shown} /> : null}
            {/* The notice's own screen (level 0), laid over the frame and out of reach of the keys. */}
            {noticeLayer.mounted && noticeLayer.screen ? (
              <div data-flow-notice data-open={notice.phase === 'open'} style={{ position: 'absolute', left: 0, top: 0, width: 1280, height: 720, pointerEvents: 'none' }}>
                <StateView state={noticeLayer.screen} />
              </div>
            ) : null}
          </Stage>
        </FlowNoticeContext.Provider>
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
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        {view.name} · ← ↑ ↓ → Enter · Esc volta · R reinicia
      </div>
    </>
  )
}
