/**
 * The models and effort levels the AI Agent lets you pick, plus pricing used to
 * estimate spend. Imported by both the renderer (the picker) and the Electron
 * main process (the providers) — keep it pure data.
 */

export interface ModelOption {
  /** Full model id, sent to both providers. */
  id: string
  label: string
  hint: string
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'claude-opus-5', label: 'Opus 5', hint: 'Most capable' },
  { id: 'claude-sonnet-5', label: 'Sonnet 5', hint: 'Balanced' },
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5', hint: 'Fastest / cheapest' },
]

export const MODEL_IDS = MODEL_OPTIONS.map((m) => m.id)

export const DEFAULT_MODEL_ID = 'claude-opus-5'

export const EFFORT_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'] as const
export type EffortLevel = (typeof EFFORT_LEVELS)[number]

export const DEFAULT_EFFORT: EffortLevel = 'medium'

export function isModelId(value: string): boolean {
  return MODEL_IDS.includes(value)
}

export function modelLabel(id: string | undefined): string {
  return MODEL_OPTIONS.find((m) => m.id === id)?.label ?? id ?? 'default'
}

// ---------------------------------------------------------------------------
// Pricing (USD per million tokens) — for the session spend estimate only.
// Source: Anthropic public pricing, 2026-06.
// ---------------------------------------------------------------------------

interface Price {
  inputPerMTok: number
  outputPerMTok: number
}

const PRICING: Record<string, Price> = {
  'claude-opus-5': { inputPerMTok: 5, outputPerMTok: 25 },
  'claude-sonnet-5': { inputPerMTok: 2, outputPerMTok: 10 },
  'claude-haiku-4-5': { inputPerMTok: 1, outputPerMTok: 5 },
}

/**
 * Prompt-cache prices as multiples of the base input price (Anthropic prompt-caching docs, checked 2026-10-01):
 * a write at the default 5-minute TTL costs 1.25×, a read 0.1× for the models priced above. The API's
 * `input_tokens` leaves both out, so they are billed on top.
 */
export const CACHE_WRITE_MULTIPLIER = 1.25
export const CACHE_READ_MULTIPLIER = 0.1

export function estimateCostUsd(
  model: string | undefined,
  inputTokens: number | undefined,
  outputTokens: number | undefined,
  cache: { readTokens?: number; writeTokens?: number } = {},
): number | undefined {
  const price = model ? PRICING[model] : undefined
  if (!price || inputTokens == null || outputTokens == null) return undefined
  const input = inputTokens + (cache.writeTokens ?? 0) * CACHE_WRITE_MULTIPLIER + (cache.readTokens ?? 0) * CACHE_READ_MULTIPLIER
  return (input / 1_000_000) * price.inputPerMTok + (outputTokens / 1_000_000) * price.outputPerMTok
}
