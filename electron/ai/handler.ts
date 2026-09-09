import { z } from 'zod'
import { IPC, type GenerateUIResponse } from '@/shared/blueprint'
import { EFFORT_LEVELS, MODEL_IDS } from '@/shared/models'
import { manifestZodSchema } from '@/shared/design-system/manifest'
import { generateUI } from './ai-orchestrator'

/**
 * Transport-agnostic request handler for the `generateUI` channel. Kept free of
 * any `electron` import so it can be unit-tested as plain Node. `ipc.ts` is the
 * only thing that binds this to `ipcMain.handle`.
 *
 * Contract: treat the caller as untrusted, validate the payload, and NEVER throw —
 * always resolve to a well-formed `GenerateUIResponse`.
 */

const chatTurnSchema = z
  .object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(20000),
  })
  .strict()

const optionsSchema = z
  .object({
    model: z.enum(MODEL_IDS as [string, ...string[]]).optional(),
    effort: z.enum(EFFORT_LEVELS).optional(),
  })
  .strict()

export const generateUIRequestSchema = z
  .object({
    prompt: z.string().trim().min(1, 'Prompt is empty').max(2000, 'Prompt is too long'),
    history: z.array(chatTurnSchema).max(40).optional(),
    options: optionsSchema.optional(),
    manifest: manifestZodSchema.optional(),
  })
  .strict()

export async function handleGenerateUI(rawRequest: unknown): Promise<GenerateUIResponse> {
  const parsed = generateUIRequestSchema.safeParse(rawRequest)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid request',
      stage: 'ipc:validate-request',
      meta: { source: 'dummy', durationMs: 0, steps: ['rejected malformed request'] },
    }
  }

  try {
    console.log(`[ipc] ${IPC.generateUI} <- ${JSON.stringify(parsed.data.prompt)}`)
    const result = await generateUI(
      parsed.data.prompt,
      parsed.data.history ?? [],
      parsed.data.options ?? {},
      parsed.data.manifest,
    )
    console.log(`[ipc] ${IPC.generateUI} -> ok=${result.ok} source=${result.meta.source}`)
    return result
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      stage: 'orchestrator',
      meta: { source: 'dummy', durationMs: 0, steps: ['orchestrator threw'] },
    }
  }
}
