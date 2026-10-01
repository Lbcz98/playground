import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const createMock = vi.fn()
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: createMock }
  },
}))

const { apiKeyProvider, hasApiKey } = await import('./apiKey')

describe('hasApiKey', () => {
  const original = process.env.ANTHROPIC_API_KEY
  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = original
  })

  it('is false when unset or a placeholder', () => {
    delete process.env.ANTHROPIC_API_KEY
    expect(hasApiKey()).toBe(false)
    process.env.ANTHROPIC_API_KEY = 'your-api-key'
    expect(hasApiKey()).toBe(false)
  })

  it('is true for a real-looking key', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-abc123'
    expect(hasApiKey()).toBe(true)
  })
})

describe('apiKeyProvider.complete', () => {
  beforeEach(() => {
    createMock.mockReset()
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test'
  })

  it('returns joined text and estimated usage, no tools', async () => {
    createMock.mockResolvedValue({
      content: [
        { type: 'text', text: '1. Root Stack' },
        { type: 'text', text: '2. Button' },
      ],
      stop_reason: 'end_turn',
      usage: { input_tokens: 200, output_tokens: 40 },
    })

    const res = await apiKeyProvider.complete({
      system: 'plan it',
      messages: [{ role: 'user', content: 'a login screen' }],
    })
    expect(res.text).toBe('1. Root Stack\n2. Button')
    expect(res.model).toBe('claude-opus-5')
    expect(res.usage?.costEstimated).toBe(true)

    const params = createMock.mock.calls[0][0]
    expect(params.tools).toBeUndefined()
    expect(params.output_config).toEqual({ effort: 'medium' })
  })
})

describe('apiKeyProvider.renderUi', () => {
  beforeEach(() => {
    createMock.mockReset()
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test'
  })

  it('forces the render_ui tool and unwraps the blueprint', async () => {
    const blueprint = { version: 1, root: { type: 'Stack', children: [] } }
    createMock.mockResolvedValue({
      content: [{ type: 'tool_use', name: 'render_ui', id: 't1', input: { blueprint } }],
      stop_reason: 'tool_use',
      usage: { input_tokens: 100, output_tokens: 50 },
    })

    const res = await apiKeyProvider.renderUi({
      system: 'generate it',
      messages: [{ role: 'user', content: 'plan…' }],
      model: 'claude-haiku-4-5',
      effort: 'low',
    })
    expect(res.blueprint).toEqual(blueprint)
    expect(res.usage?.costUsd).toBeCloseTo((100 / 1e6) * 1 + (50 / 1e6) * 5)

    const params = createMock.mock.calls[0][0]
    expect(params.tool_choice).toEqual({ type: 'tool', name: 'render_ui' })
    expect(params.model).toBe('claude-haiku-4-5')
    expect(params.output_config).toEqual({ effort: 'low' })
  })

  it('throws when the model does not call the tool', async () => {
    createMock.mockResolvedValue({
      content: [{ type: 'text', text: 'no' }],
      stop_reason: 'end_turn',
      usage: { input_tokens: 1, output_tokens: 1 },
    })
    await expect(
      apiKeyProvider.renderUi({ system: 's', messages: [{ role: 'user', content: 'x' }] }),
    ).rejects.toThrow(/render_ui/)
  })
})

describe('apiKeyProvider — cache tokens (before 9G)', () => {
  it('reports the response’s cache reads and writes', async () => {
    createMock.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'plan' }],
      stop_reason: 'end_turn',
      usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 300, cache_creation_input_tokens: 700 },
    })
    const res = await apiKeyProvider.complete({ system: 's', messages: [{ role: 'user', content: 'x' }] })
    expect(res.usage).toMatchObject({ cacheReadTokens: 300, cacheWriteTokens: 700 })
  })
})
