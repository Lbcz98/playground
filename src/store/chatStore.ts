/**
 * The AI conversation. Separate from `flowStore` (the document): a chat message
 * is ephemeral UI, the canvas edit it triggers is the undoable thing.
 *
 * `send()` reads the model/effort from `settingsStore`, calls aiClient.generateUI
 * (IPC), hands the Blueprint to `flowStore.applyAgentBlueprint` (interpret + render
 * as one undo step), attaches the `AgentRun`, and accumulates token/cost usage.
 */

import { create } from 'zustand'
import { generateUI } from '@/services/aiClient'
import { useFlowStore, type AgentRun } from '@/store/flowStore'
import { useSettingsStore } from '@/store/settingsStore'
import type { ChatTurn, GenerateUISource, GenerateUsage } from '@/shared/blueprint'
import { createNodeId } from '@/model/nodeTree'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  at: number
  status: 'thinking' | 'done' | 'error'
  /** Assistant messages only: the interpreter report for the canvas edit. */
  run?: AgentRun
  source?: GenerateUISource
  /** 'api-key' | 'claude-cli' — which backend produced this. */
  provider?: string
  model?: string
  usage?: GenerateUsage
  /** Orchestrator trace (planner / generator / validation). */
  steps?: string[]
}

export interface SessionUsage {
  calls: number
  inputTokens: number
  outputTokens: number
  costUsd: number
  /** True if any contributing call's cost was an estimate. */
  costEstimated: boolean
}

const EMPTY_USAGE: SessionUsage = {
  calls: 0,
  inputTokens: 0,
  outputTokens: 0,
  costUsd: 0,
  costEstimated: false,
}

const HISTORY_TURNS = 10

interface ChatState {
  messages: ChatMessage[]
  busy: boolean
  sessionUsage: SessionUsage
  send: (prompt: string) => Promise<void>
  clear: () => void
}

function summarize(run: AgentRun): string {
  if (!run.ok) return `I couldn't apply that: ${run.error}`
  const fixed = run.issues.filter((i) => i.level === 'warn').length
  const base = `Rendered ${run.nodeCount} component${run.nodeCount === 1 ? '' : 's'} to the canvas`
  return fixed > 0 ? `${base} (auto-fixed ${fixed} issue${fixed === 1 ? '' : 's'}).` : `${base}.`
}

function accumulate(prev: SessionUsage, u: GenerateUsage | undefined): SessionUsage {
  if (!u) return prev
  return {
    calls: prev.calls + 1,
    inputTokens: prev.inputTokens + (u.inputTokens ?? 0),
    outputTokens: prev.outputTokens + (u.outputTokens ?? 0),
    costUsd: prev.costUsd + (u.costUsd ?? 0),
    costEstimated: prev.costEstimated || !!u.costEstimated,
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  busy: false,
  sessionUsage: EMPTY_USAGE,

  send: async (prompt) => {
    const trimmed = prompt.trim()
    if (!trimmed || get().busy) return

    const { model, effort } = useSettingsStore.getState()

    const userMsg: ChatMessage = {
      id: createNodeId(),
      role: 'user',
      text: trimmed,
      at: Date.now(),
      status: 'done',
    }
    const pendingId = createNodeId()
    const pending: ChatMessage = {
      id: pendingId,
      role: 'assistant',
      text: '',
      at: Date.now(),
      status: 'thinking',
    }

    const history: ChatTurn[] = get()
      .messages.slice(-HISTORY_TURNS)
      .map((m) => ({ role: m.role, content: m.text }))
      .filter((t) => t.content.length > 0)

    set((s) => ({ messages: [...s.messages, userMsg, pending], busy: true }))

    const patch = (fields: Partial<ChatMessage>) =>
      set((s) => ({
        messages: s.messages.map((m) => (m.id === pendingId ? { ...m, ...fields } : m)),
      }))

    try {
      const response = await generateUI(trimmed, history, { model, effort })

      set((s) => ({ sessionUsage: accumulate(s.sessionUsage, response.meta.usage) }))

      if (!response.ok) {
        patch({
          status: 'error',
          text: `Generation failed (${response.stage}): ${response.error}`,
          source: response.meta.source,
          provider: response.meta.provider,
          model: response.meta.model,
          steps: response.meta.steps,
        })
        return
      }

      const run = useFlowStore.getState().applyAgentBlueprint(response.blueprint, trimmed)
      patch({
        status: run.ok ? 'done' : 'error',
        text: summarize(run),
        run,
        source: response.meta.source,
        provider: response.meta.provider,
        model: response.meta.model,
        usage: response.meta.usage,
        steps: response.meta.steps,
      })
    } catch (err) {
      patch({ status: 'error', text: err instanceof Error ? err.message : String(err) })
    } finally {
      set({ busy: false })
    }
  },

  clear: () => set({ messages: [], sessionUsage: EMPTY_USAGE }),
}))
