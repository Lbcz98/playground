import { beforeEach, describe, expect, it, vi } from 'vitest'

const cliAvailable = vi.fn()
const keyAvailable = vi.fn()

vi.mock('./claudeCli', () => ({
  claudeCliProvider: { id: 'claude-cli', label: 'Claude Code', isAvailable: cliAvailable },
}))
vi.mock('./apiKey', () => ({
  apiKeyProvider: { id: 'api-key', label: 'API key', isAvailable: keyAvailable },
  hasApiKey: () => false,
}))

const { resolveProvider } = await import('./index')

describe('resolveProvider', () => {
  beforeEach(() => {
    cliAvailable.mockReset().mockResolvedValue(false)
    keyAvailable.mockReset().mockResolvedValue(false)
    delete process.env.AI_PROVIDER
  })

  it('auto: prefers the CLI, then the API key', async () => {
    cliAvailable.mockResolvedValue(true)
    keyAvailable.mockResolvedValue(true)
    expect((await resolveProvider())?.id).toBe('claude-cli')

    cliAvailable.mockResolvedValue(false)
    expect((await resolveProvider())?.id).toBe('api-key')
  })

  it('auto: returns null when nothing is available', async () => {
    expect(await resolveProvider()).toBeNull()
  })

  it('respects an explicit AI_PROVIDER, even if the other is available', async () => {
    process.env.AI_PROVIDER = 'api-key'
    cliAvailable.mockResolvedValue(true)
    keyAvailable.mockResolvedValue(true)
    expect((await resolveProvider())?.id).toBe('api-key')
  })

  it('explicit AI_PROVIDER that is unavailable returns null (no silent fallback)', async () => {
    process.env.AI_PROVIDER = 'claude-cli'
    cliAvailable.mockResolvedValue(false)
    keyAvailable.mockResolvedValue(true)
    expect(await resolveProvider()).toBeNull()
  })
})
