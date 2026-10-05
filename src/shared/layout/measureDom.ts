/**
 * Reads a rendered frame into the rectangles `auditRender` takes — the DOM half of the
 * render check, shared by the canvas (nodes carry `data-node-id`) and by a screen written
 * as TSX (nodes are the kit components, found through React). The audit stays pure; only
 * this file touches `getBoundingClientRect` and `getComputedStyle`.
 */
import type { ClipBox, MeasuredNode, MeasuredText, RenderMeasurement } from './renderAudit'

export interface NodeRef {
  id: string
  type: string
}

export interface NodeSource {
  /** Every node to measure, with the element that is its box. */
  list(frame: HTMLElement): { el: Element; ref: NodeRef }[]
  /** The node an element belongs to — for naming the container that clips something. */
  ownerOf(el: Element): NodeRef | undefined
}

/** A background that hides what is behind it: a fill that is at least half opaque, or an image/gradient. */
export function paintsBackground(el: Element): boolean {
  const style = getComputedStyle(el)
  if (style.backgroundImage !== 'none') return true
  const m = style.backgroundColor.match(/rgba?\(([^)]+)\)/)
  if (!m) return false
  const parts = m[1].split(/[ ,/]+/).filter(Boolean)
  const alpha = parts.length >= 4 ? Number(parts[3]) : 1
  return alpha >= 0.5
}

export function measureFrame(frame: HTMLElement, source: NodeSource): RenderMeasurement {
  const frameRect = frame.getBoundingClientRect()
  const scale = frameRect.width / frame.offsetWidth || 1
  const box = (rect: DOMRect) => ({
    top: (rect.top - frameRect.top) / scale,
    left: (rect.left - frameRect.left) / scale,
    width: rect.width / scale,
    height: rect.height / scale,
  })

  // A kit node's host can be `display: contents` and have no box of its own — its box is the union of what it renders.
  const rectOf = (el: Element): DOMRect | null => {
    if (el.getClientRects().length > 0) return el.getBoundingClientRect()
    const rects = Array.from(el.children).map(rectOf).filter((r): r is DOMRect => r !== null)
    if (rects.length === 0) return null
    const left = Math.min(...rects.map((r) => r.left))
    const top = Math.min(...rects.map((r) => r.top))
    return new DOMRect(left, top, Math.max(...rects.map((r) => r.right)) - left, Math.max(...rects.map((r) => r.bottom)) - top)
  }
  // The element whose own style the node paints with: itself, or the first descendant that has a box.
  const painter = (el: Element): Element => (el.getClientRects().length > 0 ? el : (Array.from(el.children).find((c) => c.getClientRects().length > 0) ?? el))

  // The nearest ancestor inside the frame that clips its overflow (a card), and the node that owns it.
  const clipOf = (el: Element): ClipBox | undefined => {
    for (let a = el.parentElement; a && a !== frame; a = a.parentElement) {
      const style = getComputedStyle(a)
      if (style.overflowX === 'visible' && style.overflowY === 'visible') continue
      const owner = source.ownerOf(a)
      if (!owner) return undefined
      return { ownerId: owner.id, ownerType: owner.type, ...box(a.getBoundingClientRect()) }
    }
    return undefined
  }

  const nodes: MeasuredNode[] = source.list(frame).flatMap(({ el, ref }) => {
    const rect = rectOf(el)
    return rect ? [{ id: ref.id, type: ref.type, ...box(rect), clip: clipOf(el), paints: paintsBackground(painter(el)) }] : []
  })

  // Every element whose own children include a real text node — measured by its text's own extent (a Range), not its padded box.
  const range = document.createRange()
  const texts: MeasuredText[] = Array.from(frame.querySelectorAll<HTMLElement>('*'))
    .filter((el) => Array.from(el.childNodes).some((c) => c.nodeType === Node.TEXT_NODE && c.textContent?.trim()))
    .filter((el) => Number(getComputedStyle(el).opacity) > 0.05) // mid-transition text isn't really "on screen" yet
    .map((el) => {
      range.selectNodeContents(el)
      return { text: (el.textContent ?? '').trim().slice(0, 40), ...box(range.getBoundingClientRect()), clip: clipOf(el) }
    })

  return { frame: { width: frame.offsetWidth, height: frame.offsetHeight }, nodes, texts }
}
