/**
 * The render-measured half of Layout QA — checks `auditFrameLayout` (frame.ts)
 * cannot make from the Blueprint's data alone, because they depend on real text
 * metrics and real layout: content cut off by the container that clips it (a
 * Content Card holding more rows than fit), content past the frame edge, text
 * that overlaps another run, and text collapsed to near-nothing by a container
 * too small for it. `auditFrameLayout`'s checks are schema-shaped (tokens,
 * gutters, grid) and run on the Blueprint before it ever paints; this one runs
 * after, on the DOM Canvas.tsx actually measured — which is why it takes plain
 * rectangles, not elements, and stays testable without a browser (mirrors
 * `focusReading.ts`).
 */

export interface Box {
  top: number
  left: number
  width: number
  height: number
}

/** The nearest ancestor that clips its overflow (a card), and the node it belongs to. */
export interface ClipBox extends Box {
  /** The clipping node's id — groups everything one container cuts off into one problem. */
  ownerId: string
  ownerType: string
}

export interface MeasuredNode extends Box {
  id: string
  /** The manifest component type, for readable messages — not used to decide anything. */
  type: string
  /** Set when an ancestor inside the frame clips overflow — what the viewer actually sees of this node. */
  clip?: ClipBox
  /** The node paints a background over what is behind it (a solid or near-solid fill, or an image/gradient). */
  paints?: boolean
}

export interface MeasuredText extends Box {
  /** Trimmed, truncated to a readable length — for the message only. */
  text: string
  clip?: ClipBox
}

export interface RenderMeasurement {
  frame: { width: number; height: number }
  /** Every rendered node carrying a `data-node-id`. */
  nodes: MeasuredNode[]
  /** Every distinct text run — not the node tree, just words that land on screen. */
  texts: MeasuredText[]
}

/** Below this width, text has been squeezed to a sliver — collapsed, not just narrow. */
const COLLAPSED_WIDTH = 4
/** Two boxes overlapping by less than this on either axis is normal sub-pixel rounding, not a real overlap. */
const OVERLAP_SLACK = 2
/** A box past an edge by less than this is normal sub-pixel rounding. */
const EDGE_SLACK = 0.5
/** A box this much of the frame in both width and height covers it: the margin is 32 of 1280×720, so the content area is 95% × 91%. */
const COVERS_FRAME = 0.85

/** Whether `inner` spills past `outer` on any side. */
function spills(inner: Box, outer: Box): boolean {
  return (
    inner.left < outer.left - EDGE_SLACK ||
    inner.top < outer.top - EDGE_SLACK ||
    inner.left + inner.width > outer.left + outer.width + EDGE_SLACK ||
    inner.top + inner.height > outer.top + outer.height + EDGE_SLACK
  )
}

/**
 * Problems the rendered screen has that no Blueprint-level check can see. Pure —
 * takes rectangles Canvas.tsx already measured off the real DOM, returns nothing
 * about layout mechanics (`getBoundingClientRect`, scale) itself.
 */
/** A render problem and the rule it breaks: the frame (overflow, cut off, overlap) or the layer stack (a covering fill). */
export interface RenderIssue {
  ruleId: 'frame.layout' | 'layers.stack' | 'render.legibility'
  /** 'block' fails check:laws (cut off, past the frame, covering fill); 'warn' is advisory (text on text, squeezed text). */
  severity: 'block' | 'warn'
  message: string
}

export function auditRender(m: RenderMeasurement): string[] {
  return auditRenderIssues(m).map((i) => i.message)
}

export function auditRenderIssues(m: RenderMeasurement): RenderIssue[] {
  const found: RenderIssue[] = []
  const problems = {
    push: (message: string, ruleId: RenderIssue['ruleId'] = 'frame.layout'): void =>
      void found.push({ ruleId, severity: ruleId === 'render.legibility' ? 'warn' : 'block', message }),
  }
  const frame: Box = { top: 0, left: 0, width: m.frame.width, height: m.frame.height }

  // Content its own container clips away: one problem per container, counted —
  // twenty table rows in a card that holds nine is one fact, not eleven. The
  // rows it does show are the measured capacity, so the message states it: a
  // repair told only "cuts off 11" split a table into two cards of ten.
  const byOwner = new Map<string, { ownerType: string; type: string; shown: number; cut: number }>()
  for (const n of m.nodes) {
    if (!n.clip) continue
    const entry = byOwner.get(n.clip.ownerId) ?? { ownerType: n.clip.ownerType, type: n.type, shown: 0, cut: 0 }
    if (n.type !== entry.type) continue // capacity is counted in one kind of child
    if (spills(n, n.clip)) entry.cut++
    else entry.shown++
    byOwner.set(n.clip.ownerId, entry)
  }
  for (const { ownerType, type, shown, cut } of byOwner.values()) {
    if (cut === 0) continue
    problems.push(
      `<${ownerType}> fits ${shown} <${type}>${shown === 1 ? '' : 's'} and cuts off ${cut} — keep it to ${shown}, or move the rest onto another screen. That count is for the card as built: a taller header or an added footer leaves room for fewer.`,
    )
  }

  // The content layer is transparent (`layers.stack`): the video and the overlay show through it. A node that
  // covers the frame and paints a background hides them, whatever container it is — not just the root.
  for (const n of m.nodes) {
    if (!n.paints) continue
    if (n.width >= frame.width * COVERS_FRAME && n.height >= frame.height * COVERS_FRAME) {
      problems.push(
        `<${n.type}> paints a background over the whole frame — the content layer is transparent so the video and the overlay show through. Remove its background; a container that covers the frame never paints one.`,
        'layers.stack',
      )
    }
  }

  // A node its container already hides is reported above; past the frame, only what's visible counts.
  const visible = (b: Box & { clip?: ClipBox }): boolean => !b.clip || !spills(b, b.clip)
  for (const n of m.nodes) {
    if (visible(n) && spills(n, frame)) {
      problems.push(`<${n.type}> runs past the edge of the frame — it doesn't fit where it's placed.`)
    }
  }

  const shown = m.texts.filter(visible)
  for (const t of shown) {
    if (t.width < COLLAPSED_WIDTH && t.text.length > 0) {
      problems.push(`"${t.text}" has been squeezed down to nothing — its container is too small for it.`, 'render.legibility')
    }
  }
  const live = shown.filter((t) => t.width >= COLLAPSED_WIDTH && t.height > 0)
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i]
      const b = live[j]
      const ix = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left)
      const iy = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top)
      if (ix > OVERLAP_SLACK && iy > OVERLAP_SLACK) {
        problems.push(`"${a.text}" overlaps "${b.text}" — two pieces of text land on top of each other.`, 'render.legibility')
      }
    }
  }

  return found
}
