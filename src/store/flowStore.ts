/**
 * The single source of truth for the open screen flow.
 *
 * History model: every mutation goes through `commit(recipe, label)`, which snapshots
 * the current tree onto `past` and clears `future`. One `commit` call == one undo
 * step. The AI agent's whole generation is therefore reverted by a single Undo,
 * because the interpreter (Phase 3) applies it in exactly one `commit`.
 */

import { create } from 'zustand'
import {
  type CanvasNode,
  type NodeId,
  cloneTree,
  findNode,
  insertChild,
  makeNode,
  removeNode,
  updateNode,
} from '@/model/nodeTree'
import { ComponentRegistry, getEntry } from '@/design-system/registry'
import { interpretBlueprint, type InterpretIssue } from '@/interpreter/interpret'
import type { BlueprintDocument } from '@/shared/blueprint'

const HISTORY_LIMIT = 50

export const ROOT_ID = 'root'

interface Snapshot {
  tree: CanvasNode
  label: string
}

/** Outcome of the most recent AI generation, for the AgentPanel to display. */
export interface AgentRun {
  prompt: string
  ok: boolean
  error?: string
  issues: InterpretIssue[]
  nodeCount: number
  at: number
}

interface FlowState {
  tree: CanvasNode
  past: Snapshot[]
  future: Snapshot[]
  selectedId: NodeId | null
  lastActionLabel: string | null
  lastAgentRun: AgentRun | null

  // selection
  select: (id: NodeId | null) => void

  // history primitive
  commit: (recipe: (draft: CanvasNode) => void, label: string) => void
  undo: () => void
  redo: () => void

  // high-level editing actions (each is one history step)
  addNode: (parentId: NodeId, type: string) => void
  updateProps: (id: NodeId, patch: Record<string, unknown>) => void
  deleteNode: (id: NodeId) => void
  replaceDocument: (tree: CanvasNode, label: string) => void
  /**
   * Interpret an AI Blueprint against the registry and render it to the canvas as
   * ONE history step. Returns whether it applied.
   */
  applyAgentBlueprint: (blueprint: BlueprintDocument, prompt: string) => AgentRun
  reset: () => void
}

function initialTree(): CanvasNode {
  // A root Stack that fills the frame, seeded with one Text + one Button so the
  // canvas is never empty (Phase 1 acceptance: "render a basic Stack and Button").
  return {
    id: ROOT_ID,
    type: 'Stack',
    props: {
      direction: 'vertical',
      gap: 'md',
      padding: 'xl',
      align: 'start',
      justify: 'start',
      surface: 'surface',
      radius: 'lg',
      shadow: 'sm',
      bordered: true,
      grow: false,
    },
    children: [
      makeNode('Text', {
        content: 'Welcome to ScreenFlow Studio',
        variant: 'title',
        tone: 'default',
        align: 'start',
      }),
      makeNode('Text', {
        content: 'Design system-safe screens, generated or hand-built.',
        variant: 'body',
        tone: 'muted',
        align: 'start',
      }),
      makeNode('Button', {
        label: 'Get started',
        variant: 'primary',
        size: 'md',
        fullWidth: false,
        disabled: false,
      }),
    ],
  }
}

function canUndo(s: FlowState): boolean {
  return s.past.length > 0
}
function canRedo(s: FlowState): boolean {
  return s.future.length > 0
}

export const useFlowStore = create<FlowState>((set, get) => ({
  tree: initialTree(),
  past: [],
  future: [],
  selectedId: null,
  lastActionLabel: null,
  lastAgentRun: null,

  select: (id) => set({ selectedId: id }),

  commit: (recipe, label) =>
    set((s) => {
      const snapshot: Snapshot = { tree: cloneTree(s.tree), label: s.lastActionLabel ?? 'Initial' }
      const draft = cloneTree(s.tree)
      recipe(draft)
      return {
        tree: draft,
        past: [...s.past, snapshot].slice(-HISTORY_LIMIT),
        future: [],
        lastActionLabel: label,
      }
    }),

  undo: () =>
    set((s) => {
      if (!canUndo(s)) return s
      const previous = s.past[s.past.length - 1]
      const redoSnapshot: Snapshot = { tree: cloneTree(s.tree), label: s.lastActionLabel ?? 'Edit' }
      return {
        tree: cloneTree(previous.tree),
        past: s.past.slice(0, -1),
        future: [redoSnapshot, ...s.future].slice(0, HISTORY_LIMIT),
        lastActionLabel: previous.label,
        selectedId: null,
      }
    }),

  redo: () =>
    set((s) => {
      if (!canRedo(s)) return s
      const next = s.future[0]
      const undoSnapshot: Snapshot = { tree: cloneTree(s.tree), label: s.lastActionLabel ?? 'Edit' }
      return {
        tree: cloneTree(next.tree),
        past: [...s.past, undoSnapshot].slice(-HISTORY_LIMIT),
        future: s.future.slice(1),
        lastActionLabel: next.label,
        selectedId: null,
      }
    }),

  addNode: (parentId, type) => {
    const entry = getEntry(type)
    if (!entry) return
    const node = makeNode(type, { ...entry.defaultProps })
    get().commit((draft) => {
      insertChild(draft, parentId, node)
    }, `Add ${entry.label}`)
    set({ selectedId: node.id })
  },

  updateProps: (id, patch) =>
    get().commit((draft) => {
      updateNode(draft, id, (node) => {
        node.props = { ...node.props, ...patch }
      })
    }, 'Edit properties'),

  deleteNode: (id) => {
    if (id === ROOT_ID) return
    const node = findNode(get().tree, id)
    const label = node ? `Delete ${getEntry(node.type)?.label ?? node.type}` : 'Delete node'
    get().commit((draft) => {
      removeNode(draft, id)
    }, label)
    if (get().selectedId === id) set({ selectedId: null })
  },

  replaceDocument: (tree, label) =>
    get().commit((draft) => {
      draft.type = tree.type
      draft.props = tree.props
      draft.children = tree.children
    }, label),

  applyAgentBlueprint: (blueprint, prompt) => {
    const result = interpretBlueprint(blueprint)

    if (!result.ok) {
      const run: AgentRun = {
        prompt,
        ok: false,
        error: result.error,
        issues: result.issues,
        nodeCount: 0,
        at: Date.now(),
      }
      set({ lastAgentRun: run })
      return run
    }

    const trimmed = prompt.length > 44 ? `${prompt.slice(0, 44)}…` : prompt
    get().replaceDocument(result.tree, `AI · ${trimmed}`)

    const run: AgentRun = {
      prompt,
      ok: true,
      issues: result.issues,
      nodeCount: result.nodeCount,
      at: Date.now(),
    }
    set({ selectedId: null, lastAgentRun: run })
    return run
  },

  reset: () =>
    set({
      tree: initialTree(),
      past: [],
      future: [],
      selectedId: null,
      lastActionLabel: null,
      lastAgentRun: null,
    }),
}))

// Convenience selectors (kept outside the store so components subscribe narrowly).
export const selectCanUndo = (s: FlowState) => s.past.length > 0
export const selectCanRedo = (s: FlowState) => s.future.length > 0
export const selectUndoLabel = (s: FlowState) =>
  s.past.length > 0 ? s.lastActionLabel : null
export const selectRedoLabel = (s: FlowState) => (s.future.length > 0 ? s.future[0].label : null)

// Re-export so Phase 3's interpreter has a typed entry point.
export const REGISTRY_KEYS = Object.keys(ComponentRegistry)
