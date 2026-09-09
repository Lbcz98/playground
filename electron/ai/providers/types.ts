import type { ChatTurn, GenerateUsage } from '@/shared/blueprint'

export type ProviderId = 'api-key' | 'claude-cli'

/** One LLM turn requested by the orchestrator. It owns the whole conversation. */
export interface CompleteArgs {
  system: string
  messages: ChatTurn[]
  model?: string
  effort?: string
}

export interface CompleteResult {
  text: string
  model?: string
  usage?: GenerateUsage
}

export interface RenderResult {
  /** Whatever the model produced — validated by the orchestrator, repaired by the interpreter. */
  blueprint: unknown
  model?: string
  usage?: GenerateUsage
}

export interface AiProvider {
  id: ProviderId
  label: string
  /** Cheap check — usable on this machine right now (key set / CLI installed)? */
  isAvailable(): Promise<boolean>
  /** Plain text turn (the Planner, and the Generator on the CLI). */
  complete(args: CompleteArgs): Promise<CompleteResult>
  /** Structured turn — API key forces the render_ui tool; CLI parses JSON from text. */
  renderUi(args: CompleteArgs): Promise<RenderResult>
}

export function addUsage(a: GenerateUsage | undefined, b: GenerateUsage | undefined): GenerateUsage {
  return {
    inputTokens: (a?.inputTokens ?? 0) + (b?.inputTokens ?? 0),
    outputTokens: (a?.outputTokens ?? 0) + (b?.outputTokens ?? 0),
    costUsd: (a?.costUsd ?? 0) + (b?.costUsd ?? 0),
    costEstimated: !!a?.costEstimated || !!b?.costEstimated,
  }
}

/** Pull a Blueprint document out of free-form model text (CLI provider). */
export function extractBlueprintJson(text: string): unknown {
  let cleaned = text.trim()
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) cleaned = fence[1].trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    // fall through
  }

  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start >= 0 && end > start) {
    return JSON.parse(cleaned.slice(start, end + 1))
  }
  throw new Error('Model output did not contain a JSON object')
}

/** Accept either a bare Blueprint doc or a `{ blueprint: ... }` wrapper. */
export function unwrapBlueprint(value: unknown): unknown {
  if (value && typeof value === 'object' && 'blueprint' in value) {
    return (value as { blueprint: unknown }).blueprint
  }
  return value
}
