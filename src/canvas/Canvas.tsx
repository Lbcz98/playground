import { type MutableRefObject, type RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CanvasNode } from '@/model/nodeTree'
import { screenMode } from '@/shared/blueprint'
import { treeDeclarations } from '@/shared/design-system/deviations'
import { useDeviationReport } from './useDeviationReport'
import { ruleById } from '@/shared/design-system/rules'
import { withVocabulary } from '@/shared/design-system/primitives'
import { useFlowStore } from '@/store/flowStore'
import { currentPlayScreenId, usePlayStore } from '@/store/playStore'
import { type FocusReading, useFrameStore } from '@/store/frameStore'
import { useActiveDesignSystem, useHydratedRegistry } from '@/design-system/DesignSystemProvider'
import type { HydratedRegistry } from '@/design-system/registry'
import {
  type AnchorZone,
  type FocusBox,
  type FrameCheck,
  type FrameSize,
  type FrameSizeId,
  DEFAULT_FOCUS,
  FRAME,
  FRAME_SIZES,
  anchorZone,
  auditFrameLayout,
  focusSideOf,
  focusedBy,
  focusPropsFor,
  readingOrder,
  summarizeChecks,
} from '@/shared/layout/frame'
import { measureFrame } from '@/shared/layout/measureDom'
import { auditRender } from '@/shared/layout/renderAudit'
import { defaultForProp, type DesignSystemManifest, type ManifestScreenModel } from '@/shared/design-system/manifest'
import { describeScreen, modelOfScreen, screenLayersOf } from '@/shared/design-system/screen-layers'
import { focusLeavesLevel } from '@/shared/design-system/flow'
import { cx } from '@/lib/cx'
import { focusableInNode, isMarkedFocus } from './focusReading'
import { NodeRenderer } from './NodeRenderer'
import { NodeModeContext, PlayRestContext } from './nodeMode'
import { PlayBar } from './PlayBar'
import { ScreenFrame } from './ScreenFrame'
import { ScreenStrip } from './ScreenStrip'

/**
 * The canvas stage. Every screen is laid out on the 1280×720 TV canvas
 * (`shared/layout/frame.ts`) — the size the agent designs for. The Frame panel
 * picks how it's shown: at 1280×720, or upscaled 1.5× to 1920×1080. The upscale
 * is a pure scale of the same layout, never a re-layout. On top of that the frame
 * is scaled down to fit the stage.
 *
 * The frame itself — the layer rule's three layers and the two content zones —
 * is `ScreenFrame`, which a template story renders too, so what the canvas shows
 * and what a snapshot shows can't drift apart. Clicking the stage background
 * clears the selection.
 *
 * The TV focus is read off the rendered content, never chosen by hand (see
 * `useTvFocus`).
 */
export function Canvas(): JSX.Element {
  const editTree = useFlowStore((s) => s.tree)
  const screens = useFlowStore((s) => s.screens)
  const editSelectedId = useFlowStore((s) => s.selectedId)
  const select = useFlowStore((s) => s.select)
  const mode = usePlayStore((s) => s.mode)
  const trail = usePlayStore((s) => s.trail)
  const playFocusId = usePlayStore((s) => s.focusId)
  const playFocusItem = usePlayStore((s) => s.focusItem)
  const playing = mode === 'play'
  // Playing shows the screen the prototype is on; editing shows the open one.
  const playId = currentPlayScreenId(
    trail,
    screens.map((entry) => entry.id),
  )
  const tree = playing ? (screens.find((entry) => entry.id === playId)?.tree ?? editTree) : editTree
  const selectedId = playing ? playFocusId : editSelectedId
  const size = useFrameStore((s) => s.size)
  const focus = useFrameStore((s) => s.focus)
  const renderProblems = useFrameStore((s) => s.renderProblems)
  const setRenderProblems = useFrameStore((s) => s.setRenderProblems)
  const active = useActiveDesignSystem()
  const registry = useHydratedRegistry()
  const shown = FRAME_SIZES[size]

  const stageRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const fit = useFitScale(stageRef, statusRef, shown)
  const focusElRef = useRef<Element | null>(null)
  useTvFocus(surfaceRef, contentRef, tree, selectedId, playing ? playFocusItem : null, size, registry, active, playing, focusElRef)
  useRenderAudit(surfaceRef, tree, size, registry, active, playing, setRenderProblems)
  usePlayKeys(playing, surfaceRef, tree, registry, focusElRef, active)
  useReleaseTextFocus(playing, screens)
  const rest = useMemo(() => restStates(tree, active), [tree, active])

  const zone = anchorZone(focus.side)
  const layers = screenLayersOf(active)
  const model = modelOfScreen(layers, tree.screen)
  // The breaks an Exploratory screen declares are shown apart in the QA line, not counted as failures.
  const exploratory = screenMode(screens.find((entry) => entry.tree === tree)) === 'exploratory'
  const declarations = useMemo(() => (exploratory ? treeDeclarations(tree, tree.screen) : []), [tree, exploratory])
  // The "N declared" badge counts the declarations the audit agrees with — the same report the Deviations panel reads.
  const declared = useDeviationReport(tree, exploratory)
    .filter((entry) => entry.status === 'declared')
    .map((entry) => `${ruleById(active, entry.ruleId)?.title ?? entry.ruleId} — ${entry.why}`)
  const checks = useMemo(
    () =>
      withRenderCheck(
        withFocusSide(auditFrameLayout({ root: tree }, exploratory ? withVocabulary(active) : active, size, declarations), model, focus),
        renderProblems,
      ),
    [tree, active, size, model, focus, renderProblems, declarations],
  )

  return (
    <div
      ref={stageRef}
      className="flex h-full min-w-none flex-1 flex-col items-center justify-center gap-2xs overflow-hidden bg-page p-3xl"
      onClick={() => select(null)}
    >
      {playing ? <PlayBar screenId={playId} /> : null}
      <FrameStatus
        statusRef={statusRef}
        shown={shown}
        fit={fit}
        zone={zone}
        focus={focus}
        checks={checks}
        declared={declared}
        screen={describeScreen(active, tree.screen)}
      />
      <div
        key={playing ? playId : 'edit'}
        className={cx('shrink-0', playing && 'sfs-screen-in')}
        style={{ width: shown.width * fit, height: shown.height * fit }}
      >
        <ScreenFrame
          tree={tree}
          layers={layers}
          tokens={active.tokens}
          focusSide={focus.side}
          scale={shown.scale * fit}
          size={size}
          surfaceRef={surfaceRef}
          contentRef={contentRef}
          renderNode={(node) => (
            <NodeModeContext.Provider value={mode}>
              <PlayRestContext.Provider value={rest}>
                <NodeRenderer node={node} />
              </PlayRestContext.Provider>
            </NodeModeContext.Provider>
          )}
        />
      </div>
      {!playing && screens.length > 1 ? <ScreenStrip /> : null}
    </div>
  )
}

/**
 * The live half of the layer check: a model that shades one side needs the TV
 * focus — and so the content — on that side. Only the rendered screen can say.
 */
function withFocusSide(
  checks: FrameCheck[],
  model: ManifestScreenModel | undefined,
  focus: FocusReading,
): FrameCheck[] {
  if (!model?.side || focus.side === 'neutral' || focus.side === model.side || !focus.label) return checks
  const problem = `"${model.id}" (${model.name}) shades the ${model.side} side, but the focus (“${focus.label}”) is on the ${focus.side} — move the content, or pick a ${focus.side} model.`
  return checks.map((check) =>
    check.id === 'layers' ? { ...check, ok: false, problems: [...check.problems, problem] } : check,
  )
}

/** Appends the render-measured check (`useRenderAudit`) as the QA checklist's 6th entry. */
function withRenderCheck(checks: FrameCheck[], problems: string[]): FrameCheck[] {
  return [...checks, { id: 'render', label: 'Render', ok: problems.length === 0, problems, declared: [] }]
}

/** The largest fit factor, never above 1, at which the shown frame fits under the status line. */
function useFitScale(
  stageRef: RefObject<HTMLDivElement>,
  statusRef: RefObject<HTMLDivElement>,
  shown: FrameSize,
): number {
  const [fit, setFit] = useState(1)

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const measure = () => {
      const style = getComputedStyle(stage)
      const status = (statusRef.current?.offsetHeight ?? 0) + (parseFloat(style.rowGap) || 0)
      const width = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
      const height =
        stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - status
      setFit(Math.max(0.01, Math.min(1, width / shown.width, height / shown.height)))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    if (statusRef.current) observer.observe(statusRef.current)
    return () => observer.disconnect()
  }, [stageRef, statusRef, shown])

  return fit
}

const FOCUSABLE =
  'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
const MAX_FOCUS_LABEL = 32

/**
 * Reads the TV focus off the rendered content zone — it's a TV canvas, so
 * something is always focused:
 *   1. the selected node, when it is (or contains) a focusable element — clicking
 *      on the canvas moves the focus, like the remote would
 *   2. otherwise the last element that held focus, if it's still on screen
 *   3. otherwise initial focus: the first focusable element in reading order
 * The side of the frame that element's center sits on is written to the frame
 * store, which places the anchored group. The anchored zone itself is never
 * read, so the group can't move itself. Focusables are found in the DOM, so this
 * works for every design system — hand-written, generic or live components.
 */
function useTvFocus(
  surfaceRef: RefObject<HTMLDivElement>,
  contentRef: RefObject<HTMLDivElement>,
  tree: CanvasNode,
  selectedId: string | null,
  focusItem: string | null,
  size: FrameSizeId,
  registry: HydratedRegistry,
  manifest: DesignSystemManifest,
  playing: boolean,
  focusElRef: MutableRefObject<Element | null>,
): void {
  const setFocusReading = useFrameStore((s) => s.setFocusReading)
  const lastFocusedId = useRef<string | null>(null)

  useLayoutEffect(() => {
    const frame = surfaceRef.current
    const content = contentRef.current
    if (!frame || !content) return

    const frameRect = frame.getBoundingClientRect()
    const scale = frameRect.width / frame.offsetWidth || 1
    type Focusable = FocusBox & { el: Element }
    const focusables: Focusable[] = readingOrder(
      Array.from(content.querySelectorAll(FOCUSABLE))
        .filter((el) => el.getClientRects().length > 0)
        .map((el) => {
          const rect = el.getBoundingClientRect()
          return {
            el,
            top: (rect.top - frameRect.top) / scale,
            left: (rect.left - frameRect.left) / scale,
            width: rect.width / scale,
            height: rect.height / scale,
          }
        }),
    )

    const focusableIn = (id: string | null): Focusable | undefined =>
      id ? focusableInNode(content.querySelector(`[data-node-id="${CSS.escape(id)}"]`), focusables) : undefined

    const selected = focusableIn(selectedId)
    // Before the viewer has pressed anything, focus is where the screen itself puts
    // it: the element rendered in its focus state (the rail's focused card) — only
    // then the first focusable in reading order.
    // Only a node that is itself the focusable counts — a container's focused part
    // (a menu's focused item) can't be told from the DOM, so it falls through.
    const declaredId = focusedNodeId(tree, manifest)
    const declaredEl = declaredId ? content.querySelector(`[data-node-id="${CSS.escape(declaredId)}"]`) : null
    const marked = focusables.find((f) => isMarkedFocus(f.el))
    const declared = marked ?? focusables.find((f) => f.el === declaredEl)
    const held = selected ?? focusableIn(lastFocusedId.current)

    // On a level whose focus starts on the anchored control (the third level's
    // rounded button) the anchored zone holds the focus. It can't place itself, so
    // its side is the layer model's.
    const hostOf = (id: string | null): Element | null =>
      id ? frame.querySelector(`[data-anchor-zone] [data-node-id="${CSS.escape(id)}"]`) : null
    // A focus the viewer put on an anchored control (arrow keys, a click) wins; else the level's own.
    const anchoredHost = hostOf(selectedId) ?? (held ? null : hostOf(anchoredFocusId(tree, manifest)))
    // The node's element may be a box-less host around the real control.
    const anchoredEl = anchoredHost ? (anchoredHost.matches(FOCUSABLE) ? anchoredHost : anchoredHost.querySelector(FOCUSABLE)) : null
    if (anchoredEl) {
      const model = modelOfScreen(screenLayersOf(manifest), tree.screen)
      lastFocusedId.current = null
      focusElRef.current = anchoredEl
      setFocusReading({ side: model?.side ?? DEFAULT_FOCUS, label: focusLabel(anchoredEl) })
      return
    }

    // Playing, what the screen draws focused is the truth (arrow keys move it);
    // editing, the selection is.
    const target = (playing ? (marked ?? held) : held) ?? declared ?? focusables[0]
    focusElRef.current = target?.el ?? null
    lastFocusedId.current = target?.el.closest('[data-node-id]')?.getAttribute('data-node-id') ?? null

    const reading: FocusReading = target
      ? { side: focusSideOf(target, frame.offsetWidth), label: focusLabel(target.el) }
      : { side: DEFAULT_FOCUS, label: null }
    setFocusReading(reading)
  }, [surfaceRef, contentRef, tree, selectedId, focusItem, size, registry, manifest, playing, focusElRef, setFocusReading])
}

/** A node's manifest component type, read off the document tree by id — for the render audit's messages only. */
function typeOf(tree: CanvasNode, id: string): string {
  const walk = (node: CanvasNode): string | undefined =>
    node.id === id ? node.type : node.children.map(walk).find(Boolean)
  return walk(tree) ?? '?'
}

/**
 * The render-measured half of Layout QA (`renderAudit.ts`): after the screen
 * paints, measures every node and text run in the frame — the same
 * `getBoundingClientRect` + scale pattern `useTvFocus` uses — and reports
 * overflow, overlap and collapsed text the Blueprint's own data can't show.
 */
function useRenderAudit(
  surfaceRef: RefObject<HTMLDivElement>,
  tree: CanvasNode,
  size: FrameSizeId,
  registry: HydratedRegistry,
  manifest: DesignSystemManifest,
  playing: boolean,
  setProblems: (problems: string[]) => void,
): void {
  useLayoutEffect(() => {
    let cancelled = false
    const measure = (): void => {
      const frame = surfaceRef.current
      if (cancelled || !frame) return
      // The DOM half (rectangles, clipping, what paints) is `measureFrame`, shared with screens written as TSX.
      const refOf = (el: Element): { id: string; type: string } | undefined => {
        const id = el.closest<HTMLElement>('[data-node-id]')?.dataset.nodeId
        return id ? { id, type: typeOf(tree, id) } : undefined
      }
      setProblems(
        auditRender(
          measureFrame(frame, {
            list: (root) =>
              Array.from(root.querySelectorAll<HTMLElement>('[data-node-id]')).map((el) => ({
                el,
                ref: { id: el.dataset.nodeId!, type: typeOf(tree, el.dataset.nodeId!) },
              })),
            ownerOf: refOf,
          }),
        ),
      )
    }

    measure()
    // ponytail: a self-hosted webfont finishing after the first paint shifts real
    // text metrics (measured, not guessed — the very first live check this hook
    // ran read 4 problems, then 5 once Inter settled) — this one re-measure covers
    // it; a font swap mid-session or a later async image load would need a
    // ResizeObserver on the content instead, if that turns out to matter too.
    void document.fonts?.ready?.then(measure)
    return () => {
      cancelled = true
    }
  }, [surfaceRef, tree, size, registry, manifest, playing, setProblems])
}

/**
 * The state each focus-capable component rests in on this screen — the value its
 * un-focused siblings carry (a rail's cards rest `selected`), so a card that
 * loses the focus goes back to it, not to `default`.
 */
function restStates(tree: CanvasNode, manifest: DesignSystemManifest): Record<string, unknown> {
  const counts: Record<string, Map<unknown, number>> = {}
  const visit = (node: CanvasNode): void => {
    const component = manifest.components[node.type]
    const prop = component ? focusPropsFor(component)[0] : undefined
    if (component && prop?.options?.includes('focus')) {
      const value = node.props[prop.name] ?? defaultForProp(prop)
      if (value !== 'focus') {
        const map = (counts[node.type] ??= new Map())
        map.set(value, (map.get(value) ?? 0) + 1)
      }
    }
    node.children.forEach(visit)
  }
  visit(tree)
  return Object.fromEntries(
    Object.entries(counts).map(([type, map]) => [type, [...map.entries()].sort((a, b) => b[1] - a[1])[0][0]]),
  )
}

/**
 * The remote, while playing: arrow keys move the TV focus to the nearest
 * focusable in that direction (the screen redraws it — see `NodeRenderer`), and
 * Enter presses it. Back (Esc) lives in the play bar.
 */
function usePlayKeys(
  playing: boolean,
  surfaceRef: RefObject<HTMLDivElement>,
  tree: CanvasNode,
  registry: HydratedRegistry,
  focusElRef: MutableRefObject<Element | null>,
  manifest: DesignSystemManifest,
): void {
  const setFocus = usePlayStore((s) => s.focus)

  useEffect(() => {
    if (!playing) return
    const onKey = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) return
      const frame = surfaceRef.current
      const current = focusElRef.current
      if (!frame) return

      if (event.key === 'Enter' || event.key === ' ') {
        if (!current) return
        event.preventDefault()
        ;(current as HTMLElement).click()
        return
      }
      const dir = ARROWS[event.key]
      if (!dir || !current) return
      event.preventDefault()

      // Like a TV's focus engine: sideways moves stay on the row and take the
      // nearest element on it; up and down prefer the same column, and when nothing
      // lines up take the nearest by distance with a penalty for drift.
      const from = current.getBoundingClientRect()
      const at = centerOf(current)
      let best: { el: Element; score: number } | null = null
      for (const el of Array.from(frame.querySelectorAll(FOCUSABLE))) {
        if (el === current || el.getClientRects().length === 0 || el.closest('[data-screen-layer="overlay"]')) continue
        const r = el.getBoundingClientRect()
        const c = centerOf(el)
        const along = (c.x - at.x) * dir.x + (c.y - at.y) * dir.y
        if (along <= 1) continue
        const across = Math.abs((c.x - at.x) * dir.y) + Math.abs((c.y - at.y) * dir.x)
        const lined = dir.x !== 0 ? r.top < from.bottom && from.top < r.bottom : r.left < from.right && from.left < r.right
        if (dir.x !== 0 && !lined) continue // sideways stays on its row, like a remote
        const score = (lined ? 0 : LINED_UP_BONUS) + along + across * 2
        if (!best || score < best.score) best = { el, score }
      }
      if (!best && dir.x !== 0) {
        // Sideways off the end of a row wraps round to its other end.
        let far: { el: Element; along: number } | null = null
        for (const el of Array.from(frame.querySelectorAll(FOCUSABLE))) {
          if (el === current || el.getClientRects().length === 0 || el.closest('[data-screen-layer="overlay"]')) continue
          const r = el.getBoundingClientRect()
          if (!(r.top < from.bottom && from.top < r.bottom)) continue
          const along = -((centerOf(el).x - at.x) * dir.x)
          if (along > 1 && (!far || along > far.along)) far = { el, along }
        }
        if (far) best = { el: far.el, score: 0 }
      }
      if (!best) {
        // Down and off a page the focus entered (the rail) returns to the page below it.
        const { trail, back } = usePlayStore.getState()
        const { screens } = useFlowStore.getState()
        const here = currentPlayScreenId(trail, screens.map((s) => s.id))
        if (dir.y === 1 && focusLeavesLevel(manifest, screens, here, trail[trail.length - 2])) back()
        return
      }
      const nodeId = best.el.closest('[data-node-id]')?.getAttribute('data-node-id')
      if (!nodeId) return
      const item = best.el.closest('[data-focus-item]')?.getAttribute('data-focus-item') ?? null
      setFocus(nodeId, registry.get(findType(tree, nodeId) ?? '') ? item : null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing, surfaceRef, tree, registry, focusElRef, manifest, setFocus])
}

/**
 * The remote is the keyboard while playing, so a text field left focused — the
 * composer, after sending a prompt with Enter — would swallow the arrow keys.
 * Entering Play, or a new document arriving while playing, releases it.
 */
function useReleaseTextFocus(playing: boolean, screens: unknown): void {
  useEffect(() => {
    if (!playing) return
    const active = document.activeElement
    if (active instanceof HTMLElement && /^(input|textarea|select)$/i.test(active.tagName)) active.blur()
  }, [playing, screens])
}

/** Anything that doesn't line up loses to anything that does, however far. */
const LINED_UP_BONUS = 100_000

const ARROWS: Record<string, { x: number; y: number }> = {
  ArrowRight: { x: 1, y: 0 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowDown: { x: 0, y: 1 },
  ArrowUp: { x: 0, y: -1 },
}

function centerOf(el: Element): { x: number; y: number } {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

function findType(tree: CanvasNode, id: string): string | null {
  if (tree.id === id) return tree.type
  for (const child of tree.children) {
    const hit = findType(child, id)
    if (hit) return hit
  }
  return null
}

/** The anchored node the screen's level puts the initial focus on, when it is in a focus state. */
function anchoredFocusId(tree: CanvasNode, manifest: DesignSystemManifest): string | null {
  const layers = screenLayersOf(manifest)
  const model = modelOfScreen(layers, tree.screen)
  const on = model ? layers.levels.find((l) => l.level === model.level)?.initialFocus?.on : undefined
  if (!on) return null
  for (const child of tree.children) {
    const component = manifest.components[child.type]
    if (child.anchor && component && on.includes(child.type) && focusedBy(child, component)) return child.id
  }
  return null
}

/** The id of the first node whose props put it in a focus state, outside the anchored group. */
function focusedNodeId(tree: CanvasNode, manifest: DesignSystemManifest): string | null {
  const visit = (node: CanvasNode): string | null => {
    const component = manifest.components[node.type]
    if (component && focusedBy(node, component)) return node.id
    for (const child of node.children) {
      const hit = visit(child)
      if (hit) return hit
    }
    return null
  }
  for (const child of tree.children) {
    if (child.anchor) continue
    const hit = visit(child)
    if (hit) return hit
  }
  return null
}

function focusLabel(el: Element): string {
  const text =
    el.getAttribute('aria-label') ||
    el.querySelector('[aria-label]')?.getAttribute('aria-label') ||
    el.textContent?.trim() ||
    el.getAttribute('placeholder') ||
    el.tagName.toLowerCase()
  return text.length > MAX_FOCUS_LABEL ? `${text.slice(0, MAX_FOCUS_LABEL)}…` : text
}

const MAX_LISTED_PROBLEMS = 3

function FrameStatus({
  statusRef,
  shown,
  fit,
  zone,
  focus,
  checks,
  declared,
  screen,
}: {
  statusRef: RefObject<HTMLDivElement>
  shown: FrameSize
  fit: number
  zone: AnchorZone
  focus: FocusReading
  checks: FrameCheck[]
  /** The declarations the audit agrees with, one line each — from the same report as the Deviations panel. */
  declared: string[]
  screen: string | null
}): JSX.Element {
  const problems = checks.flatMap((check) => check.problems)
  const declaredCount = declared.length
  const { passed, total } = summarizeChecks(checks)

  return (
    <div
      ref={statusRef}
      className="flex w-full flex-col items-center gap-3xs"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex flex-wrap items-center justify-center gap-2xs text-xs text-ink-muted">
        <span className="font-medium text-ink">
          Frame {shown.label}
          {shown.scale !== 1 ? ` (${FRAME.base.width}×${FRAME.base.height} × ${shown.scale})` : ''}
        </span>
        <span>{Math.round(fit * 100)}%</span>
        <span>
          {focus.label ? `Focus “${focus.label}” · ${focus.side}` : 'Nothing focusable'} → anchor {zone}
        </span>
        <span>{screen ? `Camadas: ${screen}` : 'No layer model'}</span>
        <span
          title={checks.map((check) => `${check.ok ? (check.declared.length > 0 ? '◇' : '✓') : '✗'} ${check.label}`).join('\n')}
          className={cx(
            'rounded-full px-2xs py-3xs font-medium',
            problems.length > 0
              ? 'bg-danger-subtle text-danger'
              : declaredCount > 0
                ? 'bg-brand-subtle text-brand-strong'
                : 'bg-success-subtle text-success',
          )}
        >
          Layout QA {passed}/{total}
          {declaredCount > 0 ? ` · ${declaredCount} declared` : ''}
        </span>
      </div>
      {declared.length > 0 ? (
        <ul className="m-none flex list-none flex-col items-center gap-3xs p-none text-xs text-ink-muted">
          {declared.slice(0, MAX_LISTED_PROBLEMS).map((message) => (
            <li key={message}>◇ declared · {message}</li>
          ))}
          {declared.length > MAX_LISTED_PROBLEMS ? <li>+{declared.length - MAX_LISTED_PROBLEMS} more declared</li> : null}
        </ul>
      ) : null}
      {problems.length > 0 ? (
        <ul className="m-none flex list-none flex-col items-center gap-3xs p-none text-xs text-danger">
          {problems.slice(0, MAX_LISTED_PROBLEMS).map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
          {problems.length > MAX_LISTED_PROBLEMS ? (
            <li>+{problems.length - MAX_LISTED_PROBLEMS} more</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  )
}
