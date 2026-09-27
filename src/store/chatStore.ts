/**
 * The AI conversation. Separate from `flowStore` (the document): a chat message
 * is ephemeral UI, the canvas edit it triggers is the undoable thing.
 *
 * `send()` reads the model/effort from `settingsStore`, calls aiClient.generateUI
 * (IPC), hands the Blueprint to `flowStore.applyAgentBlueprint` (interpret + render
 * as one undo step), attaches the `AgentRun`, and accumulates token/cost usage.
 *
 * After a successful render, it waits for the canvas's own render measurement
 * (`useRenderAudit` in Canvas.tsx, via `frameStore`) to settle and, if that found
 * real problems — overflow, overlap, collapsed text; nothing a Blueprint-level
 * check can see before it paints — sends them back for exactly one repair turn,
 * visible in the chat like any other edit.
 */

import { create } from 'zustand'
import { generateUI } from '@/services/aiClient'
import type { GenerateUIResponse } from '@/shared/blueprint'
import { useFlowStore, type AgentRun } from '@/store/flowStore'
import { useFrameStore } from '@/store/frameStore'
import { usePlayStore } from '@/store/playStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useDesignSystemStore } from '@/store/designSystemStore'
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
  const frames = run.screenCount > 1 ? ` on ${run.screenCount} frames` : ''
  const links = run.linkCount > 0 ? ` — ${run.linkCount} clickable link${run.linkCount === 1 ? '' : 's'}, press Play` : ''
  const base = `Rendered ${run.nodeCount} component${run.nodeCount === 1 ? '' : 's'}${frames} to the canvas${links}`
  const head = fixed > 0 ? `${base} (auto-fixed ${fixed} issue${fixed === 1 ? '' : 's'}).` : `${base}.`
  return run.notes.length > 0 ? `${head}\n\n${run.notes.map((n) => `• ${n}`).join('\n')}` : head
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

/**
 * Waits for the canvas's render measurement to settle after a fresh blueprint
 * paints — one frame for React's commit + `useRenderAudit`'s layout effect, then
 * self-hosted webfonts (the one concrete cause of a stale first reading, measured
 * live), then one more frame for that re-measure to land in `frameStore`.
 */
async function waitForRenderSettled(): Promise<string[]> {
  await new Promise(requestAnimationFrame)
  await document.fonts?.ready
  await new Promise(requestAnimationFrame)
  return useFrameStore.getState().renderProblems
}

/** Applies a generated Blueprint to the canvas and returns the message fields `patch` needs — shared by the first attempt and the one render-repair retry. */
function applyGenerated(response: GenerateUIResponse, promptText: string): Partial<ChatMessage> {
  if (!response.ok) {
    return {
      status: 'error',
      text: `Generation failed (${response.stage}): ${response.error}`,
      source: response.meta.source,
      provider: response.meta.provider,
      model: response.meta.model,
      steps: response.meta.steps,
    }
  }
  const run = useFlowStore.getState().applyAgentBlueprint(response.blueprint, promptText)
  // A generation that produced a clickable flow opens straight in the player.
  if (run.ok) {
    if (run.linkCount > 0) usePlayStore.getState().play()
    else usePlayStore.getState().edit()
  }
  return {
    status: run.ok ? 'done' : 'error',
    text: summarize(run),
    run,
    source: response.meta.source,
    provider: response.meta.provider,
    model: response.meta.model,
    usage: response.meta.usage,
    steps: response.meta.steps,
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
      const manifest = useDesignSystemStore.getState().active
      const response = await generateUI(trimmed, history, { model, effort }, manifest)

      set((s) => ({ sessionUsage: accumulate(s.sessionUsage, response.meta.usage) }))

      const applied = applyGenerated(response, trimmed)
      patch(applied)

      if (response.ok && applied.run?.ok) {
        const problems = await waitForRenderSettled()
        if (problems.length > 0) {
          const repairPrompt = `The screen just built has problems only visible once it renders: ${problems.join('; ')}. Rebuild it, fixing these — keep everything else about the request the same.`
          const repairUserMsg: ChatMessage = { id: createNodeId(), role: 'user', text: repairPrompt, at: Date.now(), status: 'done' }
          const repairPendingId = createNodeId()
          const repairPending: ChatMessage = { id: repairPendingId, role: 'assistant', text: '', at: Date.now(), status: 'thinking' }
          set((s) => ({ messages: [...s.messages, repairUserMsg, repairPending] }))
          const repairPatch = (fields: Partial<ChatMessage>) =>
            set((s) => ({ messages: s.messages.map((m) => (m.id === repairPendingId ? { ...m, ...fields } : m)) }))
          try {
            const repairHistory: ChatTurn[] = [
              ...history,
              { role: 'user', content: trimmed },
              { role: 'assistant', content: JSON.stringify(response.blueprint) },
            ]
            const repairResponse = await generateUI(repairPrompt, repairHistory, { model, effort }, manifest)
            set((s) => ({ sessionUsage: accumulate(s.sessionUsage, repairResponse.meta.usage) }))
            repairPatch(applyGenerated(repairResponse, repairPrompt))
          } catch (err) {
            repairPatch({ status: 'error', text: err instanceof Error ? err.message : String(err) })
          }
        }
      }
    } catch (err) {
      patch({ status: 'error', text: err instanceof Error ? err.message : String(err) })
    } finally {
      set({ busy: false })
    }
  },

  clear: () => set({ messages: [], sessionUsage: EMPTY_USAGE }),
}))
