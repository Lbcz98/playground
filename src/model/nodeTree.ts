/**
 * The document model. A screen flow is a single hierarchical tree of nodes.
 * `props` is intentionally loose here (`Record<string, unknown>`); it is narrowed
 * and validated per-node by the matching `ComponentRegistry` entry's Zod schema.
 */

import type { RuleDeviation, ScreenSpec } from '@/shared/design-system/manifest'
import type { PrimitiveReuse, ScreenMode } from '@/shared/blueprint'

export interface CanvasNode {
  id: string
  type: string
  props: Record<string, unknown>
  children: CanvasNode[]
  /**
   * The frame's element group. Only meaningful on a direct child of the root —
   * the canvas renders it in the focus zone (see `shared/layout/frame.ts`).
   */
  anchor?: boolean
  /** Prototype link: the id of the screen a click on this node opens (see `ScreenEntry`). */
  goTo?: string
  /**
   * The screen's layer model and navigation level (the layer rule). Only on the
   * root — the canvas paints the model's shades between the video and the content.
   */
  screen?: ScreenSpec
  /** A declared break of a pattern rule at this node (Exploratory screens only; see `BlueprintNode`). */
  deviation?: RuleDeviation
  /** A primitive's reason for not being a component (Exploratory only; see `BlueprintNode.reuse`). */
  reuse?: PrimitiveReuse
}

export type NodeId = string

/** One screen (frame) of the open document: its tree, and the name it goes by. */
export interface ScreenEntry {
  id: string
  name: string
  tree: CanvasNode
  /** The mode the screen was generated in; absent for a screen built by hand (Faithful rules). */
  mode?: ScreenMode
}

/** Stable id generator (crypto.randomUUID is available in Electron's renderer). */
export function createNodeId(): NodeId {
  return `n_${crypto.randomUUID().slice(0, 8)}`
}

export function makeNode(
  type: string,
  props: Record<string, unknown> = {},
  children: CanvasNode[] = [],
): CanvasNode {
  return { id: createNodeId(), type, props, children }
}

export function cloneTree(node: CanvasNode): CanvasNode {
  return structuredClone(node)
}

/** Depth-first search for a node by id. */
export function findNode(root: CanvasNode, id: NodeId): CanvasNode | null {
  if (root.id === id) return root
  for (const child of root.children) {
    const hit = findNode(child, id)
    if (hit) return hit
  }
  return null
}

export function findParent(root: CanvasNode, id: NodeId): CanvasNode | null {
  for (const child of root.children) {
    if (child.id === id) return root
    const hit = findParent(child, id)
    if (hit) return hit
  }
  return null
}

/**
 * Return a new tree with `updater` applied to the node matching `id`.
 * The updater receives a draft it may mutate freely (the caller already holds a
 * fresh clone via the store's `commit`).
 */
export function updateNode(
  root: CanvasNode,
  id: NodeId,
  updater: (node: CanvasNode) => void,
): CanvasNode {
  const target = findNode(root, id)
  if (target) updater(target)
  return root
}

export function insertChild(
  root: CanvasNode,
  parentId: NodeId,
  node: CanvasNode,
  index?: number,
): CanvasNode {
  const parent = findNode(root, parentId)
  if (!parent) return root
  const at = index ?? parent.children.length
  parent.children.splice(at, 0, node)
  return root
}

export function removeNode(root: CanvasNode, id: NodeId): CanvasNode {
  const parent = findParent(root, id)
  if (!parent) return root
  parent.children = parent.children.filter((c) => c.id !== id)
  return root
}

/** Count of nodes in the subtree, inclusive. Handy for history labels / tests. */
export function countNodes(node: CanvasNode): number {
  return 1 + node.children.reduce((sum, c) => sum + countNodes(c), 0)
}
