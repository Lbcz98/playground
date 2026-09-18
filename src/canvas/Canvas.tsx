import { type RefObject, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CanvasNode } from '@/model/nodeTree'
import { useFlowStore } from '@/store/flowStore'
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
  readingOrder,
} from '@/shared/layout/frame'
import type { ManifestScreenModel } from '@/shared/design-system/manifest'
import { describeScreen, screenLayersOf, screenModel } from '@/shared/design-system/screen-layers'
import { cx } from '@/lib/cx'
import { NodeRenderer } from './NodeRenderer'
import { ScreenFrame } from './ScreenFrame'

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
  const tree = useFlowStore((s) => s.tree)
  const selectedId = useFlowStore((s) => s.selectedId)
  const select = useFlowStore((s) => s.select)
  const size = useFrameStore((s) => s.size)
  const focus = useFrameStore((s) => s.focus)
  const active = useActiveDesignSystem()
  const registry = useHydratedRegistry()
  const shown = FRAME_SIZES[size]

  const stageRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const fit = useFitScale(stageRef, statusRef, shown)
  useTvFocus(surfaceRef, contentRef, tree, selectedId, size, registry)

  const zone = anchorZone(focus.side)
  const layers = screenLayersOf(active)
  const model = screenModel(layers, tree.screen?.model)
  const checks = useMemo(
    () => withFocusSide(auditFrameLayout({ root: tree }, active, size), model, focus),
    [tree, active, size, model, focus],
  )

  return (
    <div
      ref={stageRef}
      className="flex h-full min-w-none flex-1 flex-col items-center justify-center gap-2xs overflow-hidden bg-page p-3xl"
      onClick={() => select(null)}
    >
      <FrameStatus
        statusRef={statusRef}
        shown={shown}
        fit={fit}
        zone={zone}
        focus={focus}
        checks={checks}
        screen={describeScreen(active, tree.screen)}
      />
      <div className="shrink-0" style={{ width: shown.width * fit, height: shown.height * fit }}>
        <ScreenFrame
          tree={tree}
          layers={layers}
          tokens={active.tokens}
          focusSide={focus.side}
          scale={shown.scale * fit}
          size={size}
          surfaceRef={surfaceRef}
          contentRef={contentRef}
          renderNode={(node) => <NodeRenderer node={node} />}
        />
      </div>
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
  size: FrameSizeId,
  registry: HydratedRegistry,
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

    const focusableIn = (id: string | null): Focusable | undefined => {
      if (!id) return undefined
      const node = content.querySelector(`[data-node-id="${CSS.escape(id)}"]`)
      return node ? focusables.find((f) => f.el === node || node.contains(f.el)) : undefined
    }

    const selected = focusableIn(selectedId)
    const target = selected ?? focusableIn(lastFocusedId.current) ?? focusables[0]
    lastFocusedId.current = target?.el.closest('[data-node-id]')?.getAttribute('data-node-id') ?? null

    const reading: FocusReading = target
      ? { side: focusSideOf(target, frame.offsetWidth), label: focusLabel(target.el) }
      : { side: DEFAULT_FOCUS, label: null }
    setFocusReading(reading)
  }, [surfaceRef, contentRef, tree, selectedId, size, registry, setFocusReading])
}

function focusLabel(el: Element): string {
  const text =
    el.getAttribute('aria-label') ||
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
  screen,
}: {
  statusRef: RefObject<HTMLDivElement>
  shown: FrameSize
  fit: number
  zone: AnchorZone
  focus: FocusReading
  checks: FrameCheck[]
  screen: string | null
}): JSX.Element {
  const problems = checks.flatMap((check) => check.problems)
  const passed = checks.filter((check) => check.ok).length

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
          title={checks.map((check) => `${check.ok ? '✓' : '✗'} ${check.label}`).join('\n')}
          className={cx(
            'rounded-full px-2xs py-3xs font-medium',
            problems.length > 0 ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success',
          )}
        >
          Layout QA {passed}/{checks.length}
        </span>
      </div>
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
