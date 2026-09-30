/** The `render_ui` tool as the API provider sends it, pinned before phase 9D. */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createMock = vi.fn()
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: createMock }
  },
}))

const { apiKeyProvider } = await import('./apiKey')

describe('render_ui tool (snapshot)', () => {
  beforeEach(() => {
    createMock.mockReset()
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test'
  })

  it('is unchanged for a request with no mode', async () => {
    createMock.mockResolvedValue({
      content: [{ type: 'tool_use', name: 'render_ui', id: 't', input: { blueprint: {} } }],
      stop_reason: 'tool_use',
      usage: { input_tokens: 1, output_tokens: 1 },
    })
    await apiKeyProvider.renderUi({ system: 's', messages: [{ role: 'user', content: 'x' }] })
    expect(createMock.mock.calls[0][0].tools).toMatchSnapshot()
  })
})
