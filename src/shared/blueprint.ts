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

export interface BlueprintNode {
  type: string
  props?: Record<string, unknown>
  children?: BlueprintNode[]
}

export interface BlueprintDocument {
  /** Schema/format version so the interpreter can reject incompatible payloads. */
  version: 1
  root: BlueprintNode
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

/** Per-request overrides chosen in the AI Agent panel. */
export interface GenerateOptions {
  /** Full model id (see `@/shared/models`). Falls back to env / default. */
  model?: string
  /** 'low' | 'medium' | 'high' | 'xhigh' | 'max'. */
  effort?: string
}

export interface GenerateUIRequest {
  prompt: string
  history?: ChatTurn[]
  options?: GenerateOptions
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
}

export type GenerateUIResponse =
  | { ok: true; blueprint: BlueprintDocument; meta: GenerateUIMeta }
  | { ok: false; error: string; stage: string; meta: GenerateUIMeta }

export function isBlueprintDocument(value: unknown): value is BlueprintDocument {
  if (typeof value !== 'object' || value === null) return false
  const doc = value as Record<string, unknown>
  return doc.version === 1 && typeof doc.root === 'object' && doc.root !== null
}
