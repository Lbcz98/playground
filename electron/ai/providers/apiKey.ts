import Anthropic from '@anthropic-ai/sdk'
import { RENDER_TOOL_NAME } from '@/shared/blueprint'
import { CATALOG_TYPES } from '@/design-system/catalog'
import { DEFAULT_EFFORT, DEFAULT_MODEL_ID, estimateCostUsd } from '@/shared/models'
import type { AiProvider, CompleteArgs, CompleteResult, RenderResult } from './types'
import { unwrapBlueprint } from './types'

/**
 * Provider: the Anthropic Messages API with a metered API key (`ANTHROPIC_API_KEY`).
 */

const PLACEHOLDER_KEYS = new Set(['', 'your-api-key', 'sk-ant-xxx', 'changeme'])

export function hasApiKey(): boolean {
  const key = process.env.ANTHROPIC_API_KEY?.trim()
  return !!key && !PLACEHOLDER_KEYS.has(key)
}

const ENV_MODEL = process.env.AI_GENERATOR_MODEL?.trim()
const ENV_EFFORT = process.env.AI_EFFORT?.trim()

type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max'

const renderTool: Anthropic.Tool = {
  name: RENDER_TOOL_NAME,
  description:
    'Render a UI onto the ScreenFlow Studio canvas. Call this exactly once with the ' +
    'complete Blueprint tree. The root node must be a Stack.',
  input_schema: {
    type: 'object',
    properties: {
      blueprint: {
        type: 'object',
        properties: {
          version: { type: 'integer', enum: [1] },
          root: {
            type: 'object',
            description:
              'A component node: { type, props?, children? }. `children` is only valid on a Stack. The root must be a Stack.',
            properties: {
              type: { type: 'string', enum: [...CATALOG_TYPES] },
              props: { type: 'object' },
              children: { type: 'array', items: { type: 'object' } },
            },
            required: ['type'],
          },
        },
        required: ['version', 'root'],
      },
    },
    required: ['blueprint'],
  },
}

function resolve(args: CompleteArgs): { model: string; effort: Effort } {
  return {
    model: args.model || ENV_MODEL || DEFAULT_MODEL_ID,
    effort: (args.effort || ENV_EFFORT || DEFAULT_EFFORT) as Effort,
  }
}

function toMessages(turns: CompleteArgs['messages']): Anthropic.MessageParam[] {
  return turns.map((t) => ({ role: t.role, content: t.content }))
}

function usageOf(model: string, u: Anthropic.Usage): CompleteResult['usage'] {
  return {
    inputTokens: u.input_tokens,
    outputTokens: u.output_tokens,
    costUsd: estimateCostUsd(model, u.input_tokens, u.output_tokens),
    costEstimated: true,
  }
}

export const apiKeyProvider: AiProvider = {
  id: 'api-key',
  label: 'Anthropic API key',

  isAvailable: async () => hasApiKey(),

  async complete(args): Promise<CompleteResult> {
    const client = new Anthropic()
    const { model, effort } = resolve(args)

    const response = await client.messages.create({
      model,
      max_tokens: 8000,
      system: args.system,
      output_config: { effort },
      messages: toMessages(args.messages),
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim()

    return { text, model, usage: usageOf(model, response.usage) }
  },

  async renderUi(args): Promise<RenderResult> {
    const client = new Anthropic()
    const { model, effort } = resolve(args)

    const response = await client.messages.create({
      model,
      max_tokens: 16000,
      system: args.system,
      output_config: { effort },
      tools: [renderTool],
      tool_choice: { type: 'tool', name: RENDER_TOOL_NAME },
      messages: toMessages(args.messages),
    })

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock =>
        block.type === 'tool_use' && block.name === RENDER_TOOL_NAME,
    )
    if (!toolUse) {
      throw new Error(`Model did not call ${RENDER_TOOL_NAME} (stop_reason: ${response.stop_reason})`)
    }

    return {
      blueprint: unwrapBlueprint(toolUse.input),
      model,
      usage: usageOf(model, response.usage),
    }
  },
}
