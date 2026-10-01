import Anthropic from '@anthropic-ai/sdk'
import { RENDER_TOOL_NAME, type ScreenMode } from '@/shared/blueprint'
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
          screen: {
            type: 'object',
            description:
              'The layer rule (Camadas): the layer model whose shades the engine paints between the video and this content, and its navigation level. Both come from the system prompt.',
            properties: {
              model: { type: 'string' },
              level: { type: 'integer', enum: [0, 1, 2, 3] },
            },
            required: ['model', 'level'],
          },
          id: { type: 'string', description: 'The first screen\'s id — only when another screen links back to it.' },
          name: { type: 'string', description: 'Short label of the first screen.' },
          notes: {
            type: 'array',
            description:
              'Up to 4 short notes for the user, in their language: what you approximated because the registry lacks it, or which law overrode part of their request (e.g. focus placement). Omit when there is nothing to say.',
            items: { type: 'string' },
          },
          screens: {
            type: 'array',
            description:
              'Every further screen: the other options when the user asks for several versions, or the next steps of a clickable flow (link them with `goTo`). Each: { id, name?, screen, root } — `root` shaped like the top-level root.',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                screen: { type: 'object' },
                root: { type: 'object' },
              },
              required: ['id', 'screen', 'root'],
            },
          },
          root: {
            type: 'object',
            description:
              'A component node: { type, props?, children?, anchor?, goTo? }. `goTo` is a screen id — the screen a click on this node opens. `children` is only valid on a Stack. ' +
              '`anchor: true` marks the one element group, a direct child of the root, that the canvas pins to the side the TV focus is on. The root must be a Stack.',
            properties: {
              type: { type: 'string', enum: [...CATALOG_TYPES] },
              props: { type: 'object' },
              children: { type: 'array', items: { type: 'object' } },
              goTo: { type: 'string' },
            },
            required: ['type'],
          },
        },
        required: ['version', 'screen', 'root'],
      },
    },
    required: ['blueprint'],
  },
}

const DEVIATION_SHAPE = {
  type: 'object',
  properties: {
    ruleId: { type: 'string', description: 'The id of the pattern rule that is broken.' },
    why: { type: 'string', description: 'One short sentence: why this pattern is broken here.' },
  },
  required: ['ruleId', 'why'],
} as const

/**
 * The tool for a mode. Faithful is the tool above, unchanged; Exploratory adds the
 * `deviation` field to the node and to the `screen` object.
 */
export function renderToolFor(mode: ScreenMode = 'faithful'): Anthropic.Tool {
  if (mode !== 'exploratory') return renderTool
  const tool = structuredClone(renderTool) as unknown as {
    input_schema: { properties: { blueprint: { properties: Record<string, any> } } }
  } & Anthropic.Tool
  const blueprint = tool.input_schema.properties.blueprint.properties
  blueprint.screen.properties.deviation = {
    type: 'array',
    description: 'Patterns the screen as a whole breaks, when no single node carries the break. Exploratory mode only.',
    items: DEVIATION_SHAPE,
  }
  blueprint.root.description +=
    ' In Exploratory mode a node may also carry `deviation: { ruleId, why }` — a pattern rule it breaks, declared at the node where it happens.' +
    ' A node may also be a primitive (`primitive:Box`, `primitive:Stack`, `primitive:Text`), which must carry `reuse: { considered, why }`,' +
    ' or a `Proposal` (props `description` and `proposedApi`, declaring `registry.new-component`) — only when no registry component expresses the need.'
  blueprint.root.properties.deviation = DEVIATION_SHAPE
  blueprint.root.properties.reuse = {
    type: 'object',
    description: 'On a primitive only: the registry components considered (by id, comma-separated) and why none of them does it.',
    properties: { considered: { type: 'string' }, why: { type: 'string' } },
    required: ['considered', 'why'],
  }
  blueprint.screen.properties.shades = {
    type: 'array',
    description: 'With model "composed" only: the shade pieces of a composed overlay, each once (declare layers.overlay-model on the screen).',
    items: { type: 'string' },
  }
  return tool
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
    cacheReadTokens: u.cache_read_input_tokens ?? undefined,
    cacheWriteTokens: u.cache_creation_input_tokens ?? undefined,
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
      tools: [renderToolFor(args.mode)],
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
