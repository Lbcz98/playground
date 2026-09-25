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
  MAX_NOTE_LENGTH,
  MAX_NOTES,
  MAX_SCREENS,
  type BlueprintDocument,
  type BlueprintNode,
  unknownBlueprintKeyReason,
} from '@/shared/blueprint'
import type { DesignSystemManifest, ManifestComponent, ScreenSide, ScreenSpec } from '@/shared/design-system/manifest'
import { placementError, rootContainerId } from '@/shared/design-system/manifest'
import {
  clearBackgroundFor,
  defaultScreen,
  paintsBackground,
  screenLayersOf,
  screenModel,
  sidePropFor,
  unanchorableTypes,
} from '@/shared/design-system/screen-layers'
import { compileManifestSchemas, compiledDefaultProps } from '@/shared/design-system/manifest-zod'
import { SCREENFLOW_MANIFEST } from '@/shared/design-system/screenflow-manifest'
import {
  FRAME,
  allowedSpacingNames,
  centeringPropsFor,
  focusedBy,
  focusPropsFor,
  columnDirectionFor,
  justifyPropFor,
  frameLayoutErrors,
  isModuleGroup,
  unfocusedValue,
  uncenteredValue,
  spacingNameForPx,
  spacingPropFor,
  stretchPropFor,
  spacingPx,
} from '@/shared/layout/frame'
import { levelJumpProblem, linkRoleProblem } from '@/shared/design-system/flow'
import { type CanvasNode, type ScreenEntry, countNodes, createNodeId, makeNode } from '@/model/nodeTree'

export interface InterpretIssue {
  level: 'info' | 'warn'
  /** Human-readable location, e.g. `root › Stack[1] › Button[0]`. */
  path: string
  message: string
}

export type InterpretResult =
  | { ok: true; tree: CanvasNode; issues: InterpretIssue[]; nodeCount: number }
  | { ok: false; error: string; issues: InterpretIssue[] }

const SUPPORTED_VERSION = 1

type ObjectSchema = z.ZodObject<z.ZodRawShape>

interface InterpretCtx {
  manifest: DesignSystemManifest
  schemas: Record<string, ObjectSchema>
  rootType: string
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
      issues.push({ level: 'info', path: 'document', message: `Ignored "${key}" — ${unknownBlueprintKeyReason(key)}.` })
    }
  }

  const rootType = rootContainerId(manifest)
  if (!rootType) {
    return { ok: false, error: 'The active design system has no container component.', issues }
  }
  const ctx: InterpretCtx = {
    manifest,
    schemas: compileManifestSchemas(manifest),
    rootType,
  }

  let root = interpretNode(doc.root, 'root', 0, ctx, issues)
  if (!root) {
    return { ok: false, error: 'The root node could not be interpreted.', issues }
  }

  // The canvas and the component palette assume the top of the tree is a
  // container they can insert into. Wrap anything else.
  const rootComponent = ctx.manifest.components[root.type]
  if (!rootComponent?.acceptsChildren) {
    issues.push({
      level: 'info',
      path: 'root',
      message: `Wrapped <${root.type}> in a ${ctx.rootType} — the top level must be a layout container.`,
    })
    const container = ctx.manifest.components[ctx.rootType]
    root = makeNode(ctx.rootType, compiledDefaultProps(container, ctx.schemas[ctx.rootType]), [root])
  }

  const screen = repairScreen(doc.screen, ctx.manifest, issues)
  const side = screen ? screenModel(screenLayersOf(ctx.manifest), screen.model)?.side : undefined
  repairFrameLayout(root, ctx.manifest, issues, side)
  repairLevelRoot(root, ctx.manifest, screen, issues)
  repairLevelFocus(root, ctx.manifest, screen, issues)
  repairFocus(root, ctx.manifest, issues)
  if (screen) {
    root.screen = screen
    const painted = paintsBackground(ctx.manifest, root)
    const clear = clearBackgroundFor(ctx.manifest, root)
    if (painted !== null && clear) {
      root.props = { ...root.props, [clear.prop]: clear.clear }
      issues.push({
        level: 'info',
        path: 'root',
        message: `Set ${clear.prop} to "${clear.clear}" on the root (was ${brief(painted)}) — the content layer is transparent over the video and the overlay.`,
      })
    }
  }

  // What is left is not guessable (a second content module, a side the model
  // doesn't shade) — say so, so the agent report matches the canvas QA badge.
  for (const problem of frameLayoutErrors(treeToBlueprint(root), ctx.manifest)) {
    issues.push({ level: 'warn', path: 'root', message: `Still breaks a layout rule — ${problem}` })
  }

  return { ok: true, tree: root, issues, nodeCount: countNodes(root) }
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

  const first = interpretBlueprint({ version: input.version, screen: input.screen, root: input.root }, manifest)
  if (!first.ok) return first
  issues.push(...first.issues)

  const used = new Set<string>()
  const uniqueId = (wanted: unknown, index: number): string => {
    let id = typeof wanted === 'string' && wanted.trim() ? wanted.trim() : `screen-${index + 1}`
    if (used.has(id)) {
      const taken = id
      id = `screen-${index + 1}`
      issues.push({ level: 'warn', path: `screens[${index}]`, message: `Renamed the screen "${taken}" to "${id}" — ids are unique.` })
    }
    used.add(id)
    return id
  }
  const label = (name: unknown, index: number): string =>
    typeof name === 'string' && name.trim() ? name.trim() : `Screen ${index + 1}`

  const screens: ScreenEntry[] = [
    { id: uniqueId(input.id, 0), name: label(input.name, 0), tree: first.tree },
  ]
  let nodeCount = first.nodeCount

  const rest = Array.isArray(input.screens) ? input.screens : []
  if (input.screens !== undefined && !Array.isArray(input.screens)) {
    issues.push({ level: 'warn', path: 'screens', message: 'Ignored "screens" — it is a list of screens.' })
  }
  rest.forEach((raw: unknown, i: number) => {
    const path = `screens[${i}]`
    if (screens.length >= MAX_SCREENS) {
      issues.push({ level: 'warn', path, message: `Dropped a screen — a document carries at most ${MAX_SCREENS}.` })
      return
    }
    if (!isObject(raw)) {
      issues.push({ level: 'warn', path, message: 'Dropped a screen that was not an object.' })
      return
    }
    for (const key of Object.keys(raw)) {
      if (!BLUEPRINT_SCREEN_KEYS.includes(key)) {
        issues.push({ level: 'info', path, message: `Ignored "${key}" on a screen — the Blueprint DSL has no such key.` })
      }
    }
    const result = interpretBlueprint({ version: 1, screen: raw.screen, root: raw.root }, manifest)
    if (!result.ok) {
      issues.push({ level: 'warn', path, message: `Dropped a screen — ${result.error}` })
      return
    }
    const index = screens.length
    const id = uniqueId(raw.id, index)
    issues.push(...result.issues.map((issue) => ({ ...issue, path: `screen "${id}" › ${issue.path}` })))
    screens.push({ id, name: label(raw.name, index), tree: result.tree })
    nodeCount += result.nodeCount
  })

  let linkCount = 0
  for (const from of screens) {
    const drop = (node: CanvasNode, path: string, why: string): void => {
      delete node.goTo
      issues.push({ level: 'warn', path: `screen "${from.id}" › ${path}`, message: `Dropped the link on <${node.type}> — ${why}.` })
    }
    const visit = (node: CanvasNode, path: string): void => {
      if (node.goTo !== undefined) {
        const target = screens.find((s) => s.id === node.goTo)
        if (!target) drop(node, path, `"${node.goTo}" is not a screen of this document`)
        else if (target.id === from.id) drop(node, path, 'it links the screen to itself')
        else {
          const jump =
            levelJumpProblem(from.tree.screen?.level, target.tree.screen?.level) ??
            linkRoleProblem(manifest, node.type, from.tree.screen?.level, target.tree.screen?.level)
          if (jump) drop(node, path, jump)
          else linkCount += 1
        }
      }
      node.children.forEach((child, i) => visit(child, `${path} › ${child.type}[${i}]`))
    }
    visit(from.tree, 'root')
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
  })
  return { version: 1, ...(tree.screen ? { screen: tree.screen } : {}), root: strip(tree) }
}

/** On the levels whose stack sits at the end of the frame, the root's `justify` is `end`. */
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
  const prop = level?.rootEnd && component ? justifyPropFor(component) : undefined
  if (!prop) return
  const column = component ? columnDirectionFor(component) : undefined
  if (column && root.props[column.prop.name] !== undefined && root.props[column.prop.name] !== column.column) {
    // A row root: its children become one module in a row inside the column, so
    // the side they sat on is kept.
    const un = root.children.filter((c) => !c.anchor)
    const anchored = root.children.filter((c) => c.anchor)
    const stretch = stretchPropFor(component!)
    const wrapper = makeNode(root.type, { ...root.props, ...(stretch ? { [stretch.name]: 'end' } : {}) }, un)
    root.children = [wrapper, ...anchored]
    root.props = { ...root.props, [column.prop.name]: column.column, ...(stretch ? { [stretch.name]: 'stretch' } : {}) }
    issues.push({
      level: 'info',
      path: 'root',
      message: `Made the root a column and moved its content into a row inside it — on level ${level?.level} the stack is a column at the end of the frame.`,
    })
  }
  if (root.props[prop.name] === 'end') return
  issues.push({
    level: 'info',
    path: 'root',
    message: `Set ${prop.name} to "end" on the root (was ${brief(root.props[prop.name])}) — the stack on level ${level?.level} sits at the end of the frame.`,
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
    issues.push({
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
    issues.push({
      level: 'warn',
      path: 'root',
      message: `Set ${prop.name} to "${value}" on <${target.type}> — ${rule.hint}`,
    })
  }
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
        issues.push({
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
): ScreenSpec | undefined {
  const layers = screenLayersOf(manifest)
  const fallback = defaultScreen(layers)
  if (!fallback) return undefined
  const model = isObject(raw) ? screenModel(layers, raw.model) : undefined
  if (!model) {
    const fallbackName = screenModel(layers, fallback.model)?.name ?? fallback.model
    issues.push({
      level: 'warn',
      path: 'screen',
      message:
        raw === undefined
          ? `The screen named no layer model — used ${fallbackName} (level ${fallback.level}).`
          : `Unknown layer model ${brief(isObject(raw) ? raw.model : raw)} — used ${fallbackName} (level ${fallback.level}).`,
    })
    return fallback
  }
  if (isObject(raw) && raw.level !== model.level) {
    issues.push({
      level: 'info',
      path: 'screen',
      message: `Set the level to ${model.level} — ${model.name} is a level ${model.level} screen (was ${brief(raw.level)}).`,
    })
  }
  return { model: model.id, level: model.level }
}

function interpretNode(
  raw: unknown,
  path: string,
  depth: number,
  ctx: InterpretCtx,
  issues: InterpretIssue[],
): CanvasNode | null {
  if (!isObject(raw)) {
    issues.push({ level: 'warn', path, message: 'Dropped a node that was not an object.' })
    return null
  }

  const type = raw.type
  if (typeof type !== 'string') {
    issues.push({ level: 'warn', path, message: 'Dropped a node with no "type".' })
    return null
  }

  const component = ctx.manifest.components[type]
  if (!component) {
    issues.push({ level: 'warn', path, message: `Dropped unknown component <${type}>.` })
    return null
  }
  for (const key of Object.keys(raw)) {
    if (!BLUEPRINT_NODE_KEYS.includes(key)) {
      issues.push({ level: 'info', path, message: `Ignored "${key}" on <${type}> — ${unknownBlueprintKeyReason(key)}.` })
    }
  }

  // Text written where the child nodes go belongs in the component's own
  // `children` prop, when it has one (a Storybook import's Text, Heading…).
  let rawProps = raw.props
  if (raw.children !== undefined && !Array.isArray(raw.children)) {
    const props = isObject(raw.props) ? raw.props : {}
    if (typeof raw.children === 'string' && 'children' in component.props && props.children === undefined) {
      rawProps = { ...props, children: raw.children }
      issues.push({ level: 'info', path, message: `Moved the text in "children" into <${type}>'s children prop.` })
    } else {
      issues.push({ level: 'warn', path, message: `Dropped "children" on <${type}> — it is a list of nodes.` })
    }
  }
  const props = sanitizeProps(component, ctx.schemas[type], rawProps, path, issues)

  const rawChildren = Array.isArray(raw.children) ? (raw.children as unknown[]) : []
  let children: CanvasNode[] = []
  if (rawChildren.length > 0 && !component.acceptsChildren) {
    issues.push({
      level: 'warn',
      path,
      message: `<${type}> can't contain children — dropped ${rawChildren.length}.`,
    })
  } else if (component.acceptsChildren) {
    children = rawChildren
      .map((child, i) => interpretNode(child, `${path} › ${type}[${i}]`, depth + 1, ctx, issues))
      .filter((child): child is CanvasNode => child !== null)
    children = placeChildren(type, children, path, ctx.manifest, issues)
  }

  const node: CanvasNode = { id: createNodeId(), type, props, children }
  if (typeof raw.goTo === 'string' && raw.goTo.trim()) {
    node.goTo = raw.goTo.trim() // resolved against the document's screens by `interpretPrototype`
  } else if (raw.goTo !== undefined) {
    issues.push({ level: 'warn', path, message: `Ignored goTo=${brief(raw.goTo)} on <${type}> (must be a screen id).` })
  }
  if (raw.anchor === true) {
    if (depth === 1) {
      node.anchor = true
    } else {
      issues.push({
        level: 'warn',
        path,
        message: `Removed "anchor" from <${type}> — only a direct child of the root can be anchored.`,
      })
    }
  } else if (raw.anchor !== undefined && raw.anchor !== false) {
    issues.push({
      level: 'warn',
      path,
      message: `Ignored anchor=${brief(raw.anchor)} on <${type}> (must be true or omitted).`,
    })
  }
  return node
}

function sanitizeProps(
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
    const result = fieldSchema.safeParse(provided[key])
    if (result.success) {
      clean[key] = result.data
    } else {
      issues.push({
        level: 'warn',
        path,
        message: `Ignored ${key}=${brief(provided[key])} on <${component.id}> (not an allowed value) — kept the default.`,
      })
    }
  }

  for (const key of Object.keys(provided)) {
    if (!(key in shape)) {
      issues.push({
        level: 'warn',
        path,
        message: `Removed unsupported prop "${key}" from <${component.id}>.`,
      })
    }
  }

  // Seed every declared prop so a manifest with required, default-less props still
  // parses; `clean` only holds valid provided values, so this always succeeds.
  const seeded = { ...compiledDefaultProps(component, schema), ...clean }
  return schema.parse(seeded) as Record<string, unknown>
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
): void {
  const component = manifest.components[root.type]
  const padding = component ? spacingPropFor(component, 'margin') : undefined
  if (padding) {
    const px = spacingPx(manifest, root.props[padding.name])
    const zero = spacingNameForPx(manifest, allowedSpacingNames(manifest, padding), 0)
    if (px !== null && px !== 0 && zero) {
      issues.push({
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
  if (stretch && root.props[stretch.name] !== undefined && root.props[stretch.name] !== 'stretch') {
    issues.push({
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
    const value = side && sideProp?.prop === prop.name ? sideProp.values[side] : uncenteredValue(prop)
    issues.push({
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
      issues.push({
        level: 'warn',
        path: 'root',
        message: `Un-anchored <${child.type}> — it holds the screen's focus in the content; only a secondary cluster is anchored.`,
      })
    }
  }

  const anchored = root.children.filter((child) => child.anchor)
  for (const extra of anchored.slice(0, -1)) {
    delete extra.anchor
    issues.push({
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
      issues.push({
        level: 'info',
        path,
        message: `Set ${gap.name} to "${gutter}" on <${node.type}> — stacked modules and columns sit exactly ${FRAME.gutter}px apart.`,
      })
      node.props = { ...node.props, [gap.name]: gutter }
    }
  }
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
): CanvasNode[] {
  const placed = children.filter((child) => {
    const problem = placementError(manifest, parentType, child.type)
    if (problem) issues.push({ level: 'warn', path, message: `Dropped a child — ${problem}` })
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
    issues.push({ level: 'warn', path, message: `Dropped a second <${child.type}> — <${parentType}> takes at most one.` })
    return false
  })
  const ordered = [...unique].sort((a, b) => slots.indexOf(a.type) - slots.indexOf(b.type))
  if (ordered.some((child, i) => child !== unique[i])) {
    issues.push({ level: 'warn', path, message: `Put <${parentType}>'s children back in the order ${slots.join(', ')}.` })
  }
  return ordered
}
