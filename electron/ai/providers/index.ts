import type { AiProvider, ProviderId } from './types'
import { apiKeyProvider } from './apiKey'
import { claudeCliProvider } from './claudeCli'

export type { AiProvider, CompleteArgs, CompleteResult, RenderResult, ProviderId } from './types'
export { addUsage } from './types'
export { hasApiKey } from './apiKey'

const ALL: AiProvider[] = [claudeCliProvider, apiKeyProvider]

/** Resolution order for `AI_PROVIDER=auto`: subscription CLI first, then API key. */
const AUTO_ORDER: ProviderId[] = ['claude-cli', 'api-key']

function configured(): 'auto' | ProviderId {
  const raw = process.env.AI_PROVIDER?.trim().toLowerCase()
  if (raw === 'api-key' || raw === 'claude-cli') return raw
  return 'auto'
}

/**
 * Pick the provider to use for this generation, or `null` if none is usable
 * (the orchestrator then serves the fixture).
 */
export async function resolveProvider(): Promise<AiProvider | null> {
  const choice = configured()

  if (choice !== 'auto') {
    const provider = ALL.find((p) => p.id === choice)
    if (!provider) return null
    return (await provider.isAvailable()) ? provider : null
  }

  for (const id of AUTO_ORDER) {
    const provider = ALL.find((p) => p.id === id)
    if (provider && (await provider.isAvailable())) return provider
  }
  return null
}

/** For the startup log. */
export async function describeAiSetup(): Promise<string> {
  const choice = configured()
  const provider = await resolveProvider()
  if (provider) return `${provider.label} (AI_PROVIDER=${choice})`
  return `no provider available (AI_PROVIDER=${choice}) — serving the built-in fixture`
}
