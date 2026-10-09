/**
 * Renders one screen file (`?file=/src/…/screen.tsx`, its default export) and exposes
 * `window.__measure()`: the frame read into the rectangles `auditRender` takes.
 * With `?flow=/…/folder` it plays that flow in the app's player instead (`scripts/flow-probe.ts`).
 *
 * A screen written as TSX has no `data-node-id`, so the nodes are found through React:
 * a kit component's node is its first host element, named by the component's function.
 * (Dev build, so the function names are real. Not for production bundles.)
 */
import '@fontsource-variable/inter'
import '@/styles/global.css'
import '@/index.css'
import { createElement, type ComponentType } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import * as primitives from '@/primitives'
import { DTV_KIT } from '@/shared/export/kit'
import { measureFrame, type NodeRef } from '@/shared/layout/measureDom'

type Fiber = { type?: unknown; return?: Fiber | null; child?: Fiber | null; tag: number }
const HOST = 5

const KIT = new Set([...Object.keys(DTV_KIT), 'Box', 'Text'])
KIT.delete('Screen')

const fiberOf = (el: Element): Fiber | null => {
  const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$'))
  return key ? ((el as unknown as Record<string, Fiber>)[key] ?? null) : null
}
const nameOf = (f: Fiber): string | undefined => {
  const t = f.type as { displayName?: string; name?: string; render?: { name?: string }; type?: { name?: string } } | string | undefined
  if (!t || typeof t === 'string') return undefined
  return t.displayName || t.name || t.render?.name || t.type?.name
}

/** The kit component whose first host element this is, if any. */
function ownerAtTop(el: Element): string | undefined {
  let f = fiberOf(el)
  if (!f) return undefined
  while (f.return) {
    const parent: Fiber = f.return
    if (parent.child !== f) return undefined // not the component's first output
    if (parent.tag === HOST) return undefined // nested in another host: not the top
    const name = nameOf(parent)
    if (name && KIT.has(name)) return name
    f = parent
  }
  return undefined
}
/** The nearest kit component around an element, at any depth (`skip`: names to look past). */
function ownerAbove(el: Element, skip?: object): string | undefined {
  for (let f = fiberOf(el); f; f = f.return ?? null) {
    const name = nameOf(f)
    if (name && KIT.has(name) && !(skip && name in skip)) return name
  }
  return undefined
}

const ids = new Map<string, number>()
const refFor = (type: string, el: Element): NodeRef => {
  const key = `${type}`
  const n = (ids.get(key) ?? 0) + 1
  ids.set(key, n)
  void el
  return { id: `${type}#${n}`, type }
}

;(window as unknown as { __measure: () => unknown }).__measure = () => {
  ids.clear()
  const frame = document.querySelector<HTMLElement>('[data-screen-layer="video"]')
  if (!frame) return { error: 'no <Screen> rendered' }
  const owners = new WeakMap<Element, NodeRef>()
  const ownerRef = (el: Element): NodeRef | undefined => {
    for (let a: Element | null = el; a; a = a.parentElement) {
      const hit = owners.get(a)
      if (hit) return hit
      const name = ownerAbove(a)
      if (name) {
        const ref = { id: `${name}@${[...document.querySelectorAll('*')].indexOf(a)}`, type: name }
        owners.set(a, ref)
        return ref
      }
    }
    return undefined
  }
  return measureFrame(frame, {
    list: (root) =>
      Array.from(root.querySelectorAll('*')).flatMap((el) => {
        const type = ownerAtTop(el)
        return type ? [{ el, ref: refFor(type, el) }] : []
      }),
    ownerOf: ownerRef,
  })
}

/**
 * What is drawn focused, read off the DOM: the kit's one `<FocusRing>` (`data-focus-ring`) and the
 * outside ring of the main menu's channel bug (`data-focused`) — each named by the kit component around it.
 */
;(window as unknown as { __focus: () => unknown }).__focus = () => {
  const frame = document.querySelector<HTMLElement>('[data-screen-layer="video"]')
  if (!frame) return { error: 'no <Screen> rendered' }
  return {
    model: frame.querySelector('[data-screen-model]')?.getAttribute('data-screen-model') ?? null,
    level: frame.getAttribute('data-screen-level'),
    focused: Array.from(frame.querySelectorAll('[data-focus-ring], [data-focused]')).map((el) => ({
      // Past the primitives a component is built from (the main menu's ring sits in a Stack of its own).
      component: ownerAbove(el, primitives) ?? el.tagName.toLowerCase(),
      text: (el.closest('.sfs-focusable') ?? el).textContent?.trim().slice(0, 40) ?? '',
    })),
  }
}

/**
 * A key press, watched (`?flow=`): `__watch()` before it, `__watched()` once the next state is on screen.
 * `blank`: at some point the document had no `<Screen>`. A MutationObserver runs before the browser can
 * paint what changed, so no painted frame is missed. `rebuilt`: the parts of the frame that were on screen
 * before the key and are not in the document after it — React replaced them instead of updating them.
 */
const FRAME_PARTS = ['[data-screen-layer="video"]', '[data-screen-layer="overlay"]', '[data-screen-layer="content"]']
let watch: { parts: [string, Element | null][]; blank: boolean; observer: MutationObserver } | undefined
const hasScreen = (): boolean => !!document.querySelector(FRAME_PARTS[0])
;(window as unknown as { __watch: () => void }).__watch = () => {
  const now = { parts: FRAME_PARTS.map((q): [string, Element | null] => [q, document.querySelector(q)]), blank: !hasScreen(), observer: new MutationObserver(() => (now.blank ||= !hasScreen())) }
  now.observer.observe(document.getElementById('root')!, { childList: true, subtree: true })
  watch = now
}
;(window as unknown as { __watched: () => unknown }).__watched = () => {
  if (!watch) return { error: '__watch() was not called' }
  watch.observer.disconnect()
  return { blank: watch.blank || !hasScreen(), rebuilt: watch.parts.filter(([, el]) => !el?.isConnected).map(([q]) => q) }
}

// `?file=/…/screen.tsx` renders that screen; `?flow=/…/folder` plays that flow folder in the app's own player.
const params = new URLSearchParams(location.search)
const file = params.get('file')
const flow = params.get('flow')
if (!file && !flow) throw new Error('?file=/src/…/screen.tsx (or ?flow=/…/folder) is required')
const element = flow
  ? import('../../web/app/[designer]/[screen]/FlowPlayer').then(({ Flow }) =>
      createElement(Flow, {
        flow: () => import(/* @vite-ignore */ `${flow}/flow.ts`),
        state: (name: string) => import(/* @vite-ignore */ `${flow}/${name}.tsx`),
      }),
    )
  : import(/* @vite-ignore */ file!).then((mod: { default: ComponentType }) => createElement(mod.default))
element
  .then((el) => {
    // Committed before `__ready` is set: a render left to React's scheduler can lose the race to `document.fonts.ready`.
    flushSync(() => createRoot(document.getElementById('root')!).render(el))
    return document.fonts.ready
  })
  .then(() => {
    ;(window as unknown as { __ready: boolean }).__ready = true
  })
  .catch((error: unknown) => {
    ;(window as unknown as { __error: string }).__error = String(error)
  })
