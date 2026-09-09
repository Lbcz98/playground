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
 *
 * Every deviation is recorded as an `InterpretIssue` so the UI can show the user
 * exactly what was corrected. The store applies the result in a single `commit`,
 * so one Undo reverts the whole generation.
 */

import type { z } from 'zod'
import type { BlueprintDocument } from '@/shared/blueprint'
import { getCatalogEntry, type CatalogEntry } from '@/design-system/catalog'
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

const ROOT_CONTAINER_TYPE = 'Stack'
const SUPPORTED_VERSION = 1

export function interpretBlueprint(input: unknown): InterpretResult {
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

  let root = interpretNode(doc.root, 'root', issues)
  if (!root) {
    return { ok: false, error: 'The root node could not be interpreted.', issues }
  }

  // The canvas and the component palette assume the top of the tree is a
  // container they can insert into. Wrap anything else.
  const rootEntry = getCatalogEntry(root.type)
  if (!rootEntry?.acceptsChildren) {
    issues.push({
      level: 'info',
      path: 'root',
      message: `Wrapped <${root.type}> in a ${ROOT_CONTAINER_TYPE} — the top level must be a layout container.`,
    })
    const container = getCatalogEntry(ROOT_CONTAINER_TYPE)!
    root = makeNode(ROOT_CONTAINER_TYPE, { ...container.defaultProps }, [root])
  }

  return { ok: true, tree: root, issues, nodeCount: countNodes(root) }
}

function interpretNode(raw: unknown, path: string, issues: InterpretIssue[]): CanvasNode | null {
  if (!isObject(raw)) {
    issues.push({ level: 'warn', path, message: 'Dropped a node that was not an object.' })
    return null
  }

  const type = raw.type
  if (typeof type !== 'string') {
    issues.push({ level: 'warn', path, message: 'Dropped a node with no "type".' })
    return null
  }

  const entry = getCatalogEntry(type)
  if (!entry) {
    issues.push({ level: 'warn', path, message: `Dropped unknown component <${type}>.` })
    return null
  }

  const props = sanitizeProps(entry, raw.props, path, issues)

  const rawChildren = Array.isArray(raw.children) ? (raw.children as unknown[]) : []
  let children: CanvasNode[] = []
  if (rawChildren.length > 0 && !entry.acceptsChildren) {
    issues.push({
      level: 'warn',
      path,
      message: `<${type}> can't contain children — dropped ${rawChildren.length}.`,
    })
  } else if (entry.acceptsChildren) {
    children = rawChildren
      .map((child, i) => interpretNode(child, `${path} › ${type}[${i}]`, issues))
      .filter((child): child is CanvasNode => child !== null)
  }

  return { id: createNodeId(), type, props, children }
}

function sanitizeProps(
  entry: CatalogEntry,
  rawProps: unknown,
  path: string,
  issues: InterpretIssue[],
): Record<string, unknown> {
  const shape = getObjectShape(entry.schema)
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
        message: `Ignored ${key}=${brief(provided[key])} on <${entry.type}> (not an allowed value) — kept the default.`,
      })
    }
  }

  for (const key of Object.keys(provided)) {
    if (!(key in shape)) {
      issues.push({
        level: 'warn',
        path,
        message: `Removed unsupported prop "${key}" from <${entry.type}>.`,
      })
    }
  }

  // `clean` only holds known keys with valid values, so this always succeeds and
  // fills in defaults for everything omitted.
  return entry.schema.parse(clean) as Record<string, unknown>
}

function getObjectShape(schema: z.ZodTypeAny): Record<string, z.ZodTypeAny> {
  const candidate = schema as unknown as { shape?: Record<string, z.ZodTypeAny> }
  return candidate.shape ?? {}
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function brief(value: unknown): string {
  const str = typeof value === 'string' ? `"${value}"` : JSON.stringify(value)
  return str && str.length > 32 ? `${str.slice(0, 32)}…` : String(str)
}
