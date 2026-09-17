/**
 * Master frame & layout rules — shared by the canvas, the interpreter and the AI
 * pipeline (Electron main), so it stays framework-free.
 *
 *   1. Frame  — every screen is laid out on the 1280×720 HD base (`frameSpec`) —
 *               the only canvas the agent ever targets. The canvas shows it at
 *               that size, or upscaled 1.5× to 1920×1080: a pure scale of the same
 *               layout, never a re-layout.
 *   2. Grid   — every spacing value is a multiple of the 8pt grid; the tight
 *               steps in `frameSpec.offGridAllowed` are the only exceptions. The
 *               frame itself applies the safe-area margin, so the root container
 *               adds none, and stacked modules / columns sit exactly one gutter
 *               apart. All in layout pixels.
 *   3. Focus  — screens are TV screens, so something is always focused. The
 *               canvas reads it off the rendered screen (`readingOrder`,
 *               `focusSideOf`) and pins the single anchored element group
 *               bottom-right, or mirrors it to the left margin when the focus is on
 *               the left. Nothing focusable → the bottom-right default. The master
 *               layout itself is never statically centered.
 *   4. Layers — the layer rule (Camadas, `design-system/screen-layers.ts`): the
 *               screen names its shade model and navigation level, and its content
 *               follows them.
 *   5. QA     — `auditFrameLayout` is the checklist. The strict validator turns
 *               its failures into retry errors; the canvas shows them live.
 */

import { frameSpec } from '@/design-system/primitives'
import type {
  DesignSystemManifest,
  ManifestComponent,
  ManifestProp,
} from '@/shared/design-system/manifest'
import { defaultForProp, tokenNames } from '@/shared/design-system/manifest'
import { auditScreenLayers } from '@/shared/design-system/screen-layers'

export const FRAME = {
  /** The layout canvas — what the agent targets and the frame is laid out at. */
  base: { width: frameSpec.baseWidth, height: frameSpec.baseHeight },
  upscale: frameSpec.upscale,
  grid: frameSpec.grid,
  margin: frameSpec.margin,
  gutter: frameSpec.gutter,
  offGridAllowed: frameSpec.offGridAllowed as readonly number[],
}

// ---------------------------------------------------------------------------
// Frame sizes — how the 1280×720 layout is shown, never what it's laid out at
// ---------------------------------------------------------------------------

export const FRAME_SIZE_IDS = ['1080p', '720p'] as const
export type FrameSizeId = (typeof FRAME_SIZE_IDS)[number]
export const DEFAULT_FRAME_SIZE: FrameSizeId = '1080p'

export interface FrameSize {
  id: FrameSizeId
  /** The size the layout is shown at. */
  width: number
  height: number
  /** e.g. "1920×1080" */
  label: string
  /** How it relates to the layout, e.g. "1280×720 upscaled 1.5×". */
  description: string
  /** Display scale applied to the 1280×720 layout. */
  scale: number
}

function frameSize(id: FrameSizeId, scale: number, description: string): FrameSize {
  const width = FRAME.base.width * scale
  const height = FRAME.base.height * scale
  return { id, width, height, label: `${width}×${height}`, description, scale }
}

export const FRAME_SIZES: Record<FrameSizeId, FrameSize> = {
  '1080p': frameSize(
    '1080p',
    FRAME.upscale,
    `${FRAME.base.width}×${FRAME.base.height} upscaled ${FRAME.upscale}×`,
  ),
  '720p': frameSize('720p', 1, 'HD base'),
}

export function isFrameSizeId(value: unknown): value is FrameSizeId {
  return typeof value === 'string' && (FRAME_SIZE_IDS as readonly string[]).includes(value)
}

// ---------------------------------------------------------------------------
// TV focus
// ---------------------------------------------------------------------------

export const FOCUS_SIDES = ['left', 'neutral', 'right'] as const
export type FocusSide = (typeof FOCUS_SIDES)[number]
/** Nothing focusable on screen — the anchored group takes the default zone. */
export const DEFAULT_FOCUS: FocusSide = 'neutral'

export type AnchorZone = 'bottom-left' | 'bottom-right'

/** Right focus (or nothing focusable) anchors bottom-right; left focus mirrors to the left margin. */
export function anchorZone(side: FocusSide): AnchorZone {
  return side === 'left' ? 'bottom-left' : 'bottom-right'
}

/** A focusable element's box, in frame pixels. */
export interface FocusBox {
  top: number
  left: number
  width: number
  height: number
}

/**
 * TV reading order — where initial focus lands: top to bottom, and boxes that
 * share a row (their vertical spans overlap) left to right.
 */
export function readingOrder<T extends FocusBox>(boxes: readonly T[]): T[] {
  return [...boxes].sort((a, b) => {
    const sameRow = a.top < b.top + b.height && b.top < a.top + a.height
    return sameRow ? a.left - b.left || a.top - b.top : a.top - b.top
  })
}

/** The side of the frame a focused box is on, by its horizontal center. Dead center counts as right. */
export function focusSideOf(box: FocusBox, frameWidth: number): 'left' | 'right' {
  return box.left + box.width / 2 < frameWidth / 2 ? 'left' : 'right'
}

// ---------------------------------------------------------------------------
// The 8pt grid
// ---------------------------------------------------------------------------

const REM_PX = 16

/** A px or rem length (or a bare number) in px. Anything else — calc, %, auto — is null. */
export function parseLengthPx(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const match = value.trim().match(/^(\d*\.?\d+)(px|rem)?$/)
  if (!match) return null
  const n = Number(match[1])
  return match[2] === 'rem' ? n * REM_PX : n
}

export function isOnGrid(px: number): boolean {
  return px % FRAME.grid === 0 || FRAME.offGridAllowed.includes(px)
}

/** The grid rule in words, for error messages. */
export function describeGrid(): string {
  const exceptions = FRAME.offGridAllowed.map((px) => `${px}px`).join(' and ')
  return `a multiple of ${FRAME.grid}px (${exceptions} are the only exceptions)`
}

/** A spacing token's size in px, or null when `name` isn't a resolvable spacing token. */
export function spacingPx(manifest: DesignSystemManifest, name: unknown): number | null {
  if (typeof name !== 'string') return null
  const dict = manifest.tokens.spacing ?? {}
  return Object.prototype.hasOwnProperty.call(dict, name) ? parseLengthPx(dict[name]) : null
}

/** True when `value` names a real spacing token that resolves off the grid. */
export function isOffGridSpacingToken(manifest: DesignSystemManifest, value: unknown): boolean {
  const px = spacingPx(manifest, value)
  return px !== null && !isOnGrid(px)
}

/**
 * `names` minus every real token that resolves off the grid. Names that can't be
 * resolved are kept (nothing to judge). Never empties the list: if every name is
 * off-grid the scale is left alone and the audit reports the values instead.
 */
export function onGridSpacingNames(
  manifest: DesignSystemManifest,
  names: readonly string[],
): string[] {
  const kept = names.filter((name) => !isOffGridSpacingToken(manifest, name))
  return kept.length > 0 ? kept : [...names]
}

/** The values a spacing prop may take — its enum, else the spacing scale — on the grid only. */
export function allowedSpacingNames(manifest: DesignSystemManifest, prop: ManifestProp): string[] {
  const names = prop.options && prop.options.length > 0 ? prop.options : tokenNames(manifest, 'spacing')
  return onGridSpacingNames(manifest, names)
}

/** The first of `names` that resolves to exactly `px`. */
export function spacingNameForPx(
  manifest: DesignSystemManifest,
  names: readonly string[],
  px: number,
): string | undefined {
  return names.find((name) => spacingPx(manifest, name) === px)
}

/**
 * `value` when it's an allowed on-grid name, else the allowed name nearest to it
 * in px (a tie goes to the earlier — usually smaller — step).
 */
export function snapSpacingName(
  manifest: DesignSystemManifest,
  names: readonly string[],
  value: unknown,
): string | undefined {
  const allowed = onGridSpacingNames(manifest, names)
  if (typeof value === 'string' && allowed.includes(value)) return value
  const target = spacingPx(manifest, value)
  if (target === null) return allowed[0]
  let best: string | undefined
  let bestDistance = Number.POSITIVE_INFINITY
  for (const name of allowed) {
    const px = spacingPx(manifest, name)
    if (px === null) continue
    const distance = Math.abs(px - target)
    if (distance < bestDistance) {
      best = name
      bestDistance = distance
    }
  }
  return best ?? allowed[0]
}

export type SpacingRole = 'gutter' | 'margin'

const ROLE_PATTERN: Record<SpacingRole, RegExp> = {
  gutter: /gap|gutter|spacing/i,
  margin: /padding|inset/i,
}

/** A container's spacing prop for the gap between its children, or for its inner padding. */
export function spacingPropFor(
  component: ManifestComponent,
  role: SpacingRole,
): ManifestProp | undefined {
  return Object.values(component.props).find(
    (prop) => prop.tokenGroup === 'spacing' && ROLE_PATTERN[role].test(prop.name),
  )
}

// ---------------------------------------------------------------------------
// No static centering of the master layout
// ---------------------------------------------------------------------------

/** A container's alignment props that could statically center it (`align`, `justify`, …). */
export function centeringPropsFor(component: ManifestComponent): ManifestProp[] {
  return Object.values(component.props).filter(
    (prop) => /align|justify/i.test(prop.name) && (!prop.options || prop.options.includes('center')),
  )
}

/** What to use instead of "center" on an alignment prop: "start" when allowed. */
export function uncenteredValue(prop: ManifestProp): string {
  if (!prop.options || prop.options.includes('start')) return 'start'
  return prop.options.find((option) => option !== 'center') ?? 'start'
}

// ---------------------------------------------------------------------------
// Tree helpers — work on untrusted Blueprint nodes and on CanvasNodes alike
// ---------------------------------------------------------------------------

export interface FrameNode {
  type?: unknown
  props?: unknown
  children?: unknown
  anchor?: unknown
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function childList(node: FrameNode): unknown[] {
  return Array.isArray(node.children) ? node.children : []
}

/** The value a node effectively renders with: what it set, else the prop's default. */
function propValue(node: FrameNode, prop: ManifestProp): unknown {
  const props = isObject(node.props) ? node.props : {}
  return prop.name in props ? props[prop.name] : defaultForProp(prop)
}

/**
 * Whether a container's gap is a gutter. The root's always is — its children are
 * the frame's top-level modules — and so is the gap of any container whose two or
 * more children are all containers: stacked widget modules, or columns.
 */
export function isModuleGroup(
  node: FrameNode,
  depth: number,
  manifest: DesignSystemManifest,
): boolean {
  if (depth === 0) return true
  const children = childList(node)
  return (
    children.length >= 2 &&
    children.every(
      (child) =>
        isObject(child) &&
        typeof child.type === 'string' &&
        manifest.components[child.type]?.acceptsChildren === true,
    )
  )
}

// ---------------------------------------------------------------------------
// QA checklist
// ---------------------------------------------------------------------------

export type FrameCheckId = 'frame' | 'margins' | 'grid' | 'focus' | 'layers'

export interface FrameCheck {
  id: FrameCheckId
  label: string
  ok: boolean
  problems: string[]
}

/**
 * The layout QA checklist for a document — `{ root }`, either a raw Blueprint or
 * the canvas tree. `size` is only how the frame is shown (it names the frame
 * check); the rules themselves are judged on the 1280×720 layout. Unknown
 * components and invalid prop values are the strict validator's job; this only
 * judges what they would lay out.
 */
export function auditFrameLayout(
  doc: unknown,
  manifest: DesignSystemManifest,
  size: FrameSizeId = DEFAULT_FRAME_SIZE,
): FrameCheck[] {
  const d = isObject(doc) ? doc : {}
  const shown = FRAME_SIZES[size]
  const frame: string[] = []
  const margins: string[] = []
  const grid: string[] = []
  const focus: string[] = []

  for (const [name, px] of [
    ['layout width', FRAME.base.width],
    ['layout height', FRAME.base.height],
    ['shown width', shown.width],
    ['shown height', shown.height],
  ] as const) {
    if (!isOnGrid(px)) frame.push(`The frame ${name} (${px}px) is off the ${FRAME.grid}pt grid.`)
  }

  const walk = (node: FrameNode, path: string, depth: number): void => {
    const component =
      typeof node.type === 'string' ? manifest.components[node.type] : undefined

    if (node.anchor !== undefined && node.anchor !== false) {
      if (node.anchor !== true) {
        focus.push(`${path}: "anchor" must be true or omitted.`)
      } else if (depth !== 1) {
        focus.push(
          `${path}${component ? ` <${component.id}>` : ''}: only a direct child of the root can be anchored — the frame places it on the focused side.`,
        )
      }
    }
    if (!component) return

    for (const prop of Object.values(component.props)) {
      if (prop.tokenGroup !== 'spacing') continue
      const value = propValue(node, prop)
      const px = spacingPx(manifest, value)
      if (px !== null && !isOnGrid(px)) {
        grid.push(
          `${path} <${component.id}>: ${prop.name} ${JSON.stringify(value)} is ${px}px — off the ${FRAME.grid}pt grid; use ${describeGrid()}.`,
        )
      }
    }

    const gap = component.acceptsChildren ? spacingPropFor(component, 'gutter') : undefined
    if (gap && isModuleGroup(node, depth, manifest)) {
      const value = propValue(node, gap)
      const px = spacingPx(manifest, value)
      if (px !== null && isOnGrid(px) && px !== FRAME.gutter) {
        const gutter = spacingNameForPx(manifest, allowedSpacingNames(manifest, gap), FRAME.gutter)
        grid.push(
          `${path} <${component.id}>: ${gap.name} ${JSON.stringify(value)} is ${px}px — ${
            depth === 0 ? "the root's top-level modules" : 'stacked modules and columns'
          } sit exactly ${FRAME.gutter}px apart${gutter ? `; use ${JSON.stringify(gutter)}` : ''}.`,
        )
      }
    }

    if (component.acceptsChildren) {
      childList(node).forEach((child, i) => {
        if (isObject(child)) walk(child, `${path} › ${component.id}[${i}]`, depth + 1)
      })
    }
  }

  if (isObject(d.root)) {
    const root = d.root
    const rootComponent = typeof root.type === 'string' ? manifest.components[root.type] : undefined

    if (rootComponent) {
      const padding = spacingPropFor(rootComponent, 'margin')
      if (padding) {
        const value = propValue(root, padding)
        const px = spacingPx(manifest, value)
        if (px !== null && px !== 0) {
          const zero = spacingNameForPx(manifest, allowedSpacingNames(manifest, padding), 0)
          margins.push(
            `root <${rootComponent.id}>: ${padding.name} ${JSON.stringify(value)} adds ${px}px inside the frame's ${FRAME.margin}px safe-area margin — the margin must be exactly ${FRAME.margin}px, so ${
              zero ? `set ${padding.name} to ${JSON.stringify(zero)}` : `remove the root's ${padding.name}`
            }.`,
          )
        }
      }

      for (const prop of centeringPropsFor(rootComponent)) {
        if (propValue(root, prop) !== 'center') continue
        focus.push(
          `root <${rootComponent.id}>: ${prop.name} "center" statically centers the master layout — TV layouts follow the focus instead; use ${JSON.stringify(uncenteredValue(prop))}.`,
        )
      }
    }

    walk(root, 'root', 0)

    const anchored = childList(root).filter((child) => isObject(child) && child.anchor === true)
    if (anchored.length > 1) {
      focus.push(
        `root: ${anchored.length} children are anchored — anchor at most one element group per frame.`,
      )
    }
  }

  const check = (id: FrameCheckId, label: string, problems: string[]): FrameCheck => ({
    id,
    label,
    ok: problems.length === 0,
    problems,
  })

  const layout = `${FRAME.base.width}×${FRAME.base.height}`
  return [
    check(
      'frame',
      shown.scale === 1 ? `Layout ${layout}` : `Layout ${layout}, shown at ${shown.label} (× ${shown.scale})`,
      frame,
    ),
    check('margins', `${FRAME.margin}px safe-area margins`, margins),
    check('grid', `${FRAME.grid}pt grid · ${FRAME.gutter}px gutters`, grid),
    check('focus', 'Focus alignment — no static centering, one anchored group', focus),
    check('layers', 'Layer rule (Camadas) — layer model, navigation level, content side', auditScreenLayers(d, manifest)),
  ]
}

/** Every failed checklist item as one error string each — the validator's retry signal. */
export function frameLayoutErrors(doc: unknown, manifest: DesignSystemManifest): string[] {
  return auditFrameLayout(doc, manifest).flatMap((check) => check.problems)
}
