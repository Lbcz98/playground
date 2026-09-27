/**
 * The render-measured half of Layout QA — checks `auditFrameLayout` (frame.ts)
 * cannot make from the Blueprint's data alone, because they depend on real text
 * metrics and real layout: content that overflows the frame, text that overlaps
 * another run, and text collapsed to near-nothing by a container too small for
 * it. `auditFrameLayout`'s checks are schema-shaped (tokens, gutters, grid) and
 * run on the Blueprint before it ever paints; this one runs after, on the DOM
 * Canvas.tsx actually measured — which is why it takes plain rectangles, not
 * elements, and stays testable without a browser (mirrors `focusReading.ts`).
 */

export interface MeasuredNode {
  id: string
  /** The manifest component type, for readable messages — not used to decide anything. */
  type: string
  top: number
  left: number
  width: number
  height: number
}

export interface MeasuredText {
  /** Trimmed, truncated to a readable length — for the message only. */
  text: string
  top: number
  left: number
  width: number
  height: number
}

export interface RenderMeasurement {
  frame: { width: number; height: number }
  /** Every rendered node carrying a `data-node-id`. */
  nodes: MeasuredNode[]
  /** Every distinct visible text run — not the node tree, just what's legible on screen. */
  texts: MeasuredText[]
}

/** Below this width, text has been squeezed to a sliver — collapsed, not just narrow. */
const COLLAPSED_WIDTH = 4
/** Two boxes overlapping by less than this on either axis is normal sub-pixel rounding, not a real overlap. */
const OVERLAP_SLACK = 2
/** A box past the frame edge by less than this is normal sub-pixel rounding. */
const EDGE_SLACK = 0.5

/**
 * Problems the rendered screen has that no Blueprint-level check can see. Pure —
 * takes rectangles Canvas.tsx already measured off the real DOM, returns nothing
 * about layout mechanics (`getBoundingClientRect`, scale) itself.
 */
export function auditRender(m: RenderMeasurement): string[] {
  const problems: string[] = []
  const { width: W, height: H } = m.frame

  for (const n of m.nodes) {
    if (n.left < -EDGE_SLACK || n.top < -EDGE_SLACK || n.left + n.width > W + EDGE_SLACK || n.top + n.height > H + EDGE_SLACK) {
      problems.push(`<${n.type}> runs past the edge of the frame — it doesn't fit where it's placed.`)
    }
  }

  const live = m.texts.filter((t) => t.width >= COLLAPSED_WIDTH && t.height > 0)
  for (const t of m.texts) {
    if (t.width < COLLAPSED_WIDTH && t.text.length > 0) {
      problems.push(`"${t.text}" has been squeezed down to nothing — its container is too small for it.`)
    }
  }
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i]
      const b = live[j]
      const ix = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left)
      const iy = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top)
      if (ix > OVERLAP_SLACK && iy > OVERLAP_SLACK) {
        problems.push(`"${a.text}" overlaps "${b.text}" — two pieces of text land on top of each other.`)
      }
    }
  }

  return problems
}
