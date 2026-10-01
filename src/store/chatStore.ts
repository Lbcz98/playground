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
import { screenMode, type ChatTurn, type GenerateUISource, type GenerateUsage, type RequestedMode, type RouterQuestion, type ScreenMode } from '@/shared/blueprint'
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
  /** The mode the screen was generated in (meta.mode). */
  mode?: ScreenMode | 'both'
  /** What the pipeline tells the user (router notes, a mode fallback). */
  notices?: string[]
  /** The router asked instead of generating; `asked` is the request to re-send. */
  question?: RouterQuestion
  asked?: string
  answered?: boolean
}

export type QuestionChoice = RouterQuestion['choices'][number]

/** The plan's button labels. */
export const CHOICE_LABELS: Record<QuestionChoice, string> = {
  faithful: 'Seguir padrões',
  exploratory: 'Explore além do padrão',
  both: 'Gere duas opções para comparação',
}

/** The buttons a question shows — the ones it carries (a law question: only Seguir padrões). */
export function offeredChoices(question: RouterQuestion): QuestionChoice[] {
  return question.choices
}

/**
 * The measured cost of one generation on the CLI (eval, Sep 30 – Oct 1): Faithful ≈ US$ 0.215, Exploratory
 * US$ 0.246–0.42. "Os dois" runs both, each with its own planner — the shared Faithful plan saves none, it only keeps
 * the two comparable — so its range is their sum.
 */
const FAITHFUL_COST_USD = 0.215
const EXPLORATORY_COST_USD: [number, number] = [0.246, 0.42]
const brl = (n: number): string => n.toFixed(2).replace('.', ',')

/** The note "Os dois" shows before it runs: the session's own average × 2 once there is one, else the measured range. */
export function bothCostNote(u: SessionUsage): string {
  const cost =
    u.generations > 0 && u.costUsd > 0
      ? `~US$ ${brl((u.costUsd / u.generations) * 2)} (média da sessão × 2)`
      : `~US$ ${brl(FAITHFUL_COST_USD + EXPLORATORY_COST_USD[0])}–${brl(FAITHFUL_COST_USD + EXPLORATORY_COST_USD[1])}`
  return `≈ 2 gerações · ${cost} · ~1 min`
}

export interface SessionUsage {
  calls: number
  inputTokens: number
  outputTokens: number
  costUsd: number
  /** Generations run (an "Os dois" with both branches counts 2) — for the session's average cost. */
  generations: number
  /** True if any contributing call's cost was an estimate. */
  costEstimated: boolean
}

const EMPTY_USAGE: SessionUsage = {
  calls: 0,
  inputTokens: 0,
  outputTokens: 0,
  costUsd: 0,
  generations: 0,
  costEstimated: false,
}

const HISTORY_TURNS = 10

interface ChatState {
  messages: ChatMessage[]
  busy: boolean
  sessionUsage: SessionUsage
  /** `mode` overrides the selector; `label` is what the user bubble shows instead of the prompt. */
  send: (prompt: string, options?: { mode?: RequestedMode; label?: string }) => Promise<void>
  /** Answer a router question: re-send its request in the chosen mode. */
  answer: (messageId: string, choice: QuestionChoice) => void
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

function accumulate(prev: SessionUsage, u: GenerateUsage | undefined, generations = 1): SessionUsage {
  if (!u) return prev
  return {
    calls: prev.calls + 1,
    generations: prev.generations + generations,
    inputTokens: prev.inputTokens + (u.inputTokens ?? 0),
    outputTokens: prev.outputTokens + (u.outputTokens ?? 0),
    costUsd: prev.costUsd + (u.costUsd ?? 0),
    costEstimated: prev.costEstimated || !!u.costEstimated,
  }
}

/** Longest the repair waits for the canvas to measure a fresh screen before giving up (no canvas mounted, say). */
const RENDER_SETTLE_TIMEOUT_MS = 2000

/**
 * The canvas's render problems for the screen just applied, or null when no
 * fresh measurement arrived. `sinceVersion` is `frameStore.renderVersion` read
 * before the apply: waiting for it to move is what keeps this from returning the
 * previous screen's reading. Then webfonts (a stale first reading was measured
 * live) and one more frame for that re-measure to land.
 */
async function waitForRenderSettled(sinceVersion: number): Promise<string[] | null> {
  const deadline = Date.now() + RENDER_SETTLE_TIMEOUT_MS
  while (useFrameStore.getState().renderVersion === sinceVersion) {
    if (Date.now() > deadline) return null
    await new Promise(requestAnimationFrame)
  }
  await document.fonts?.ready
  await new Promise(requestAnimationFrame)
  return useFrameStore.getState().renderProblems
}

/** Applies a generated Blueprint to the canvas and returns the message fields `patch` needs — shared by the first attempt and the one render-repair retry. */
function applyGenerated(response: GenerateUIResponse, promptText: string): Partial<ChatMessage> {
  if (!response.ok && response.question) {
    const { question } = response
    const alternative = question.faithfulAlternative ? `Dentro dos padrões: ${question.faithfulAlternative}` : null
    return {
      status: 'done',
      text: [question.text, question.why, alternative].filter(Boolean).join('\n\n'),
      question,
      asked: promptText,
      source: response.meta.source,
      provider: response.meta.provider,
      usage: response.meta.usage,
      steps: response.meta.steps,
    }
  }
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
    mode: response.meta.mode,
    notices: response.meta.notices,
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  busy: false,
  sessionUsage: EMPTY_USAGE,

  send: async (prompt, options = {}) => {
    const trimmed = prompt.trim()
    if (!trimmed || get().busy) return

    const settings = useSettingsStore.getState()
    const { model, effort } = settings
    const mode: RequestedMode = options.mode ?? settings.mode

    const userMsg: ChatMessage = {
      id: createNodeId(),
      role: 'user',
      text: options.label ?? trimmed,
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
      const response = await generateUI(trimmed, history, { model, effort, mode }, manifest)

      set((s) => ({ sessionUsage: accumulate(s.sessionUsage, response.meta.usage, response.meta.branches ?? 1) }))

      const measuredBefore = useFrameStore.getState().renderVersion
      const applied = applyGenerated(response, trimmed)
      patch(applied)

      // Never on an Os dois result: the repair re-runs the request, which would rebuild both branches.
      if (response.ok && applied.run?.ok && response.meta.mode !== 'both') {
        const problems = await waitForRenderSettled(measuredBefore)
        if (problems && problems.length > 0) {
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
            // The repair keeps the mode this screen ran in: it never re-routes, never asks again.
            const repairMode: RequestedMode = mode === 'auto' ? screenMode(response.meta) : mode
            const repairResponse = await generateUI(repairPrompt, repairHistory, { model, effort, mode: repairMode }, manifest)
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

  answer: (messageId, choice) => {
    const asked = get().messages.find((m) => m.id === messageId)
    if (!asked?.question || !asked.asked || asked.answered || get().busy) return
    if (!offeredChoices(asked.question).includes(choice)) return
    set((s) => ({ messages: s.messages.map((m) => (m.id === messageId ? { ...m, answered: true } : m)) }))
    void get().send(asked.asked, { mode: choice, label: CHOICE_LABELS[choice] })
  },

  clear: () => set({ messages: [], sessionUsage: EMPTY_USAGE }),
}))
