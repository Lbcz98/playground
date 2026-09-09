/**
 * Thin façade over the AI providers (`./providers`). The orchestrator and the
 * startup log talk to this; provider selection (API key vs Claude Code CLI) lives
 * in `./providers/index.ts` and is driven by `AI_PROVIDER`.
 */

export { hasApiKey, describeAiSetup, resolveProvider } from './providers'
export type { AiProvider, CompleteArgs, RenderResult, ProviderId } from './providers'
