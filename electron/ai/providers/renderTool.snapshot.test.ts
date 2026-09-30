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

describe('render_ui tool by mode', () => {
  it('Faithful is the tool above, untouched', async () => {
    const { renderToolFor } = await import('./apiKey')
    expect(renderToolFor()).toBe(renderToolFor('faithful'))
    expect(JSON.stringify(renderToolFor('faithful'))).not.toContain('deviation')
  })

  it('Exploratory adds `deviation` to the node and to the screen, without touching the shared tool', async () => {
    const { renderToolFor } = await import('./apiKey')
    const before = JSON.stringify(renderToolFor('faithful'))
    const tool = renderToolFor('exploratory') as any
    const bp = tool.input_schema.properties.blueprint.properties
    expect(bp.root.properties.deviation.required).toEqual(['ruleId', 'why'])
    expect(bp.screen.properties.deviation.type).toBe('array')
    expect(bp.root.description).toMatch(/In Exploratory mode a node may also carry `deviation/)
    expect(JSON.stringify(renderToolFor('faithful'))).toBe(before)
  })

  it('renderUi sends the tool of the requested mode', async () => {
    createMock.mockReset()
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test'
    createMock.mockResolvedValue({
      content: [{ type: 'tool_use', name: 'render_ui', id: 't', input: { blueprint: {} } }],
      stop_reason: 'tool_use',
      usage: { input_tokens: 1, output_tokens: 1 },
    })
    await apiKeyProvider.renderUi({ system: 's', messages: [{ role: 'user', content: 'x' }], mode: 'exploratory' })
    expect(JSON.stringify(createMock.mock.calls[0][0].tools)).toContain('deviation')
  })
})
