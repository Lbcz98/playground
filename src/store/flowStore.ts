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
  type ScreenEntry,
  cloneTree,
  findNode,
  insertChild,
  makeNode,
  removeNode,
  updateNode,
} from '@/model/nodeTree'
import { interpretPrototype, type InterpretIssue } from '@/interpreter/interpret'
import type { BlueprintDocument } from '@/shared/blueprint'
import type { ScreenSpec } from '@/shared/design-system/manifest'
import { useDesignSystemStore } from '@/store/designSystemStore'

/** The active hydrated registry — read lazily so a design-system switch is picked up. */
const activeRegistry = () => useDesignSystemStore.getState().registry
const activeManifest = () => useDesignSystemStore.getState().active

const HISTORY_LIMIT = 50

export const ROOT_ID = 'root'

/** One undo step: the whole document — every screen — and which one was open. */
interface Snapshot {
  screens: ScreenEntry[]
  activeId: string
  label: string
}

export const FIRST_SCREEN = 'screen-1'

/** Outcome of the most recent AI generation, for the AgentPanel to display. */
export interface AgentRun {
  prompt: string
  ok: boolean
  error?: string
  issues: InterpretIssue[]
  nodeCount: number
  /** How many screens (frames) the generation produced. */
  screenCount: number
  /** How many clickable links join them. */
  linkCount: number
  /** What the agent says the user should know: an approximation, or a law that overrode the request. */
  notes: string[]
  at: number
}

interface FlowState {
  /** Every screen (frame) of the document — options, or the steps of a prototype. */
  screens: ScreenEntry[]
  /** The screen being edited. */
  activeId: string
  /** The active screen's tree — what the editing actions, the Layers panel and the Inspector address. */
  tree: CanvasNode
  past: Snapshot[]
  future: Snapshot[]
  selectedId: NodeId | null
  lastActionLabel: string | null
  lastAgentRun: AgentRun | null

  // selection
  select: (id: NodeId | null) => void
  /** Open another screen for editing (not a history step). */
  setActiveScreen: (id: string) => void
  /** Remove a screen — e.g. to keep the option you picked. The last screen can't go; links to it are dropped. */
  deleteScreen: (id: string) => void

  // history primitive
  commit: (recipe: (draft: CanvasNode) => void, label: string) => void
  undo: () => void
  redo: () => void

  // high-level editing actions (each is one history step)
  /** Add a component under `parentId` — at `index` when given, else last. */
  addNode: (parentId: NodeId, type: string, index?: number) => void
  updateProps: (id: NodeId, patch: Record<string, unknown>) => void
  deleteNode: (id: NodeId) => void
  /** Anchor (or release) a direct child of the root to the focus zone. At most one is anchored. */
  setAnchor: (id: NodeId, anchored: boolean) => void
  /** Pick the screen's layer model and navigation level (the layer rule). */
  setScreen: (screen: ScreenSpec) => void
  replaceDocument: (tree: CanvasNode, label: string) => void
  /** Replace every screen at once — one history step. */
  replaceScreens: (screens: ScreenEntry[], label: string, activeId?: string) => void
  /**
   * Interpret an AI Blueprint against the registry and render it to the canvas as
   * ONE history step. Returns whether it applied.
   */
  applyAgentBlueprint: (blueprint: BlueprintDocument, prompt: string) => AgentRun
  reset: () => void
}

function initialTree(): CanvasNode {
  // A frame-compliant starting screen: the root fills the frame with no padding of
  // its own (the frame supplies the outer margin) and a gutter-sized gap. The
  // primary actions stay in the content, where TV focus starts; only a secondary
  // "Help" cluster is anchored, so it follows the side the focus is on. Under the
  // layer rule it's a level 1 Home screen.
  const row = {
    direction: 'horizontal',
    gap: '2xs',
    padding: 'none',
    align: 'center',
    justify: 'start',
    surface: 'none',
    radius: 'none',
    shadow: 'none',
    bordered: false,
    grow: false,
  }
  return {
    id: ROOT_ID,
    type: 'Stack',
    screen: { model: 'home', level: 1 },
    props: {
      direction: 'vertical',
      gap: 'sm',
      padding: 'none',
      align: 'stretch',
      justify: 'start',
      surface: 'none',
      radius: 'none',
      shadow: 'none',
      bordered: false,
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
      makeNode('Stack', { ...row }, [
        makeNode('Button', {
          label: 'Get started',
          variant: 'primary',
          size: 'md',
          fullWidth: false,
          disabled: false,
        }),
        makeNode('Button', {
          label: 'Learn more',
          variant: 'secondary',
          size: 'md',
          fullWidth: false,
          disabled: false,
        }),
      ]),
      {
        ...makeNode('Stack', { ...row }, [
          makeNode('Button', {
            label: 'Help',
            variant: 'ghost',
            size: 'md',
            fullWidth: false,
            disabled: false,
          }),
        ]),
        anchor: true,
      },
    ],
  }
}

function initialScreens(): ScreenEntry[] {
  return [{ id: FIRST_SCREEN, name: 'Screen 1', tree: initialTree() }]
}

/** `screens` with `tree` written into the screen `activeId` names. */
function withTree(screens: ScreenEntry[], activeId: string, tree: CanvasNode): ScreenEntry[] {
  return screens.map((entry) => (entry.id === activeId ? { ...entry, tree } : entry))
}

/** The part of the state every screens change sets together, so `tree` can't drift from `screens`. */
function open(screens: ScreenEntry[], activeId: string): Pick<FlowState, 'screens' | 'activeId' | 'tree'> {
  const active = screens.find((entry) => entry.id === activeId) ?? screens[0]
  return { screens, activeId: active.id, tree: active.tree }
}

/** Drop every link to a screen that no longer exists. */
function pruneLinks(screens: ScreenEntry[]): ScreenEntry[] {
  const ids = new Set(screens.map((entry) => entry.id))
  const prune = (node: CanvasNode): boolean => {
    let changed = false
    if (node.goTo !== undefined && !ids.has(node.goTo)) {
      delete node.goTo
      changed = true
    }
    for (const child of node.children) if (prune(child)) changed = true
    return changed
  }
  return screens.map((entry) => {
    const tree = cloneTree(entry.tree)
    return prune(tree) ? { ...entry, tree } : entry
  })
}

function canUndo(s: FlowState): boolean {
  return s.past.length > 0
}
function canRedo(s: FlowState): boolean {
  return s.future.length > 0
}

const START = initialScreens()

export const useFlowStore = create<FlowState>((set, get) => ({
  ...open(START, FIRST_SCREEN),
  past: [],
  future: [],
  selectedId: null,
  lastActionLabel: null,
  lastAgentRun: null,

  select: (id) => set({ selectedId: id }),

  setActiveScreen: (id) =>
    set((s) => (id === s.activeId || !s.screens.some((entry) => entry.id === id) ? s : { ...open(s.screens, id), selectedId: null })),

  deleteScreen: (id) => {
    const { screens, activeId } = get()
    if (screens.length < 2 || !screens.some((entry) => entry.id === id)) return
    const name = screens.find((entry) => entry.id === id)?.name ?? id
    const remaining = pruneLinks(screens.filter((entry) => entry.id !== id))
    get().replaceScreens(remaining, `Delete ${name}`, id === activeId ? remaining[0].id : activeId)
  },

  commit: (recipe, label) =>
    set((s) => {
      const snapshot: Snapshot = { screens: s.screens, activeId: s.activeId, label: s.lastActionLabel ?? 'Initial' }
      const draft = cloneTree(s.tree)
      recipe(draft)
      return {
        ...open(withTree(s.screens, s.activeId, draft), s.activeId),
        past: [...s.past, snapshot].slice(-HISTORY_LIMIT),
        future: [],
        lastActionLabel: label,
      }
    }),

  undo: () =>
    set((s) => {
      if (!canUndo(s)) return s
      const previous = s.past[s.past.length - 1]
      const redoSnapshot: Snapshot = { screens: s.screens, activeId: s.activeId, label: s.lastActionLabel ?? 'Edit' }
      return {
        ...open(previous.screens, previous.activeId),
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
      const undoSnapshot: Snapshot = { screens: s.screens, activeId: s.activeId, label: s.lastActionLabel ?? 'Edit' }
      return {
        ...open(next.screens, next.activeId),
        past: [...s.past, undoSnapshot].slice(-HISTORY_LIMIT),
        future: s.future.slice(1),
        lastActionLabel: next.label,
        selectedId: null,
      }
    }),

  addNode: (parentId, type, index) => {
    const entry = activeRegistry().get(type)
    if (!entry) return
    const node = makeNode(type, { ...entry.defaultProps })
    get().commit((draft) => {
      insertChild(draft, parentId, node, index)
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
    const label = node ? `Delete ${activeRegistry().get(node.type)?.label ?? node.type}` : 'Delete node'
    get().commit((draft) => {
      removeNode(draft, id)
    }, label)
    if (get().selectedId === id) set({ selectedId: null })
  },

  setAnchor: (id, anchored) => {
    const node = get().tree.children.find((child) => child.id === id)
    if (!node || Boolean(node.anchor) === anchored) return
    get().commit(
      (draft) => {
        for (const child of draft.children) {
          if (anchored && child.id === id) child.anchor = true
          else delete child.anchor
        }
      },
      anchored ? 'Anchor to focus zone' : 'Release anchor',
    )
  },

  setScreen: (screen) => {
    const current = get().tree.screen
    if (current?.model === screen.model && current.level === screen.level) return
    get().commit((draft) => {
      draft.screen = { ...screen }
    }, 'Change layer model')
  },

  replaceDocument: (tree, label) =>
    get().commit((draft) => {
      draft.type = tree.type
      draft.props = tree.props
      draft.children = tree.children
      if (tree.screen) draft.screen = tree.screen
      else delete draft.screen
    }, label),

  replaceScreens: (screens, label, activeId) =>
    set((s) => {
      const snapshot: Snapshot = { screens: s.screens, activeId: s.activeId, label: s.lastActionLabel ?? 'Initial' }
      return {
        ...open(screens, activeId ?? screens[0].id),
        past: [...s.past, snapshot].slice(-HISTORY_LIMIT),
        future: [],
        lastActionLabel: label,
        selectedId: null,
      }
    }),

  applyAgentBlueprint: (blueprint, prompt) => {
    const result = interpretPrototype(blueprint, activeManifest())

    if (!result.ok) {
      const run: AgentRun = {
        prompt,
        ok: false,
        error: result.error,
        issues: result.issues,
        nodeCount: 0,
        screenCount: 0,
        linkCount: 0,
        notes: [],
        at: Date.now(),
      }
      set({ lastAgentRun: run })
      return run
    }

    const trimmed = prompt.length > 44 ? `${prompt.slice(0, 44)}…` : prompt
    get().replaceScreens(result.screens, `AI · ${trimmed}`)

    const run: AgentRun = {
      prompt,
      ok: true,
      issues: result.issues,
      nodeCount: result.nodeCount,
      screenCount: result.screens.length,
      linkCount: result.linkCount,
      notes: result.notes,
      at: Date.now(),
    }
    set({ selectedId: null, lastAgentRun: run })
    return run
  },

  reset: () =>
    set({
      ...open(initialScreens(), FIRST_SCREEN),
      past: [],
      future: [],
      selectedId: null,
      lastActionLabel: null,
      lastAgentRun: null,
    }),
}))

// Convenience selectors (kept outside the store so components subscribe narrowly).
/** Spec §8 name for the current selection. */
export const selectCanUndo = (s: FlowState) => s.past.length > 0
export const selectCanRedo = (s: FlowState) => s.future.length > 0
