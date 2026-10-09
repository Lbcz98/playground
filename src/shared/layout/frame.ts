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
 *   3. Focus  — screens are TV screens, so something is always focused, and only
 *               one thing is: a screen whose props focus two elements is rejected
 *               (`focusPropsFor`). WHERE the focus is, the canvas reads off the
 *               rendered screen (`readingOrder`, `focusSideOf`) and pins the single
 *               anchored element group bottom-right, or mirrors it to the left
 *               margin when the focus is on the left. Nothing focusable → the
 *               bottom-right default. The master layout itself is never statically
 *               centered.
 *   4. Layers — the layer rule (Camadas, `design-system/screen-layers.ts`): the
 *               screen names its shade model and navigation level, and its content
 *               follows them.
 *   5. QA     — `auditFrameLayout` is the checklist. The strict validator turns
 *               its failures into retry errors; the canvas shows them live. A
 *               6th check, `render` (`renderAudit.ts`), only the canvas can
 *               run: overflow, overlap and collapsed text the Blueprint's data
 *               can't show before it paints.
 */

import { frameSpec } from '@/design-system/primitives'
import type {
  DesignSystemManifest,
  ManifestComponent,
  ManifestProp,
} from '@/shared/design-system/manifest'
import { defaultForProp, rootContainerId, tokenNames } from '@/shared/design-system/manifest'
import { auditScreenLayerIssues, modelOfScreen, navigationLevel, screenLayersOf } from '@/shared/design-system/screen-layers'
import type { IssuePath, RuleProblem } from '@/shared/design-system/rules'
import { coveredBy, declaresRule, type Declaration } from '@/shared/design-system/deviations'
import { FOCUS_LOOK_ONLY } from './focus-rule'
import type { ScreenMode } from '@/shared/blueprint'

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

/**
 * The prop that decides how a container's children fill its cross axis (`align`
 * on a column) — the one the root must leave on "stretch", so the content layer
 * always spans the frame and each module positions itself inside it.
 */
export function stretchPropFor(component: ManifestComponent): ManifestProp | undefined {
  return Object.values(component.props).find(
    (prop) => /^align(Items)?$/i.test(prop.name) && prop.options?.includes('stretch'),
  )
}

/** What to use instead of "center" on an alignment prop: "start" when allowed. */
export function uncenteredValue(prop: ManifestProp): string {
  if (!prop.options || prop.options.includes('start')) return 'start'
  return prop.options.find((option) => option !== 'center') ?? 'start'
}

// ---------------------------------------------------------------------------
// One focused element per screen
// ---------------------------------------------------------------------------

/** The values a `focusedSomething` prop takes to mean "nothing here is focused". */
const UNFOCUSED = new Set(['none', 'null', ''])

/**
 * Which of a component's props can put it in a focus state. Read off the
 * manifest rather than off component names: either a state prop that can be
 * `"focus"` (a card, a button), or a prop named for what it focuses, whose
 * resting value says nothing is (a menu's `focusedItem: "none"`).
 */
export function focusPropsFor(component: ManifestComponent): ManifestProp[] {
  return Object.values(component.props).filter(
    (prop) => prop.options?.includes('focus') || /^focus/i.test(prop.name),
  )
}

/**
 * The resting value of a focus prop — what the elements that lose it get set to.
 * A prop that takes `null` rests at it ("focus is elsewhere") unless it offers a
 * word for that itself.
 */
export function unfocusedValue(prop: ManifestProp): string | null {
  if (prop.options?.includes('focus')) {
    return (
      prop.options.find((option) => option === 'default') ??
      prop.options.find((option) => option !== 'focus') ??
      'default'
    )
  }
  return prop.options?.find((option) => UNFOCUSED.has(option)) ?? (prop.nullable ? null : 'none')
}

/** Whether this node's props put it in a focus state, and through which prop. */
export function focusedBy(node: FrameNode, component: ManifestComponent): ManifestProp | undefined {
  for (const prop of focusPropsFor(component)) {
    const value = propValue(node, prop)
    if (prop.options?.includes('focus')) {
      if (value === 'focus') return prop
      continue
    }
    if (value === true) return prop
    if (typeof value === 'string' && !UNFOCUSED.has(value)) return prop
  }
  return undefined
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
 * more children are all containers: stacked widget modules, or columns. Only the
 * layout's own stacks are asked: inside a module (a card, a menu) the spacing is
 * the module's, so callers stop at the first component that isn't `layoutId`.
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

// 'render' is not produced here — `auditFrameLayout` only ever sees the
// Blueprint's data, before it paints. It's added by the canvas, which is the
// only place that can measure the actual rendered screen (`renderAudit.ts`).
export type FrameCheckId = 'frame' | 'margins' | 'grid' | 'focus' | 'layers' | 'render'

export interface FrameCheck {
  id: FrameCheckId
  label: string
  /** No failing problem; a break the screen declares is not one. */
  ok: boolean
  problems: string[]
  /** Breaks of a pattern the screen declares (Exploratory): shown apart, never counted as failures. */
  declared: string[]
}

/** The checklist as the status line reads it: `Layout QA 5/6 · 1 declared`. */
export function summarizeChecks(checks: readonly FrameCheck[]): { passed: number; total: number; failing: number; declared: number } {
  return {
    // A check with a declared break is neither a pass nor a failure.
    passed: checks.filter((check) => check.ok && check.declared.length === 0).length,
    total: checks.length,
    failing: checks.filter((check) => !check.ok).length,
    declared: checks.reduce((sum, check) => sum + check.declared.length, 0),
  }
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
  declarations: readonly Declaration[] = [],
): FrameCheck[] {
  return auditFrameIssues(doc, manifest, size).map(({ id, label, issues }) => {
    // A pattern the screen declares, at or above where it breaks, is shown as declared. A law never is.
    const declared = issues.filter((issue) => coveredBy(issue, declarations, manifest))
    const failing = issues.filter((issue) => !declared.includes(issue))
    return {
      id,
      label,
      ok: failing.length === 0,
      problems: failing.map((issue) => issue.message),
      declared: declared.map((issue) => issue.message),
    }
  })
}

/** The same checklist, each problem naming the rule it breaks and where (relative to `{ screen, root }`). */
function auditFrameIssues(
  doc: unknown,
  manifest: DesignSystemManifest,
  size: FrameSizeId,
): { id: FrameCheckId; label: string; issues: RuleProblem[] }[] {
  const d = isObject(doc) ? doc : {}
  const shown = FRAME_SIZES[size]
  const frame: RuleProblem[] = []
  const margins: RuleProblem[] = []
  const grid: RuleProblem[] = []
  const focus: RuleProblem[] = []
  const problem = (ruleId: RuleProblem['ruleId'], path: IssuePath, message: string): RuleProblem => ({ ruleId, message, path })
  /** Every node whose props put it in a focus state — a TV screen allows one. */
  const focused: { path: string; component: ManifestComponent; prop: ManifestProp; value: unknown }[] = []
  const seen = new Set<string>()

  for (const [name, px] of [
    ['layout width', FRAME.base.width],
    ['layout height', FRAME.base.height],
    ['shown width', shown.width],
    ['shown height', shown.height],
  ] as const) {
    if (!isOnGrid(px)) frame.push(problem('frame.layout', [], `The frame ${name} (${px}px) is off the ${FRAME.grid}pt grid.`))
  }

  const layoutId = rootContainerId(manifest)
  /** `inModule`: below a component that isn't the layout's stack, where gutters don't apply. */
  const walk = (node: FrameNode, path: string, at: IssuePath, depth: number, inModule: boolean): void => {
    const component =
      typeof node.type === 'string' ? manifest.components[node.type] : undefined

    if (node.anchor !== undefined && node.anchor !== false) {
      if (node.anchor !== true) {
        focus.push(problem('layout.anchor-structure', [...at, 'anchor'], `${path}: "anchor" must be true or omitted.`))
      } else if (depth !== 1) {
        focus.push(
          problem(
            'layout.anchor-structure',
            [...at, 'anchor'],
            `${path}${component ? ` <${component.id}>` : ''}: only a direct child of the root can be anchored — the frame places it on the focused side.`,
          ),
        )
      }
    }
    if (!component) return
    seen.add(component.id)

    const focusProp = FOCUS_LOOK_ONLY.includes(component.id) ? undefined : focusedBy(node, component)
    if (focusProp) {
      focused.push({ path, component, prop: focusProp, value: propValue(node, focusProp) })
    }

    for (const prop of Object.values(component.props)) {
      if (prop.tokenGroup !== 'spacing') continue
      const value = propValue(node, prop)
      const px = spacingPx(manifest, value)
      if (px !== null && !isOnGrid(px)) {
        grid.push(
          problem(
            'grid.8pt',
            [...at, 'props', prop.name],
            `${path} <${component.id}>: ${prop.name} ${JSON.stringify(value)} is ${px}px — off the ${FRAME.grid}pt grid; use ${describeGrid()}.`,
          ),
        )
      }
    }

    const gap = component.acceptsChildren ? spacingPropFor(component, 'gutter') : undefined
    if (gap && !inModule && isModuleGroup(node, depth, manifest)) {
      const value = propValue(node, gap)
      const px = spacingPx(manifest, value)
      if (px !== null && isOnGrid(px) && px !== FRAME.gutter) {
        const gutter = spacingNameForPx(manifest, allowedSpacingNames(manifest, gap), FRAME.gutter)
        grid.push(
          problem(
            'frame.layout',
            [...at, 'props', gap.name],
            `${path} <${component.id}>: ${gap.name} ${JSON.stringify(value)} is ${px}px — ${
              depth === 0 ? "the root's top-level modules" : 'stacked modules and columns'
            } sit exactly ${FRAME.gutter}px apart${gutter ? `; use ${JSON.stringify(gutter)}` : ''}.`,
          ),
        )
      }
    }

    if (component.acceptsChildren) {
      childList(node).forEach((child, i) => {
        if (isObject(child)) {
          walk(child, `${path} › ${component.id}[${i}]`, [...at, 'children', i], depth + 1, inModule || component.id !== layoutId)
        }
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
            problem(
              'frame.layout',
              ['root', 'props', padding.name],
              `root <${rootComponent.id}>: ${padding.name} ${JSON.stringify(value)} adds ${px}px inside the frame's ${FRAME.margin}px safe-area margin — the margin must be exactly ${FRAME.margin}px, so ${
                zero ? `set ${padding.name} to ${JSON.stringify(zero)}` : `remove the root's ${padding.name}`
              }.`,
            ),
          )
        }
      }

      const stretch = stretchPropFor(rootComponent)
      if (stretch) {
        const value = propValue(root, stretch)
        if (value !== 'stretch') {
          focus.push(
            problem(
              'layout.root-align',
              ['root', 'props', stretch.name],
              `root <${rootComponent.id}>: ${stretch.name} ${JSON.stringify(value)} — the stack that holds the components always stretches (${stretch.name} "stretch"); a module that belongs on one side positions itself inside it (its own ${stretch.name}/justify, or a row set to justify "end").`,
            ),
          )
        }
      }
      for (const prop of centeringPropsFor(rootComponent)) {
        if (prop === stretch || propValue(root, prop) !== 'center') continue
        focus.push(
          problem(
            'layout.no-static-center',
            ['root', 'props', prop.name],
            `root <${rootComponent.id}>: ${prop.name} "center" statically centers the master layout — TV layouts follow the focus instead; use ${JSON.stringify(uncenteredValue(prop))}.`,
          ),
        )
      }
    }

    walk(root, 'root', ['root'], 0, false)

    const anchored = childList(root).filter((child) => isObject(child) && child.anchor === true)
    if (anchored.length > 1) {
      focus.push(
        problem('layout.anchor', ['root'], `root: ${anchored.length} children are anchored — anchor at most one element group per frame.`),
      )
    }

    if (focused.length > 1) {
      const list = focused
        .map((f) => `${f.path} <${f.component.id}>: ${f.prop.name} ${JSON.stringify(f.value)}`)
        .join('; ')
      const resting = focused
        .slice(1)
        .map((f) => `${f.prop.name} ${JSON.stringify(unfocusedValue(f.prop))}`)
        .join(' / ')
      focus.push(
        problem(
          'focus.single',
          ['root'],
          `${focused.length} elements are focused (${list}) — a TV screen has exactly one: the one the viewer is on. ` +
            `Keep the one the screen is about and rest the others (${resting}).`,
        ),
      )
    }
  }

  const check = (id: FrameCheckId, label: string, issues: RuleProblem[]) => ({ id, label, issues })

  const layout = `${FRAME.base.width}×${FRAME.base.height}`
  return [
    check(
      'frame',
      shown.scale === 1 ? `Layout ${layout}` : `Layout ${layout}, shown at ${shown.label} (× ${shown.scale})`,
      frame,
    ),
    check('margins', `${FRAME.margin}px safe-area margins`, margins),
    check('grid', `${FRAME.grid}pt grid · ${FRAME.gutter}px gutters`, grid),
    check('focus', 'Focus — no static centering, one focused element, one anchored group', focus),
    check('layers', 'Layer rule (Camadas) — layer model, navigation level, content side, where focus starts', [
      ...auditScreenLayerIssues(d, manifest),
      ...levelFocusIssues(manifest, screenOf(d), focused, seen),
      ...levelRootIssues(manifest, screenOf(d), isObject(d.root) ? d.root : undefined),
    ]),
  ]
}

/** The container prop that places its children along the main axis (`justify`), when it has an `end`. */
export function justifyPropFor(component: ManifestComponent): ManifestProp | undefined {
  return Object.values(component.props).find(
    (prop) => /^justify(Content)?$/i.test(prop.name) && prop.options?.includes('end'),
  )
}

/** A container's direction prop and its column value, when it has one. */
export function columnDirectionFor(component: ManifestComponent): { prop: ManifestProp; column: string } | undefined {
  const prop = component.props.direction
  const column = prop?.options?.find((o) => o === 'vertical' || o === 'column')
  return prop && column ? { prop, column } : undefined
}

/**
 * Levels whose outermost container must be a column: a row would turn `justify`
 * into the side, and fight the model — the module places itself left or right
 * inside the column instead. `rootEnd` levels also pin that column to the end of
 * the frame (the bottom); `rootColumn` levels (Home) only require the column —
 * their content can sit at both the top and the bottom (a rail with a
 * notification), so nothing fixes `justify` for them.
 */
export function levelRootProblems(
  manifest: DesignSystemManifest,
  screen: unknown,
  root: FrameNode | undefined,
): string[] {
  return levelRootIssues(manifest, screen, root).map((issue) => issue.message)
}

function levelRootIssues(
  manifest: DesignSystemManifest,
  screen: unknown,
  root: FrameNode | undefined,
): RuleProblem[] {
  const layers = screenLayersOf(manifest)
  const model = modelOfScreen(layers, screen)
  const level = model ? navigationLevel(layers, model.level) : undefined
  if (!(level?.rootEnd || level?.rootColumn) || !root || typeof root.type !== 'string') return []
  const component = manifest.components[root.type]
  if (!component) return []
  const column = columnDirectionFor(component)
  if (!column) return []
  const problems: RuleProblem[] = []
  const direction = propValue(root, column.prop)
  // A level that shows at most one module wraps it in a row to keep its side; a
  // level with no module limit (Home) just stacks its children as they are —
  // each one already places itself with its own align/justify.
  const oneModule = level.maxModules === 1
  if (direction !== column.column) {
    problems.push({
      ruleId: 'level.root-direction',
      path: ['root', 'props', column.prop.name],
      message:
        `Level ${level.level} (${level.name}): the outermost <${component.id}> is a column — direction ${JSON.stringify(direction)}, use ${JSON.stringify(column.column)}` +
        (oneModule ? '; put the module on its side with a row inside it (justify "start" or "end").' : '.'),
    })
  }
  if (level.rootEnd) {
    const prop = justifyPropFor(component)
    const value = prop ? propValue(root, prop) : undefined
    // The level-0 notification is always in the top-right corner: its stack starts at the top, not at the end.
    const side = model?.allowsRootStart ? 'start' : 'end'
    if (prop && value !== side) {
      problems.push({
        ruleId: 'level.root-direction',
        path: ['root', 'props', prop.name],
        message: `Level ${level.level} (${level.name}): the stack sits at the ${side} of the frame — root <${component.id}> ${prop.name} ${JSON.stringify(value)}, use "${side}".`,
      })
    }
  }
  return problems
}

function screenOf(doc: Record<string, unknown>): unknown {
  const root = isObject(doc.root) ? (doc.root as { screen?: unknown }) : undefined
  return doc.screen ?? root?.screen
}

/**
 * Where the TV focus starts is what tells the pages apart: the channel button on
 * Home, an interactivity button on the second level, the rounded button on the
 * third. A screen whose level says where focus starts is held to it — an element
 * focused anywhere else, or the named component present with nothing focused.
 */
export function levelFocusProblems(
  manifest: DesignSystemManifest,
  screen: unknown,
  focused: { path: string; component: ManifestComponent; prop: ManifestProp; value: unknown }[],
  seen: ReadonlySet<string>,
): string[] {
  return levelFocusIssues(manifest, screen, focused, seen).map((issue) => issue.message)
}

function levelFocusIssues(
  manifest: DesignSystemManifest,
  screen: unknown,
  focused: { path: string; component: ManifestComponent; prop: ManifestProp; value: unknown }[],
  seen: ReadonlySet<string>,
): RuleProblem[] {
  const layers = screenLayersOf(manifest)
  const model = modelOfScreen(layers, screen)
  const level = model ? navigationLevel(layers, model.level) : undefined
  const rule = level?.initialFocus
  if (!level || !rule) return []
  const on = rule.on.filter((id) => manifest.components[id])
  if (on.length === 0) return []

  const where = `Level ${level.level} (${level.name})`
  const issue = (message: string, code?: RuleProblem['code']): RuleProblem[] => [{ ruleId: 'level.initial-focus', path: ['root'], message, ...(code ? { code } : {}) }]
  const right = (f: (typeof focused)[number]): boolean =>
    rule.accepts?.includes(f.component.id) || (on.includes(f.component.id) && (rule.value === undefined || f.value === rule.value))
  const wrong = focused.filter((f) => !right(f))
  if (wrong.length > 0) {
    return issue(`${where}: focus is on ${wrong.map((f) => `${f.path} <${f.component.id}>`).join(', ')} — ${rule.hint}`)
  }
  if (focused.length === 0 && on.some((id) => seen.has(id))) {
    return issue(`${where}: nothing is focused — ${rule.hint}`, 'nothing-focused')
  }
  if (rule.required && !on.some((id) => seen.has(id))) {
    return issue(`${where}: the screen has no ${on.map((id) => `<${id}>`).join(' or ')} — add one and focus it. ${rule.hint}`)
  }
  return []
}

/**
 * Rests every element a screen's level says can't hold the focus — a Home card
 * drawn focused because it links to the rail, a card focused on the third level.
 * Such a focus has one right answer (rest it), so it is fixed here instead of
 * costing a model retry. Only the level's own rule is applied: a missing focus, or
 * the wrong value on the right component, is a design choice left to the validator.
 * Mutates `doc` (the root and every `screens[]` entry); returns what it changed.
 */
export function restStrayFocus(doc: unknown, manifest: DesignSystemManifest, mode: ScreenMode = 'faithful'): string[] {
  if (!isObject(doc)) return []
  const layers = screenLayersOf(manifest)
  const pages = [
    { root: doc.root, screen: screenOf(doc), where: 'root' },
    ...(Array.isArray(doc.screens) ? doc.screens : []).filter(isObject).map((s, i) => ({
      root: s.root,
      screen: s.screen,
      where: `screens[${i}]`,
    })),
  ]
  const changed: string[] = []
  for (const { root, screen, where } of pages) {
    const model = modelOfScreen(layers, screen)
    const level = model ? navigationLevel(layers, model.level) : undefined
    const on = level?.initialFocus?.on.filter((id) => manifest.components[id]) ?? []
    const accepts = level?.initialFocus?.accepts ?? []
    if (!level || on.length === 0 || !isObject(root)) continue
    // An Exploratory screen that declares where focus starts keeps the focus where it put it.
    if (mode === 'exploratory' && declaresRule(manifest, root, screen, 'level.initial-focus')) continue
    const visit = (node: Record<string, unknown>): void => {
      const component = typeof node.type === 'string' ? manifest.components[node.type] : undefined
      const prop = component && !on.includes(component.id) && !accepts.includes(component.id) ? focusedBy(node, component) : undefined
      if (prop) {
        const rest = unfocusedValue(prop)
        node.props = { ...(isObject(node.props) ? node.props : {}), [prop.name]: rest }
        changed.push(`${where}: <${component!.id}> ${prop.name} → ${JSON.stringify(rest)} (level ${level.level} focuses ${on.join('/')})`)
      }
      childList(node).filter(isObject).forEach(visit)
    }
    visit(root)
  }
  return changed
}

/**
 * Sets every screen's root stack to stretch. The stack that holds the components
 * always stretches (a module places itself inside it), so a root `align` of
 * anything else has one right answer — fixed here instead of costing a model
 * retry. Mutates `doc` (the root and every `screens[]` entry); returns what it changed.
 */
export function stretchRoots(doc: unknown, manifest: DesignSystemManifest, mode: ScreenMode = 'faithful'): string[] {
  if (!isObject(doc)) return []
  const roots = [
    { root: doc.root, screen: doc.screen, where: 'root' },
    ...(Array.isArray(doc.screens) ? doc.screens : [])
      .filter(isObject)
      .map((s, i) => ({ root: s.root, screen: s.screen, where: `screens[${i}]` })),
  ]
  const changed: string[] = []
  for (const { root, screen, where } of roots) {
    if (!isObject(root) || typeof root.type !== 'string') continue
    // An Exploratory screen that declares its root's alignment keeps it.
    if (mode === 'exploratory' && declaresRule(manifest, root, screen, 'layout.root-align')) continue
    const component = manifest.components[root.type]
    const prop = component ? stretchPropFor(component) : undefined
    const value = prop ? propValue(root, prop) : 'stretch'
    if (prop && value !== 'stretch') {
      root.props = { ...(isObject(root.props) ? root.props : {}), [prop.name]: 'stretch' }
      changed.push(`${where}: root <${component!.id}> ${prop.name} ${JSON.stringify(value)} → "stretch"`)
    }
  }
  return changed
}

/** Every failed checklist item as one error string each — the validator's retry signal. */
export function frameLayoutErrors(doc: unknown, manifest: DesignSystemManifest): string[] {
  return frameLayoutIssues(doc, manifest).map((issue) => issue.message)
}

/** The same, each naming its rule and where it sits (relative to `{ screen, root }`). */
export function frameLayoutIssues(doc: unknown, manifest: DesignSystemManifest): RuleProblem[] {
  return auditFrameIssues(doc, manifest, DEFAULT_FRAME_SIZE).flatMap((check) => check.issues)
}
