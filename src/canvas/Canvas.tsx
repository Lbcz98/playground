import { type RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CanvasNode } from '@/model/nodeTree'
import { useFlowStore } from '@/store/flowStore'
import { type FocusReading, useFrameStore } from '@/store/frameStore'
import { useActiveDesignSystem, useHydratedRegistry } from '@/design-system/DesignSystemProvider'
import type { HydratedRegistry } from '@/design-system/registry'
import { applyTokens, manifestTokensToCssVars, purgeTokens, screenflowBaseVars } from '@/design-system/cssVars'
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
import { cx } from '@/lib/cx'
import { NodeRenderer } from './NodeRenderer'

/**
 * The canvas stage. Every screen is laid out on the 1280×720 TV canvas
 * (`shared/layout/frame.ts`) — the size the agent designs for. The Frame panel
 * picks how it's shown: at 1280×720, or upscaled 1.5× to 1920×1080. The upscale
 * is a pure scale of the same layout, never a re-layout. On top of that the frame
 * is scaled down to fit the stage.
 *
 * The frame owns the safe-area margin and the gutter, and holds two zones, both
 * plain flex (no absolute positioning, no drag-to-place):
 *   - content — the root node, filling the frame
 *   - anchor  — the root's anchored child (the element group), pinned to the
 *               bottom corner on the side the TV focus is on
 * Clicking the stage background clears the selection.
 *
 * The TV focus is read off the rendered content, never chosen by hand (see
 * `useTvFocus`).
 *
 * `data-canvas-theme="active"` is the ONLY place the active design system's
 * tokens land as CSS custom properties (spec §7b — tool/artifact isolation):
 * the app shell (toolbar, sidebars, Property Inspector controls) never sees
 * them and stays on its static Tailwind classes. The built-in ScreenFlow
 * values are seeded first so every `--sfs-*` var the generic renderer reads
 * is always defined, even when an imported system supplies only a partial
 * token set.
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

  useEffect(() => {
    const el = surfaceRef.current
    if (!el) return
    applyTokens(el, { ...screenflowBaseVars(), ...manifestTokensToCssVars(active.tokens) })
    return () => purgeTokens(el)
  }, [active])

  // The anchored group renders in its own zone. Ids are untouched, so selection,
  // the Layers panel and the Inspector still address the real tree.
  const { content, anchored } = useMemo(
    () => ({
      content: { ...tree, children: tree.children.filter((child) => !child.anchor) },
      anchored: tree.children.filter((child) => child.anchor),
    }),
    [tree],
  )
  const zone = anchorZone(focus.side)
  const checks = useMemo(() => auditFrameLayout({ root: tree }, active, size), [tree, active, size])

  return (
    <div
      ref={stageRef}
      className="flex h-full min-w-none flex-1 flex-col items-center justify-center gap-sm overflow-hidden bg-page p-2xl"
      onClick={() => select(null)}
    >
      <FrameStatus
        statusRef={statusRef}
        shown={shown}
        fit={fit}
        zone={zone}
        focus={focus}
        checks={checks}
      />
      <div className="shrink-0" style={{ width: shown.width * fit, height: shown.height * fit }}>
        <div
          ref={surfaceRef}
          data-canvas-theme="active"
          data-frame-size={size}
          data-focus={focus.side}
          className="sfs-canvas-surface flex h-frame w-frame origin-top-left flex-col gap-frame-gutter overflow-hidden p-frame-margin font-sans"
          style={{ transform: `scale(${shown.scale * fit})`, backgroundColor: 'var(--sfs-color-surface)' }}
        >
          <div ref={contentRef} className="grid min-h-none flex-1 grid-cols-1 grid-rows-1">
            <NodeRenderer node={content} />
          </div>
          {anchored.length > 0 ? (
            <div
              data-anchor-zone={zone}
              className={cx(
                'flex gap-frame-gutter',
                zone === 'bottom-left' ? 'justify-start' : 'justify-end',
              )}
            >
              {anchored.map((node) => (
                <NodeRenderer key={node.id} node={node} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
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
}: {
  statusRef: RefObject<HTMLDivElement>
  shown: FrameSize
  fit: number
  zone: AnchorZone
  focus: FocusReading
  checks: FrameCheck[]
}): JSX.Element {
  const problems = checks.flatMap((check) => check.problems)
  const passed = checks.filter((check) => check.ok).length

  return (
    <div
      ref={statusRef}
      className="flex w-full flex-col items-center gap-xs"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex flex-wrap items-center justify-center gap-sm text-xs text-ink-muted">
        <span className="font-medium text-ink">
          Frame {shown.label}
          {shown.scale !== 1 ? ` (${FRAME.base.width}×${FRAME.base.height} × ${shown.scale})` : ''}
        </span>
        <span>{Math.round(fit * 100)}%</span>
        <span>
          {focus.label ? `Focus “${focus.label}” · ${focus.side}` : 'Nothing focusable'} → anchor {zone}
        </span>
        <span
          title={checks.map((check) => `${check.ok ? '✓' : '✗'} ${check.label}`).join('\n')}
          className={cx(
            'rounded-full px-sm py-xs font-medium',
            problems.length > 0 ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success',
          )}
        >
          Layout QA {passed}/{checks.length}
        </span>
      </div>
      {problems.length > 0 ? (
        <ul className="m-none flex list-none flex-col items-center gap-xs p-none text-xs text-danger">
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
