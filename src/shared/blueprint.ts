/**
 * Blueprint DSL — the wire format between the AI orchestrator (Electron main) and
 * the renderer's interpreter.
 *
 * It is deliberately NOT the same shape as `CanvasNode`:
 *   - no `id` — the interpreter assigns ids, the model never invents them
 *   - `props` / `children` optional — the interpreter fills defaults from the registry
 *
 * Phase 2 only moves this object across the IPC boundary. Phase 3 adds the Zod
 * schema that validates it against the ComponentRegistry; Phase 5 adds the
 * generate → validate → retry loop that produces it.
 */

import type { RuleDeviation, ScreenSpec } from './design-system/manifest'

export type { RuleDeviation } from './design-system/manifest'

export interface BlueprintNode {
  type: string
  props?: Record<string, unknown>
  children?: BlueprintNode[]
  /**
   * Marks the frame's element group (floating action area, widget cluster). Only
   * valid on a direct child of the root; the canvas pins it to the bottom corner
   * on the side the TV focus is on.
   */
  anchor?: boolean
  /**
   * The link that makes the screen a live prototype: the id of the screen a click
   * on this element opens. Any element may carry one; the target is a screen of
   * the same document, and follows the layer rule (one level deeper, or back up).
   */
  goTo?: string
  /**
   * A declared break of a pattern rule, on the node it happens at — outside `props`,
   * so it travels with the node when the interpreter reorders. Exploratory screens
   * only (`nodeKeysFor`); a Faithful screen carries none.
   */
  deviation?: RuleDeviation
  /**
   * Why a primitive and not a component: the registry components considered, by
   * name, and why none of them expresses the need. Required on every primitive,
   * Exploratory screens only (`nodeKeysFor`); never on anything else.
   */
  reuse?: PrimitiveReuse
}

export interface PrimitiveReuse {
  considered: string
  why: string
}

/** One further screen of a document — an option, or the next step of a flow. */
export interface BlueprintScreen {
  /** Unique within the document; what `goTo` names. */
  id: string
  /** Short label for the frame ("Option B", "Rail", "Stats"). */
  name?: string
  screen?: ScreenSpec
  /** The mode this screen was generated in. Stamped by the pipeline, never written by the model. */
  mode?: ScreenMode
  root: BlueprintNode
}

export interface BlueprintDocument {
  /** Schema/format version so the interpreter can reject incompatible payloads. */
  version: 1
  /** The id and label of the first screen (`root`) — needed only when `screens` links back to it. */
  id?: string
  name?: string
  /**
   * The layer rule (Camadas): the model whose shades the engine paints between
   * the video and this content, and the screen's navigation level.
   */
  screen?: ScreenSpec
  /** The first screen's mode (each further screen carries its own). Stamped by the pipeline. */
  mode?: ScreenMode
  root: BlueprintNode
  /**
   * Every further screen. Several options for one screen ("give me three
   * versions") and the steps of a flow (Home → rail → interactivity) are both
   * just more screens; `goTo` links make the flow clickable.
   */
  screens?: BlueprintScreen[]
  /**
   * What the user should know about the result, in their language: something the
   * registry lacks that was approximated, or a law that overrode part of the request
   * (focus placement, a level's one-module limit). Shown under the chat reply.
   */
  notes?: string[]
}

/** The most notes a document carries, and the longest one. */
export const MAX_NOTES = 4
export const MAX_NOTE_LENGTH = 300

/** The most screens one document carries. */
export const MAX_SCREENS = 6

/** Every key a Blueprint document may carry. Anything else is a key the engine would ignore. */
export const BLUEPRINT_DOCUMENT_KEYS: readonly string[] = ['version', 'id', 'name', 'screen', 'mode', 'root', 'screens', 'notes'] satisfies (keyof BlueprintDocument)[]
/** Every key a further screen may carry. */
export const BLUEPRINT_SCREEN_KEYS: readonly string[] = ['id', 'name', 'screen', 'mode', 'root'] satisfies (keyof BlueprintScreen)[]
/** Every key a Faithful Blueprint node may carry. */
export const BLUEPRINT_NODE_KEYS: readonly string[] = ['type', 'props', 'children', 'anchor', 'goTo'] satisfies (keyof BlueprintNode)[]
/** The key only an Exploratory node may add. */
export const DEVIATION_KEY = 'deviation' satisfies keyof BlueprintNode
/** The key only an Exploratory primitive may add (and must). */
export const REUSE_KEY = 'reuse' satisfies keyof BlueprintNode

/**
 * The node keys a screen of this mode accepts for a node of this type: `deviation`
 * is Exploratory's alone, and `reuse` belongs only to an Exploratory primitive.
 */
export function nodeKeysFor(mode: ScreenMode, type?: string): readonly string[] {
  if (mode !== 'exploratory') return BLUEPRINT_NODE_KEYS
  return typeof type === 'string' && type.startsWith('primitive:')
    ? [...BLUEPRINT_NODE_KEYS, DEVIATION_KEY, REUSE_KEY]
    : [...BLUEPRINT_NODE_KEYS, DEVIATION_KEY]
}

/** The id of a document's first screen when it names none. */
export const FIRST_SCREEN_ID = 'screen-1'

/**
 * Why a key the DSL does not have is refused. Focus gets its own reason: a TV
 * screen always has something focused, and the engine reads which from the
 * rendered screen — a Blueprint never declares it.
 */
export function unknownBlueprintKeyReason(key: string): string {
  return /^focus/i.test(key)
    ? 'the engine reads focus off the rendered screen, so a Blueprint never declares it'
    : 'the Blueprint DSL has no such key'
}

/** The mode a screen was actually generated in. */
export const SCREEN_MODES = ['faithful', 'exploratory'] as const
export type ScreenMode = (typeof SCREEN_MODES)[number]

/**
 * The mode a screen ran in, read off its entry, document or response. The one place
 * that says an absent (or unrecognised) mode means Faithful, so no caller compares
 * against a default of its own. `fallback` is for a caller that has a policy to
 * fall back to instead (the validator, given the mode it generated for).
 */
export function screenMode(entry: unknown, fallback: ScreenMode = 'faithful'): ScreenMode {
  const mode = typeof entry === 'object' && entry !== null ? (entry as { mode?: unknown }).mode : undefined
  return SCREEN_MODES.find((m) => m === mode) ?? fallback
}
