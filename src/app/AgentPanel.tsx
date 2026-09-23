import { useEffect, useRef, useState } from 'react'
import { isBridgeAvailable } from '@/services/aiClient'
import { useChatStore, type ChatMessage, type SessionUsage } from '@/store/chatStore'
import { useFlowStore } from '@/store/flowStore'
import { useSettingsStore } from '@/store/settingsStore'
import { EFFORT_LEVELS, MODEL_OPTIONS, modelLabel, type EffortLevel } from '@/shared/models'
import { cx } from '@/lib/cx'

const SUGGESTIONS = [
  'Build a 3-tier pricing card',
  'Show the match statistics on the right',
  'Design a settings screen with sections',
]

/**
 * Docked AI chat. A prompt goes over IPC to the main-process orchestrator; the
 * returned Blueprint is interpreted and rendered to the canvas as one undo step,
 * and the per-message report shows what (if anything) was auto-corrected.
 */
export function AgentPanel(): JSX.Element {
  const [draft, setDraft] = useState('')
  const messages = useChatStore((s) => s.messages)
  const busy = useChatStore((s) => s.busy)
  const send = useChatStore((s) => s.send)
  const clear = useChatStore((s) => s.clear)
  const bridge = isBridgeAvailable()

  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  function submit(): void {
    const text = draft.trim()
    if (!text || busy) return
    setDraft('')
    void send(text)
  }

  return (
    <section className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-lg py-2xs">
        <div className="flex items-center gap-2xs">
          <h2 className="text-xs font-semibold text-ink-muted">AI Agent</h2>
          <span
            className={cx(
              'rounded-full px-2xs py-3xs text-xs font-medium',
              bridge ? 'bg-success-subtle text-success' : 'bg-subtle text-ink-muted',
            )}
          >
            {bridge ? 'IPC bridge live' : 'web fallback'}
          </span>
        </div>
        {messages.length > 0 ? (
          <button
            type="button"
            onClick={clear}
            className="text-xs text-ink-muted hover:text-ink"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div ref={scrollRef} className="flex flex-1 flex-col gap-sm overflow-auto p-lg">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-2xs">
            <p className="text-sm text-ink-muted">
              Describe a screen. The agent builds it from the design system and renders it
              onto the canvas — as one undo step.
            </p>
            <div className="flex flex-col gap-3xs">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="rounded-md border border-line bg-surface px-sm py-2xs text-left text-sm text-ink hover:bg-subtle"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </div>

      <div className="flex flex-col gap-3xs border-t border-line p-lg">
        <GenerationControls />
        <div className="flex gap-3xs">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            placeholder="Describe a screen…"
            className="flex-1 rounded-md border border-line bg-surface px-2xs py-3xs text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring focus:ring-brand"
          />
          <button
            type="button"
            onClick={submit}
            disabled={busy || !draft.trim()}
            className="rounded-md bg-brand px-sm py-3xs text-sm font-medium text-ink-inverse hover:bg-brand-hover disabled:opacity-50 disabled:pointer-events-none"
          >
            {busy ? '…' : 'Send'}
          </button>
        </div>
      </div>
    </section>
  )
}

const SELECT_CLASS =
  'rounded-sm border border-line bg-surface px-3xs py-3xs text-xs text-ink focus:outline-none focus:ring focus:ring-brand'

function GenerationControls(): JSX.Element {
  const model = useSettingsStore((s) => s.model)
  const effort = useSettingsStore((s) => s.effort)
  const setModel = useSettingsStore((s) => s.setModel)
  const setEffort = useSettingsStore((s) => s.setEffort)
  const usage = useChatStore((s) => s.sessionUsage)

  return (
    <div className="flex flex-wrap items-center gap-3xs">
      <select
        value={model}
        onChange={(e) => setModel(e.target.value)}
        aria-label="Model"
        title="Model used for generation"
        className={SELECT_CLASS}
      >
        {MODEL_OPTIONS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label} — {m.hint}
          </option>
        ))}
      </select>

      <select
        value={effort}
        onChange={(e) => setEffort(e.target.value as EffortLevel)}
        aria-label="Effort"
        title="Reasoning effort / token budget"
        className={SELECT_CLASS}
      >
        {EFFORT_LEVELS.map((level) => (
          <option key={level} value={level}>
            {level}
          </option>
        ))}
      </select>

      <span
        className="ml-auto text-xs text-ink-muted"
        title={
          'This session only. Anthropic does not expose your plan usage limit to the ' +
          'CLI or API — check `claude` → /usage, or claude.ai/settings/usage.'
        }
      >
        {formatUsage(usage)}
      </span>
    </div>
  )
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function formatUsage(u: SessionUsage): string {
  if (u.calls === 0) return 'session: —'
  const tokens = formatTokens(u.inputTokens + u.outputTokens)
  const cost = u.costUsd > 0 ? ` · ${u.costEstimated ? '~' : ''}$${u.costUsd.toFixed(4)}` : ''
  return `session: ${tokens} tok${cost}`
}

function providerNote(m: ChatMessage): string {
  if (m.source === 'dummy' || m.source === 'web-fallback') return '(demo — no AI provider)'
  const via =
    m.provider === 'claude-cli' ? 'Claude Code' : m.provider === 'api-key' ? 'API' : null
  const parts = [m.model ? modelLabel(m.model) : null, via ? `via ${via}` : null].filter(Boolean)
  const tail = m.usage?.costUsd
    ? ` · ${m.usage.costEstimated ? '~' : ''}$${m.usage.costUsd.toFixed(4)}`
    : ''
  return parts.length ? `· ${parts.join(' ')}${tail}` : ''
}

function MessageBubble({ message }: { message: ChatMessage }): JSX.Element {
  const undo = useFlowStore((s) => s.undo)

  if (message.role === 'user') {
    return (
      <div className="self-end rounded-md bg-brand-subtle px-sm py-2xs text-sm text-brand-strong">
        {message.text}
      </div>
    )
  }

  if (message.status === 'thinking') {
    return <div className="self-start text-sm text-ink-muted">Thinking…</div>
  }

  const run = message.run
  const warnings = run?.issues.filter((i) => i.level === 'warn') ?? []

  return (
    <div className="flex flex-col gap-3xs self-start">
      <div
        className={cx(
          'rounded-md px-sm py-2xs text-sm',
          message.status === 'error'
            ? 'bg-danger-subtle text-danger'
            : 'bg-subtle text-ink',
        )}
      >
        {message.text}
        <span className="ml-3xs text-xs text-ink-muted">{providerNote(message)}</span>
      </div>

      {run?.ok ? (
        <div className="flex flex-wrap items-center gap-2xs pl-sm">
          <button
            type="button"
            onClick={undo}
            className="text-xs font-medium text-brand hover:underline"
          >
            Undo this turn
          </button>
          {warnings.length > 0 ? (
            <details className="text-xs text-ink-muted">
              <summary className="cursor-pointer select-none">
                {warnings.length} correction{warnings.length === 1 ? '' : 's'}
              </summary>
              <ul className="mt-3xs flex flex-col gap-3xs">
                {run.issues.map((issue, i) => (
                  <li key={i}>
                    <span className={issue.level === 'warn' ? 'text-danger' : 'text-ink-muted'}>
                      {issue.level === 'warn' ? '✕' : 'ℹ'}
                    </span>{' '}
                    {issue.message}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}

      {message.steps && message.steps.length > 0 ? (
        <details className="pl-sm text-xs text-ink-muted">
          <summary className="cursor-pointer select-none">
            pipeline · {message.steps.length} step{message.steps.length === 1 ? '' : 's'}
          </summary>
          <ol className="mt-3xs flex flex-col gap-3xs">
            {message.steps.map((step, i) => (
              <li key={i}>— {step}</li>
            ))}
          </ol>
        </details>
      ) : null}
    </div>
  )
}
