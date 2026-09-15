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
 *
 * Every deviation is recorded as an `InterpretIssue` so the UI can show the user
 * exactly what was corrected. The store applies the result in a single `commit`,
 * so one Undo reverts the whole generation.
 */

import type { z } from 'zod'
import type { BlueprintDocument } from '@/shared/blueprint'
import type { DesignSystemManifest, ManifestComponent } from '@/shared/design-system/manifest'
import { rootContainerId } from '@/shared/design-system/manifest'
import { compileManifestSchemas, compiledDefaultProps } from '@/shared/design-system/manifest-zod'
import { SCREENFLOW_MANIFEST } from '@/shared/design-system/screenflow-manifest'
import {
  FRAME,
  allowedSpacingNames,
  centeringPropsFor,
  isModuleGroup,
  uncenteredValue,
  spacingNameForPx,
  spacingPropFor,
  spacingPx,
} from '@/shared/layout/frame'
import { type CanvasNode, countNodes, createNodeId, makeNode } from '@/model/nodeTree'

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

  repairFrameLayout(root, ctx.manifest, issues)

  return { ok: true, tree: root, issues, nodeCount: countNodes(root) }
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

  const props = sanitizeProps(component, ctx.schemas[type], raw.props, path, issues)

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
  }

  const node: CanvasNode = { id: createNodeId(), type, props, children }
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

  for (const prop of component ? centeringPropsFor(component) : []) {
    if (root.props[prop.name] !== 'center') continue
    const value = uncenteredValue(prop)
    issues.push({
      level: 'info',
      path: 'root',
      message: `Set ${prop.name} to "${value}" on the root — master layouts don't use static center alignment; the anchored group follows the focus instead.`,
    })
    root.props = { ...root.props, [prop.name]: value }
  }

  repairGutters(root, 'root', 0, manifest, issues)

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
