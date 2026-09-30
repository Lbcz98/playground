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

import type { DesignSystemManifest, RuleFlexibility, ScreenSpec } from './design-system/manifest'

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
}

/** One further screen of a document — an option, or the next step of a flow. */
export interface BlueprintScreen {
  /** Unique within the document; what `goTo` names. */
  id: string
  /** Short label for the frame ("Option B", "Rail", "Stats"). */
  name?: string
  screen?: ScreenSpec
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
export const BLUEPRINT_DOCUMENT_KEYS: readonly string[] = ['version', 'id', 'name', 'screen', 'root', 'screens', 'notes'] satisfies (keyof BlueprintDocument)[]
/** Every key a further screen may carry. */
export const BLUEPRINT_SCREEN_KEYS: readonly string[] = ['id', 'name', 'screen', 'root'] satisfies (keyof BlueprintScreen)[]
/** Every key a Blueprint node may carry. */
export const BLUEPRINT_NODE_KEYS: readonly string[] = ['type', 'props', 'children', 'anchor', 'goTo'] satisfies (keyof BlueprintNode)[]

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

// ---------------------------------------------------------------------------
// IPC contract
// ---------------------------------------------------------------------------

export const IPC = {
  /** renderer -> main : ipcRenderer.invoke(IPC.generateUI, GenerateUIRequest) */
  generateUI: 'ai:generateUI',
} as const

/** The name of the single tool the Generator agent is allowed to call. */
export const RENDER_TOOL_NAME = 'render_ui'

/** A prior turn in the conversation, sent so follow-up prompts have context. */
export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

/**
 * The mode a request asks for (phase 9C). `auto` lets the router decide; `both`
 * only ever comes from a button. Omitted: Faithful, with no router call.
 */
export type RequestedMode = 'auto' | 'faithful' | 'exploratory' | 'both'
export const REQUESTED_MODES: readonly RequestedMode[] = ['auto', 'faithful', 'exploratory', 'both']

/** The mode a screen was actually generated in. */
export type ScreenMode = 'faithful' | 'exploratory'

/** Per-request overrides chosen in the AI Agent panel. */
export interface GenerateOptions {
  /** Full model id (see `@/shared/models`). Falls back to env / default. */
  model?: string
  /** 'low' | 'medium' | 'high' | 'xhigh' | 'max'. */
  effort?: string
  mode?: RequestedMode
}

/**
 * What the router asks instead of generating: a request that leaves the patterns
 * without saying so, or one a law rules out in every mode. Each choice re-sends
 * the same request with that mode.
 */
export interface RouterQuestion {
  kind: 'conflict' | 'law'
  text: string
  /** The classifier's reason for the first conflict, when it gave one. */
  why?: string
  rules: { id: string; title: string; flexibility: RuleFlexibility }[]
  choices: Exclude<RequestedMode, 'auto'>[]
  /** The request rephrased to stay inside the rules. */
  faithfulAlternative?: string
}

export interface GenerateUIRequest {
  prompt: string
  history?: ChatTurn[]
  options?: GenerateOptions
  /**
   * The active Design System Manifest. The orchestrator compiles the Planner /
   * Generator prompts and the strict Zod validator from this — never a hardcoded
   * schema. Omitted → the built-in ScreenFlow manifest.
   */
  manifest?: DesignSystemManifest
}

/** Token / cost accounting for one generation. */
export interface GenerateUsage {
  inputTokens?: number
  outputTokens?: number
  /** For claude-cli this is the real reported cost; for api-key it's an estimate. */
  costUsd?: number
  /** True when costUsd is estimated from token counts rather than reported. */
  costEstimated?: boolean
}

/** Where the response came from. */
export type GenerateUISource = 'dummy' | 'llm' | 'web-fallback'

export interface GenerateUIMeta {
  source: GenerateUISource
  /** Which backend produced it: 'api-key' | 'claude-cli' (undefined for the fixture). */
  provider?: string
  /** Model id actually used. */
  model?: string
  usage?: GenerateUsage
  /** ms spent in the orchestrator. */
  durationMs: number
  /** Free-form trace of the orchestrator steps (planner, generator, retries…). */
  steps: string[]
  /** The mode the screens were generated in — never one the pipeline didn't run. */
  mode?: ScreenMode
  /** What the pipeline itself tells the user (the router, a mode fallback), shown under the reply. */
  notices?: string[]
}

export type GenerateUIResponse =
  | { ok: true; blueprint: BlueprintDocument; meta: GenerateUIMeta }
  | { ok: false; error: string; stage: string; meta: GenerateUIMeta; question?: undefined }
  /**
   * The router asks before generating (Auto mode). Not a failure, but nothing was
   * generated; `error` repeats the question's text for a client that can't ask.
   */
  | { ok: false; error: string; stage: 'router'; meta: GenerateUIMeta; question: RouterQuestion }

export function isBlueprintDocument(value: unknown): value is BlueprintDocument {
  if (typeof value !== 'object' || value === null) return false
  const doc = value as Record<string, unknown>
  return doc.version === 1 && typeof doc.root === 'object' && doc.root !== null
}
