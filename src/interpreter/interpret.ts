/**
 * The Blueprint DSL interpreter.
 *
 * Takes whatever the AI produced (already shaped like a `BlueprintDocument`, but
 * NOT yet trusted) and turns it into a `CanvasNode` tree that is guaranteed to be
 * renderable by the ComponentRegistry:
 *
 *   - unknown component types are dropped
 *   - unknown props are removed
 *   - props with non-token values are dropped and the registry default is used
 *   - children on a component that can't hold them are dropped
 *   - the document root is forced to be a layout container
 *   - every node gets a fresh, unique id (the model never supplies ids)
 *   - the frame rules hold (`shared/layout/frame.ts`): the root adds no outer
 *     margin and is never statically centered, module groups sit one gutter
 *     apart, and at most one direct child of the root stays anchored
 *   - the root carries a real layer model (the layer rule, Camadas): a missing
 *     or unknown model falls back to Home, and the level follows the model;
 *     the root paints no background, so the video and the overlay show through
 *
 * Every deviation is recorded as an `InterpretIssue` so the UI can show the user
 * exactly what was corrected. The store applies the result in a single `commit`,
 * so one Undo reverts the whole generation.
 */

import type { z } from 'zod'
import {
  BLUEPRINT_DOCUMENT_KEYS,
  BLUEPRINT_NODE_KEYS,
  BLUEPRINT_SCREEN_KEYS,
  DEVIATION_KEY,
  MAX_NOTE_LENGTH,
  MAX_NOTES,
  MAX_SCREENS,
  type BlueprintDocument,
  type BlueprintNode,
  type ScreenMode,
  screenMode,
  unknownBlueprintKeyReason,
} from '@/shared/blueprint'
import { auditDeclared, declarationProblem, treeDeclarations } from '@/shared/design-system/deviations'
import { withVocabulary } from '@/shared/design-system/primitives'
import type { DesignSystemManifest, ManifestComponent, ManifestProp, RuleDeviation, ScreenSide, ScreenSpec } from '@/shared/design-system/manifest'
import { placementError, rootContainerId } from '@/shared/design-system/manifest'
import {
  clearBackgroundFor,
  defaultScreen,
  paintsBackground,
  screenLayersOf,
  screenModel,
  menuFocusCheck,
  sidePropFor,
  unanchorableTypes,
} from '@/shared/design-system/screen-layers'
import { compileManifestSchemas, compiledDefaultProps, propRuleId, propsToZod } from '@/shared/design-system/manifest-zod'
import { SCREENFLOW_MANIFEST } from '@/shared/design-system/screenflow-manifest'
import {
  FRAME,
  allowedSpacingNames,
  centeringPropsFor,
  focusedBy,
  focusPropsFor,
  columnDirectionFor,
  justifyPropFor,
  frameLayoutIssues,
  isModuleGroup,
  unfocusedValue,
  uncenteredValue,
  spacingNameForPx,
  spacingPropFor,
  stretchPropFor,
  spacingPx,
} from '@/shared/layout/frame'
import { levelJumpProblem, linkRoleProblem } from '@/shared/design-system/flow'
import { type CanvasNode, type ScreenEntry, cloneTree, countNodes, createNodeId, makeNode } from '@/model/nodeTree'
import type { RuleId } from '@/shared/design-system/rules'

export interface InterpretIssue {
  level: 'info' | 'warn'
  /** The rule from the book this repair or warning is about, when it is about one. */
  ruleId?: RuleId
  /** Human-readable location, e.g. `root › Stack[1] › Button[0]`. */
  path: string
  message: string
}

export type InterpretResult =
  | { ok: true; tree: CanvasNode; issues: InterpretIssue[]; nodeCount: number; mode: ScreenMode }
  | { ok: false; error: string; issues: InterpretIssue[] }

const SUPPORTED_VERSION = 1

type ObjectSchema = z.ZodObject<z.ZodRawShape>

interface InterpretCtx {
  manifest: DesignSystemManifest
  schemas: Record<string, ObjectSchema>
  rootType: string
  /** The rules this screen is held to: only an Exploratory screen may declare a deviation. */
  mode: ScreenMode
}

/** The pattern rules a node, its ancestors or the screen declare: rule id → the reason given. */
type Declared = ReadonlyMap<string, string>

const NONE: Declared = new Map()

const declaring = (inherited: Declared, deviation: RuleDeviation | undefined): Declared =>
  deviation ? new Map([...inherited, [deviation.ruleId, deviation.why]]) : inherited

/** A repair skipped because the rule is declared: say so, and what was left as written. */
function kept(issues: InterpretIssue[], declared: Declared, ruleId: RuleId, path: string, what: string): void {
  issues.push({
    ruleId,
    level: 'info',
    path,
    message: `Kept ${what} — the screen declares a deviation from "${ruleId}" (${declared.get(ruleId)}).`,
  })
}

/**
 * Runs `repair` on the root unless the screen declares `ruleId`. When it does, the
 * repair runs on a copy only to learn whether it would have changed anything: the
 * notice is for a break that really was left, not for every declaration.
 */
function repairUnlessDeclared(
  ruleId: RuleId,
  declared: Declared,
  root: CanvasNode,
  issues: InterpretIssue[],
  what: string,
  repair: (root: CanvasNode, issues: InterpretIssue[]) => void,
): void {
  if (!declared.has(ruleId)) return repair(root, issues)
  const probe: InterpretIssue[] = []
  repair(cloneTree(root), probe)
  if (probe.length > 0) kept(issues, declared, ruleId, 'root', what)
}

/** What an Exploratory screen's `deviation` list makes of each entry; `issues` (when given) says what was refused. */
function readScreenDeviations(
  raw: unknown,
  manifest: DesignSystemManifest,
  mode: ScreenMode,
  issues?: InterpretIssue[],
): RuleDeviation[] {
  if (!isObject(raw) || raw[DEVIATION_KEY] === undefined) return []
  const list = raw[DEVIATION_KEY]
  if (mode !== 'exploratory') {
    issues?.push({ ruleId: 'blueprint.dsl', level: 'warn', path: 'screen', message: 'Removed "deviation" from the screen — a Faithful screen keeps every pattern.' })
    return []
  }
  if (!Array.isArray(list)) {
    issues?.push({ ruleId: 'blueprint.dsl', level: 'warn', path: 'screen', message: 'Ignored the screen\'s "deviation" — it is a list.' })
    return []
  }
  return list.flatMap((entry, j): RuleDeviation[] => {
    const problem = declarationProblem(manifest, entry, 'screen')
    if (problem) {
      issues?.push({ ruleId: 'blueprint.dsl', level: 'warn', path: 'screen', message: `Ignored the screen's deviation[${j}] — ${problem}` })
      return []
    }
    const { ruleId, why } = entry as RuleDeviation
    return [{ ruleId, why }]
  })
}

/** What a node's `deviation` is worth on a screen of this mode: kept if valid on an Exploratory screen, else removed with a warning. */
function readNodeDeviation(
  raw: unknown,
  type: string,
  path: string,
  ctx: InterpretCtx,
  issues: InterpretIssue[],
): RuleDeviation | undefined {
  if (raw === undefined) return undefined
  if (ctx.mode !== 'exploratory') {
    issues.push({ ruleId: 'blueprint.dsl', level: 'warn', path, message: `Removed "deviation" from <${type}> — a Faithful screen keeps every pattern.` })
    return undefined
  }
  const problem = declarationProblem(ctx.manifest, raw)
  if (problem) {
    issues.push({ ruleId: 'blueprint.dsl', level: 'warn', path, message: `Ignored the deviation on <${type}> — ${problem}` })
    return undefined
  }
  const { ruleId, why } = raw as RuleDeviation
  return { ruleId, why }
}

export function interpretBlueprint(
  input: unknown,
  manifest: DesignSystemManifest = SCREENFLOW_MANIFEST,
): InterpretResult {
  const issues: InterpretIssue[] = []

  if (!isObject(input)) {
    return { ok: false, error: 'Blueprint payload is not an object.', issues }
  }
  const doc = input as Partial<BlueprintDocument>
  if (doc.version !== SUPPORTED_VERSION) {
    return {
      ok: false,
      error: `Unsupported blueprint version: ${JSON.stringify(doc.version)} (expected ${SUPPORTED_VERSION}).`,
      issues,
    }
  }
  if (!isObject(doc.root)) {
    return { ok: false, error: 'Blueprint has no root node.', issues }
  }

  for (const key of Object.keys(input)) {
    if (!BLUEPRINT_DOCUMENT_KEYS.includes(key)) {
      issues.push({ ruleId: 'blueprint.dsl', level: 'info', path: 'document', message: `Ignored "${key}" — ${unknownBlueprintKeyReason(key)}.` })
    }
  }

  const rootType = rootContainerId(manifest)
  if (!rootType) {
    return { ok: false, error: 'The active design system has no container component.', issues }
  }
  // The pipeline stamps the mode; an absent one is a screen built by the Faithful rules.
  const mode = screenMode(doc)
  const ctx: InterpretCtx = {
    // An Exploratory screen knows the vocabulary (primitives, Proposal); a Faithful one drops them as unknown.
    manifest: mode === 'exploratory' ? withVocabulary(manifest) : manifest,
    schemas: compileManifestSchemas(manifest, mode),
    rootType,
    mode,
  }
  // What the screen itself declares reaches every node (its issues are reported by `repairScreen`, in its place below).
  const screenDeclared: Declared = new Map(readScreenDeviations(doc.screen, manifest, mode).map((d) => [d.ruleId, d.why]))

  let root = interpretNode(doc.root, 'root', 0, ctx, issues, screenDeclared)
  if (!root) {
    return { ok: false, error: 'The root node could not be interpreted.', issues }
  }

  // The canvas and the component palette assume the top of the tree is a
  // container they can insert into. Wrap anything else.
  const rootComponent = ctx.manifest.components[root.type]
  if (!rootComponent?.acceptsChildren) {
    issues.push({ ruleId: 'frame.layout',
      level: 'info',
      path: 'root',
      message: `Wrapped <${root.type}> in a ${ctx.rootType} — the top level must be a layout container.`,
    })
    const container = ctx.manifest.components[ctx.rootType]
    root = makeNode(ctx.rootType, compiledDefaultProps(container, ctx.schemas[ctx.rootType]), [root])
  }

  const screen = repairScreen(doc.screen, ctx.manifest, issues, mode)
  const side = screen ? screenModel(screenLayersOf(ctx.manifest), screen.model)?.side : undefined
  // What the root and the screen declare — the rules a root-level repair may leave alone.
  const declared = declaring(screenDeclared, root.deviation)
  repairFrameLayout(root, ctx.manifest, issues, side, declared)
  repairUnlessDeclared('level.root-direction', declared, root, issues, 'the root layout', (r, sink) =>
    repairLevelRoot(r, ctx.manifest, screen, sink),
  )
  repairUnlessDeclared('level.initial-focus', declared, root, issues, 'where focus starts', (r, sink) => {
    repairLevelFocus(r, ctx.manifest, screen, sink)
    repairMenuFocus(r, ctx.manifest, screen, sink)
  })
  repairFocus(root, ctx.manifest, issues)
  if (screen) {
    root.screen = screen
    const painted = paintsBackground(ctx.manifest, root)
    const clear = clearBackgroundFor(ctx.manifest, root)
    if (painted !== null && clear) {
      root.props = { ...root.props, [clear.prop]: clear.clear }
      issues.push({ ruleId: 'layers.stack',
        level: 'info',
        path: 'root',
        message: `Set ${clear.prop} to "${clear.clear}" on the root (was ${brief(painted)}) — the content layer is transparent over the video and the overlay.`,
      })
    }
  }

  // What is left is not guessable (a second content module, a side the model
  // doesn't shade) — say so, so the agent report matches the canvas QA badge. On
  // the interpreted tree, because the repairs above may have resolved violations;
  // an Exploratory screen's declared patterns are held to its declarations.
  const remaining = frameLayoutIssues(treeToBlueprint(root), ctx.manifest)
  if (mode !== 'exploratory') {
    for (const problem of remaining) {
      issues.push({ ruleId: problem.ruleId, level: 'warn', path: 'root', message: `Still breaks a layout rule — ${problem.message}` })
    }
  } else {
    const audit = auditDeclared(remaining, treeDeclarations(root, screen), ctx.manifest)
    const covered = new Set(audit.covered)
    const noticed = new Set(issues.filter((i) => i.level === 'info' && i.message.startsWith('Kept ')).map((i) => i.ruleId))
    for (const problem of remaining) {
      if (!covered.has(problem)) {
        issues.push({ ruleId: problem.ruleId, level: 'warn', path: 'root', message: `Still breaks a layout rule — ${problem.message}` })
      } else if (!noticed.has(problem.ruleId)) {
        noticed.add(problem.ruleId)
        kept(issues, new Map(treeDeclarations(root, screen).map((d) => [d.ruleId, d.why])), problem.ruleId, 'root', `what breaks "${problem.ruleId}"`)
      }
    }
    for (const unused of audit.errors.filter((e) => e.kind === 'unused-deviation')) {
      issues.push({ ruleId: unused.ruleId, level: 'info', path: 'root', message: unused.message })
    }
  }

  return { ok: true, tree: root, issues, nodeCount: countNodes(root), mode }
}

export type PrototypeResult =
  | { ok: true; screens: ScreenEntry[]; issues: InterpretIssue[]; nodeCount: number; linkCount: number; notes: string[] }
  | { ok: false; error: string; issues: InterpretIssue[] }

/**
 * A whole document — its first screen and every further one — interpreted into
 * screens, each repaired exactly as `interpretBlueprint` repairs one. Then the
 * links are held to the flow rules: a `goTo` naming no screen, the screen itself,
 * or a level more than one deeper is dropped, so the player can never open a
 * screen that isn't there or skip a level.
 */
export function interpretPrototype(
  input: unknown,
  manifest: DesignSystemManifest = SCREENFLOW_MANIFEST,
): PrototypeResult {
  const issues: InterpretIssue[] = []
  if (!isObject(input)) return { ok: false, error: 'Blueprint payload is not an object.', issues }

  const first = interpretBlueprint({ version: input.version, screen: input.screen, mode: input.mode, root: input.root }, manifest)
  if (!first.ok) return first
  issues.push(...first.issues)

  const used = new Set<string>()
  const uniqueId = (wanted: unknown, index: number): string => {
    let id = typeof wanted === 'string' && wanted.trim() ? wanted.trim() : `screen-${index + 1}`
    if (used.has(id)) {
      const taken = id
      id = `screen-${index + 1}`
      issues.push({ ruleId: 'blueprint.dsl', level: 'warn', path: `screens[${index}]`, message: `Renamed the screen "${taken}" to "${id}" — ids are unique.` })
    }
    used.add(id)
    return id
  }
  const label = (name: unknown, index: number): string =>
    typeof name === 'string' && name.trim() ? name.trim() : `Screen ${index + 1}`

  const screens: ScreenEntry[] = [
    { id: uniqueId(input.id, 0), name: label(input.name, 0), tree: first.tree, mode: first.mode },
  ]
  let nodeCount = first.nodeCount

  const rest = Array.isArray(input.screens) ? input.screens : []
  if (input.screens !== undefined && !Array.isArray(input.screens)) {
    issues.push({ ruleId: 'blueprint.dsl', level: 'warn', path: 'screens', message: 'Ignored "screens" — it is a list of screens.' })
  }
  rest.forEach((raw: unknown, i: number) => {
    const path = `screens[${i}]`
    if (screens.length >= MAX_SCREENS) {
      issues.push({ ruleId: 'blueprint.dsl', level: 'warn', path, message: `Dropped a screen — a document carries at most ${MAX_SCREENS}.` })
      return
    }
    if (!isObject(raw)) {
      issues.push({ ruleId: 'blueprint.dsl', level: 'warn', path, message: 'Dropped a screen that was not an object.' })
      return
    }
    for (const key of Object.keys(raw)) {
      if (!BLUEPRINT_SCREEN_KEYS.includes(key)) {
        issues.push({ ruleId: 'blueprint.dsl', level: 'info', path, message: `Ignored "${key}" on a screen — the Blueprint DSL has no such key.` })
      }
    }
    const result = interpretBlueprint({ version: 1, screen: raw.screen, mode: raw.mode, root: raw.root }, manifest)
    if (!result.ok) {
      issues.push({ level: 'warn', path, message: `Dropped a screen — ${result.error}` })
      return
    }
    const index = screens.length
    const id = uniqueId(raw.id, index)
    issues.push(...result.issues.map((issue) => ({ ...issue, path: `screen "${id}" › ${issue.path}` })))
    screens.push({ id, name: label(raw.name, index), tree: result.tree, mode: result.mode })
    nodeCount += result.nodeCount
  })

  let linkCount = 0
  for (const from of screens) {
    const drop = (node: CanvasNode, path: string, why: string, ruleId: RuleId): void => {
      delete node.goTo
      issues.push({ ruleId, level: 'warn', path: `screen "${from.id}" › ${path}`, message: `Dropped the link on <${node.type}> — ${why}.` })
    }
    // A link that breaks a flow pattern stays when the link, an element above it or its screen declares that rule.
    const visit = (node: CanvasNode, path: string, inherited: Declared): void => {
      const declared = declaring(inherited, node.deviation)
      if (node.goTo !== undefined) {
        const target = screens.find((s) => s.id === node.goTo)
        if (!target) drop(node, path, `"${node.goTo}" is not a screen of this document`, 'blueprint.dsl')
        else if (target.id === from.id) drop(node, path, 'it links the screen to itself', 'blueprint.dsl')
        else {
          const jump = levelJumpProblem(from.tree.screen?.level, target.tree.screen?.level)
          const role = jump ? null : linkRoleProblem(manifest, node.type, from.tree.screen?.level, target.tree.screen?.level)
          const broken: RuleId | null = jump ? 'flow.next-level' : role ? 'flow.link-roles' : null
          if (broken && declared.has(broken)) {
            kept(issues, declared, broken, `screen "${from.id}" › ${path}`, `the link on <${node.type}>`)
            linkCount += 1
          } else if (jump) drop(node, path, jump, 'flow.next-level')
          else if (role) drop(node, path, role, 'flow.link-roles')
          else linkCount += 1
        }
      }
      node.children.forEach((child, i) => visit(child, `${path} › ${child.type}[${i}]`, declared))
    }
    visit(from.tree, 'root', new Map((from.tree.screen?.deviation ?? []).map((d) => [d.ruleId, d.why])))
  }

  const notes = (Array.isArray(input.notes) ? input.notes : [])
    .filter((n: unknown): n is string => typeof n === 'string' && n.trim().length > 0)
    .map((n: string) => n.trim().slice(0, MAX_NOTE_LENGTH))
    .slice(0, MAX_NOTES)

  return { ok: true, screens, issues, nodeCount, linkCount, notes }
}

/** A canvas tree back to the wire format — ids dropped, the screen spec lifted to the document. */
export function treeToBlueprint(tree: CanvasNode): BlueprintDocument {
  const strip = (node: CanvasNode): BlueprintNode => ({
    type: node.type,
    props: node.props,
    ...(node.children.length ? { children: node.children.map(strip) } : {}),
    ...(node.anchor ? { anchor: true } : {}),
    ...(node.goTo ? { goTo: node.goTo } : {}),
    ...(node.deviation ? { deviation: node.deviation } : {}),
  })
  return { version: 1, ...(tree.screen ? { screen: tree.screen } : {}), root: strip(tree) }
}

/**
 * On a level whose outermost container must be a column (`rootEnd` or
 * `rootColumn`), fix a row root; `rootEnd` levels also pin `justify` to `end` —
 * `rootColumn` levels (Home) leave it alone, since their content can sit at both
 * the top and the bottom (a rail with a notification), not only at the end.
 */
function repairLevelRoot(
  root: CanvasNode,
  manifest: DesignSystemManifest,
  screen: ScreenSpec | undefined,
  issues: InterpretIssue[],
): void {
  const layers = screenLayersOf(manifest)
  const model = screen ? screenModel(layers, screen.model) : undefined
  const level = model ? layers.levels.find((l) => l.level === model.level) : undefined
  const component = manifest.components[root.type]
  if (!(level?.rootEnd || level?.rootColumn) || !component) return
  const column = columnDirectionFor(component)
  if (column && root.props[column.prop.name] !== undefined && root.props[column.prop.name] !== column.column) {
    // A level that shows at most one module: its children become one module in a
    // row inside the column, so the side they sat on is kept. A level with no
    // module limit (Home) just stacks its children as they are — each one
    // already places itself with its own align/justify, so wrapping them
    // together would squeeze them side by side instead.
    if (level.maxModules === 1) {
      const un = root.children.filter((c) => !c.anchor)
      const anchored = root.children.filter((c) => c.anchor)
      const stretch = stretchPropFor(component)
      const wrapper = makeNode(root.type, { ...root.props, ...(stretch ? { [stretch.name]: 'end' } : {}) }, un)
      root.children = [wrapper, ...anchored]
      root.props = { ...root.props, [column.prop.name]: column.column, ...(stretch ? { [stretch.name]: 'stretch' } : {}) }
      issues.push({ ruleId: 'level.root-direction',
        level: 'info',
        path: 'root',
        message: `Made the root a column and moved its content into a row inside it — on level ${level.level} the stack is a column at the end of the frame.`,
      })
    } else {
      root.props = { ...root.props, [column.prop.name]: column.column }
      issues.push({ ruleId: 'level.root-direction',
        level: 'info',
        path: 'root',
        message: `Made the root a column, keeping its children stacked in order — on level ${level.level} the outermost container must be a column.`,
      })
    }
  }
  if (!level.rootEnd) return
  const prop = justifyPropFor(component)
  if (!prop || root.props[prop.name] === 'end') return
  issues.push({ ruleId: 'level.root-direction',
    level: 'info',
    path: 'root',
    message: `Set ${prop.name} to "end" on the root (was ${brief(root.props[prop.name])}) — the stack on level ${level.level} sits at the end of the frame.`,
  })
  root.props = { ...root.props, [prop.name]: 'end' }
}

/**
 * Where focus starts is what tells the pages apart (Home: the channel button; the
 * second level: an interactivity button; the third: the rounded button). When the
 * screen's level says where, the component it names takes the focus and every
 * other focused element rests.
 */
function repairLevelFocus(
  root: CanvasNode,
  manifest: DesignSystemManifest,
  screen: ScreenSpec | undefined,
  issues: InterpretIssue[],
): void {
  const layers = screenLayersOf(manifest)
  const model = screen ? screenModel(layers, screen.model) : undefined
  const rule = model ? layers.levels.find((l) => l.level === model.level)?.initialFocus : undefined
  if (!rule) return

  const all: CanvasNode[] = []
  const collect = (node: CanvasNode): void => {
    all.push(node)
    node.children.forEach(collect)
  }
  collect(root)

  const isTarget = (node: CanvasNode): boolean => {
    const component = manifest.components[node.type]
    if (!component || !rule.on.includes(node.type)) return false
    const prop = focusedBy(node, component)
    return !!prop && (rule.value === undefined || node.props[prop.name] === rule.value)
  }
  const candidates = all.filter((node) => rule.on.includes(node.type) && manifest.components[node.type])
  if (candidates.length === 0) return
  const target = candidates.find(isTarget) ?? candidates[0]

  for (const node of all) {
    const component = manifest.components[node.type]
    const prop = component ? focusedBy(node, component) : undefined
    if (!prop || node === target) continue
    const rest = unfocusedValue(prop)
    node.props = { ...node.props, [prop.name]: rest }
    issues.push({ ruleId: 'level.initial-focus',
      level: 'warn',
      path: 'root',
      message: `Set ${prop.name} to "${rest}" on <${node.type}> — ${rule.hint}`,
    })
  }

  if (!isTarget(target)) {
    const component = manifest.components[target.type]
    const prop = focusPropsFor(component).find((p) => rule.value === undefined ? p.options?.includes('focus') : true)
    if (!prop) return
    const value = rule.value ?? 'focus'
    target.props = { ...target.props, [prop.name]: value }
    issues.push({ ruleId: 'level.initial-focus',
      level: 'warn',
      path: 'root',
      message: `Set ${prop.name} to "${value}" on <${target.type}> — ${rule.hint}`,
    })
  }
}

/** Home: the menu button that owns the rail on screen holds the focus (program by default). */
function repairMenuFocus(
  root: CanvasNode,
  manifest: DesignSystemManifest,
  screen: ScreenSpec | undefined,
  issues: InterpretIssue[],
): void {
  const layers = screenLayersOf(manifest)
  if (!screen || screenModel(layers, screen.model)?.level !== 1 || !layers.menu) return
  const check = menuFocusCheck(manifest, root)
  if (!check || check.allowed.includes(String(check.found)) || check.allowed.length !== 1) return
  const menu = check.menu as CanvasNode
  const value = check.allowed[0]
  menu.props = { ...menu.props, [layers.menu.prop]: value }
  issues.push({ ruleId: 'level.initial-focus',
    level: 'warn',
    path: 'root',
    message: `Set ${layers.menu.prop} to "${value}" on <${menu.type}> — when Home opens, the focus is on the program button.`,
  })
}

/** One focused element per screen: keep the first in reading order, rest the others. */
function repairFocus(root: CanvasNode, manifest: DesignSystemManifest, issues: InterpretIssue[]): void {
  let kept: CanvasNode | null = null
  const visit = (node: CanvasNode): void => {
    const component = manifest.components[node.type]
    const prop = component ? focusedBy(node, component) : undefined
    if (prop) {
      if (!kept) {
        kept = node
      } else {
        const rest = unfocusedValue(prop)
        node.props = { ...node.props, [prop.name]: rest }
        issues.push({ ruleId: 'focus.single',
          level: 'warn',
          path: 'root',
          message: `Set ${prop.name} to "${rest}" on <${node.type}> — a TV screen focuses one element, and <${kept.type}> already has it.`,
        })
      }
    }
    node.children.forEach(visit)
  }
  visit(root)
}

/**
 * The layer rule: a real model, on its own level. What the content does with it
 * (module count, side) is left for the canvas QA to show — it isn't guessable.
 */
function repairScreen(
  raw: unknown,
  manifest: DesignSystemManifest,
  issues: InterpretIssue[],
  mode: ScreenMode,
): ScreenSpec | undefined {
  const layers = screenLayersOf(manifest)
  const fallbackScreen = defaultScreen(layers)
  if (!fallbackScreen) return undefined
  const deviation = readScreenDeviations(raw, manifest, mode, issues)
  const withDeviation = (spec: ScreenSpec): ScreenSpec => (deviation.length > 0 ? { ...spec, deviation } : spec)
  const fallback = fallbackScreen
  const model = isObject(raw) ? screenModel(layers, raw.model) : undefined
  if (!model) {
    const fallbackName = screenModel(layers, fallback.model)?.name ?? fallback.model
    issues.push({ ruleId: 'layers.overlay-model',
      level: 'warn',
      path: 'screen',
      message:
        raw === undefined
          ? `The screen named no layer model — used ${fallbackName} (level ${fallback.level}).`
          : `Unknown layer model ${brief(isObject(raw) ? raw.model : raw)} — used ${fallbackName} (level ${fallback.level}).`,
    })
    return withDeviation(fallback)
  }
  if (isObject(raw) && raw.level !== model.level) {
    issues.push({ ruleId: 'layers.overlay-model',
      level: 'info',
      path: 'screen',
      message: `Set the level to ${model.level} — ${model.name} is a level ${model.level} screen (was ${brief(raw.level)}).`,
    })
  }
  return withDeviation({ model: model.id, level: model.level })
}

function interpretNode(
  raw: unknown,
  path: string,
  depth: number,
  ctx: InterpretCtx,
  issues: InterpretIssue[],
  inherited: Declared,
): CanvasNode | null {
  if (!isObject(raw)) {
    issues.push({ ruleId: 'blueprint.dsl', level: 'warn', path, message: 'Dropped a node that was not an object.' })
    return null
  }

  const type = raw.type
  if (typeof type !== 'string') {
    issues.push({ ruleId: 'blueprint.dsl', level: 'warn', path, message: 'Dropped a node with no "type".' })
    return null
  }

  const component = ctx.manifest.components[type]
  if (!component) {
    issues.push({ ruleId: 'component.api', level: 'warn', path, message: `Dropped unknown component <${type}>.` })
    return null
  }
  for (const key of Object.keys(raw)) {
    if (!BLUEPRINT_NODE_KEYS.includes(key) && key !== DEVIATION_KEY) {
      issues.push({ ruleId: 'blueprint.dsl', level: 'info', path, message: `Ignored "${key}" on <${type}> — ${unknownBlueprintKeyReason(key)}.` })
    }
  }
  const deviation = readNodeDeviation(raw[DEVIATION_KEY], type, path, ctx, issues)
  const declared = declaring(inherited, deviation)

  // Text written where the child nodes go belongs in the component's own
  // `children` prop, when it has one (a Storybook import's Text, Heading…).
  let rawProps = raw.props
  if (raw.children !== undefined && !Array.isArray(raw.children)) {
    const props = isObject(raw.props) ? raw.props : {}
    if (typeof raw.children === 'string' && 'children' in component.props && props.children === undefined) {
      rawProps = { ...props, children: raw.children }
      issues.push({ ruleId: 'component.api', level: 'info', path, message: `Moved the text in "children" into <${type}>'s children prop.` })
    } else {
      issues.push({ ruleId: 'component.api', level: 'warn', path, message: `Dropped "children" on <${type}> — it is a list of nodes.` })
    }
  }
  const props = sanitizeProps(ctx.manifest, component, ctx.schemas[type], rawProps, path, issues)

  const rawChildren = Array.isArray(raw.children) ? (raw.children as unknown[]) : []
  let children: CanvasNode[] = []
  if (rawChildren.length > 0 && !component.acceptsChildren) {
    issues.push({ ruleId: 'component.api',
      level: 'warn',
      path,
      message: `<${type}> can't contain children — dropped ${rawChildren.length}.`,
    })
  } else if (component.acceptsChildren) {
    children = rawChildren
      .map((child, i) => interpretNode(child, `${path} › ${type}[${i}]`, depth + 1, ctx, issues, declared))
      .filter((child): child is CanvasNode => child !== null)
    children = placeChildren(type, children, path, ctx.manifest, issues, declared)
  }

  const node: CanvasNode = { id: createNodeId(), type, props, children }
  if (deviation) node.deviation = deviation
  if (typeof raw.goTo === 'string' && raw.goTo.trim()) {
    node.goTo = raw.goTo.trim() // resolved against the document's screens by `interpretPrototype`
  } else if (raw.goTo !== undefined) {
    issues.push({ ruleId: 'blueprint.dsl', level: 'warn', path, message: `Ignored goTo=${brief(raw.goTo)} on <${type}> (must be a screen id).` })
  }
  if (raw.anchor === true) {
    if (depth === 1) {
      node.anchor = true
    } else {
      issues.push({ ruleId: 'layout.anchor-structure',
        level: 'warn',
        path,
        message: `Removed "anchor" from <${type}> — only a direct child of the root can be anchored.`,
      })
    }
  } else if (raw.anchor !== undefined && raw.anchor !== false) {
    issues.push({ ruleId: 'layout.anchor-structure',
      level: 'warn',
      path,
      message: `Ignored anchor=${brief(raw.anchor)} on <${type}> (must be true or omitted).`,
    })
  }
  return node
}

function sanitizeProps(
  manifest: DesignSystemManifest,
  component: ManifestComponent,
  schema: ObjectSchema,
  rawProps: unknown,
  path: string,
  issues: InterpretIssue[],
): Record<string, unknown> {
  const shape = schema.shape as Record<string, z.ZodTypeAny>
  const provided = isObject(rawProps) ? (rawProps as Record<string, unknown>) : {}
  const clean: Record<string, unknown> = {}

  for (const [key, fieldSchema] of Object.entries(shape)) {
    if (!(key in provided)) continue
    let result = fieldSchema.safeParse(provided[key])
    // A list of items with fields (a menu's items): repair item by item, so one bad
    // item costs that item — or just its bad field — and not the whole list.
    const spec = component.props[key]
    if (!result.success && spec?.fields && Array.isArray(provided[key])) {
      const repaired = repairList(manifest, component, key, spec, provided[key] as unknown[], path, issues)
      const again = fieldSchema.safeParse(repaired)
      if (again.success) {
        clean[key] = again.data
        continue
      }
      result = again // what is left is the list's own limit (too many items): the whole prop falls back
    }
    if (result.success) {
      clean[key] = result.data
    } else {
      issues.push({
        ruleId: propRuleId(manifest, component.props[key], provided[key]),
        level: 'warn',
        path,
        message: `Ignored ${key}=${brief(provided[key])} on <${component.id}> (not an allowed value) — kept the default.`,
      })
    }
  }

  for (const key of Object.keys(provided)) {
    if (!(key in shape)) {
      issues.push({ ruleId: 'component.api',
        level: 'warn',
        path,
        message: `Removed unsupported prop "${key}" from <${component.id}>.`,
      })
    }
  }

  // Seed every declared prop so a manifest with required, default-less props still
  // parses; `clean` only holds valid provided values. A prop with no default a schema
  // accepts (a Proposal's required map) has nothing honest to seed: the node keeps what
  // it has, and the validator has already reported it.
  const seeded = { ...compiledDefaultProps(component, schema), ...clean }
  const parsed = schema.safeParse(seeded)
  return (parsed.success ? parsed.data : seeded) as Record<string, unknown>
}

/**
 * The repair of a list prop whose items have fields. An item that is not an object,
 * or whose bad field is required and has no default to fall back to, is dropped
 * (there is no honest value to keep it by); an item whose bad field is optional or
 * has a default keeps everything else, and only that field falls back. Every
 * change is a warning naming the node and the field.
 */
function repairList(
  manifest: DesignSystemManifest,
  component: ManifestComponent,
  key: string,
  spec: ManifestProp,
  list: unknown[],
  path: string,
  issues: InterpretIssue[],
): unknown[] {
  const fields = spec.fields ?? {}
  const item = propsToZod(fields, manifest)
  const warn = (message: string): void => {
    issues.push({ ruleId: 'component.api', level: 'warn', path, message })
  }
  const kept: unknown[] = []
  list.forEach((raw, i) => {
    const where = `${key}[${i}]`
    if (!isObject(raw)) {
      warn(`Dropped ${where} on <${component.id}> — an item is an object with ${Object.keys(fields).join(', ')}.`)
      return
    }
    const current: Record<string, unknown> = { ...raw }
    for (const name of Object.keys(current)) {
      if (name in fields) continue
      delete current[name]
      warn(`Removed unsupported field "${name}" from ${where} on <${component.id}>.`)
    }
    let parsed = item.safeParse(current)
    if (!parsed.success) {
      for (const name of new Set(parsed.error.issues.map((issue) => String(issue.path[0])))) {
        const field = fields[name]
        if (!field || (field.required && field.defaultValue === undefined)) {
          warn(
            `Dropped ${where} on <${component.id}> — "${name}" is required and ${brief(current[name])} is not an allowed value, so there is no default to keep the item by.`,
          )
          return
        }
        warn(`Ignored ${where}.${name}=${brief(current[name])} on <${component.id}> (not an allowed value) — kept the default.`)
        delete current[name]
      }
      parsed = item.safeParse(current)
      if (!parsed.success) {
        warn(`Dropped ${where} on <${component.id}> — it is not an allowed item.`)
        return
      }
    }
    kept.push(parsed.data)
  })
  return kept
}

/**
 * The frame rules a per-prop schema can't express, because they depend on where
 * a node sits: the root adds no outer margin and isn't statically centered,
 * module groups sit one gutter apart, and at most one direct child of the root is
 * anchored.
 */
function repairFrameLayout(
  root: CanvasNode,
  manifest: DesignSystemManifest,
  issues: InterpretIssue[],
  side?: ScreenSide,
  declared: Declared = NONE,
): void {
  const component = manifest.components[root.type]
  const padding = component ? spacingPropFor(component, 'margin') : undefined
  if (padding) {
    const px = spacingPx(manifest, root.props[padding.name])
    const zero = spacingNameForPx(manifest, allowedSpacingNames(manifest, padding), 0)
    if (px !== null && px !== 0 && zero) {
      issues.push({ ruleId: 'frame.layout',
        level: 'info',
        path: 'root',
        message: `Set ${padding.name} to "${zero}" on the root — the frame already applies the ${FRAME.margin}px safe-area margin.`,
      })
      root.props = { ...root.props, [padding.name]: zero }
    }
  }

  // The stack that holds the components always stretches: the content layer spans
  // the frame, and a module that belongs on one side positions itself inside it.
  const stretch = component ? stretchPropFor(component) : undefined
  if (stretch && root.props[stretch.name] !== undefined && root.props[stretch.name] !== 'stretch' && declared.has('layout.root-align')) {
    kept(issues, declared, 'layout.root-align', 'root', `${stretch.name} ${brief(root.props[stretch.name])} on the root`)
  } else if (stretch && root.props[stretch.name] !== undefined && root.props[stretch.name] !== 'stretch') {
    issues.push({ ruleId: 'layout.root-align',
      level: 'info',
      path: 'root',
      message: `Set ${stretch.name} to "stretch" on the root (was ${brief(root.props[stretch.name])}) — the stack that holds the components always stretches.`,
    })
    root.props = { ...root.props, [stretch.name]: 'stretch' }
  }

  // Un-centering a prop that has no stretch (a row's justify) lands on the side
  // the screen model shades, so the repair can't break the layer rule.
  const sideProp = side ? sidePropFor(manifest, root) : null
  for (const prop of component ? centeringPropsFor(component) : []) {
    if (prop === stretch || root.props[prop.name] !== 'center') continue
    if (declared.has('layout.no-static-center')) {
      kept(issues, declared, 'layout.no-static-center', 'root', `${prop.name} "center" on the root`)
      continue
    }
    const value = side && sideProp?.prop === prop.name ? sideProp.values[side] : uncenteredValue(prop)
    issues.push({ ruleId: 'layout.no-static-center',
      level: 'info',
      path: 'root',
      message: `Set ${prop.name} to "${value}" on the root — master layouts don't use static center alignment; the anchored group follows the focus instead.`,
    })
    root.props = { ...root.props, [prop.name]: value }
  }

  repairGutters(root, 'root', 0, manifest, issues)

  const never = unanchorableTypes(manifest)
  for (const child of root.children) {
    if (child.anchor && never.has(child.type)) {
      delete child.anchor
      issues.push({ ruleId: 'layout.anchor-structure',
        level: 'warn',
        path: 'root',
        message: `Un-anchored <${child.type}> — it holds the screen's focus in the content; only a secondary cluster is anchored.`,
      })
    }
  }

  const anchored = root.children.filter((child) => child.anchor)
  if (anchored.length > 1 && declared.has('layout.anchor')) {
    kept(issues, declared, 'layout.anchor', 'root', `${anchored.length} anchored groups`)
    return
  }
  for (const extra of anchored.slice(0, -1)) {
    delete extra.anchor
    issues.push({ ruleId: 'layout.anchor',
      level: 'warn',
      path: 'root',
      message: `Un-anchored an extra <${extra.type}> — a frame anchors at most one element group (kept the last).`,
    })
  }
}

function repairGutters(
  node: CanvasNode,
  path: string,
  depth: number,
  manifest: DesignSystemManifest,
  issues: InterpretIssue[],
): void {
  const component = manifest.components[node.type]
  const gap = component?.acceptsChildren ? spacingPropFor(component, 'gutter') : undefined
  if (gap && isModuleGroup(node, depth, manifest)) {
    const px = spacingPx(manifest, node.props[gap.name])
    const gutter = spacingNameForPx(manifest, allowedSpacingNames(manifest, gap), FRAME.gutter)
    if (px !== null && px !== FRAME.gutter && gutter) {
      issues.push({ ruleId: 'frame.layout',
        level: 'info',
        path,
        message: `Set ${gap.name} to "${gutter}" on <${node.type}> — stacked modules and columns sit exactly ${FRAME.gutter}px apart.`,
      })
      node.props = { ...node.props, [gap.name]: gutter }
    }
  }
  // Inside a module (a card, a menu) the spacing is the module's own, not a gutter.
  if (node.type !== rootContainerId(manifest)) return
  node.children.forEach((child, i) =>
    repairGutters(child, `${path} › ${node.type}[${i}]`, depth + 1, manifest, issues),
  )
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function brief(value: unknown): string {
  const str = typeof value === 'string' ? `"${value}"` : JSON.stringify(value)
  return str && str.length > 32 ? `${str.slice(0, 32)}…` : String(str)
}

/**
 * Repairs a container's children against the one placement rule the validator
 * enforces: drop what can't sit here, then — for a component with slots, like a
 * Content Card — keep the first of each zone and put them back in slot order.
 */
function placeChildren(
  parentType: string,
  children: CanvasNode[],
  path: string,
  manifest: DesignSystemManifest,
  issues: InterpretIssue[],
  declared: Declared = NONE,
): CanvasNode[] {
  // A slot break is left as written when the parent, an ancestor, the screen or the child itself declares it.
  const waived = (child?: CanvasNode): string | undefined =>
    child?.deviation?.ruleId === 'layout.slots' ? child.deviation.why : declared.get('layout.slots')
  const keep = (child: CanvasNode | undefined, what: string): boolean => {
    const why = waived(child)
    if (why === undefined) return false
    kept(issues, new Map([['layout.slots', why]]), 'layout.slots', path, what)
    return true
  }

  const placed = children.filter((child) => {
    const problem = placementError(manifest, parentType, child.type)
    if (problem && keep(child, `<${child.type}> inside <${parentType}>`)) return true
    if (problem) issues.push({ ruleId: 'layout.slots', level: 'warn', path, message: `Dropped a child — ${problem}` })
    return !problem
  })

  const slots = manifest.components[parentType]?.slots
  if (!slots) return placed

  const seen = new Set<string>()
  const unique = placed.filter((child) => {
    if (!seen.has(child.type)) {
      seen.add(child.type)
      return true
    }
    if (keep(child, `a second <${child.type}> in <${parentType}>`)) return true
    issues.push({ ruleId: 'layout.slots', level: 'warn', path, message: `Dropped a second <${child.type}> — <${parentType}> takes at most one.` })
    return false
  })
  const ordered = [...unique].sort((a, b) => slots.indexOf(a.type) - slots.indexOf(b.type))
  if (ordered.some((child, i) => child !== unique[i])) {
    if (keep(undefined, `<${parentType}>'s children in the order written`)) return unique
    issues.push({ ruleId: 'layout.slots', level: 'warn', path, message: `Put <${parentType}>'s children back in the order ${slots.join(', ')}.` })
  }
  return ordered
}
