import { useRef, useState } from 'react'
import { useDesignSystemStore } from '@/store/designSystemStore'
import { SCREENFLOW_MANIFEST_ID } from '@/shared/design-system/screenflow-manifest'
import { cx } from '@/lib/cx'

/**
 * Switch the active design system, import new ones from a Storybook / react-docgen
 * JSON export, and attach design tokens (DTCG / Style Dictionary) to an imported
 * system. The Canvas, Inspector and AI agent all follow the selection instantly.
 */
export function DesignSystemSwitcher(): JSX.Element {
  const library = useDesignSystemStore((s) => s.library)
  const activeId = useDesignSystemStore((s) => s.activeId)
  const setActive = useDesignSystemStore((s) => s.setActive)
  const importStorybook = useDesignSystemStore((s) => s.importStorybook)
  const importTokens = useDesignSystemStore((s) => s.importTokens)
  const remove = useDesignSystemStore((s) => s.remove)

  const componentsRef = useRef<HTMLInputElement>(null)
  const tokensRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null)

  async function readJson(file: File): Promise<unknown | undefined> {
    setStatus(null)
    try {
      return JSON.parse(await file.text())
    } catch {
      setStatus({ kind: 'error', text: 'That file is not valid JSON.' })
      return undefined
    }
  }

  async function onComponentsFile(file: File): Promise<void> {
    const json = await readJson(file)
    if (json === undefined) return
    const result = await importStorybook(json, { name: file.name.replace(/\.json$/i, '') })
    setStatus(
      result.ok
        ? { kind: 'ok', text: `Imported "${result.id}".` }
        : { kind: 'error', text: result.error },
    )
  }

  async function onTokensFile(file: File): Promise<void> {
    const json = await readJson(file)
    if (json === undefined) return
    const result = await importTokens(json)
    setStatus(
      result.ok
        ? { kind: 'ok', text: 'Tokens applied.' }
        : { kind: 'error', text: result.error },
    )
  }

  const active = library.find((m) => m.id === activeId)
  const isImported = activeId !== SCREENFLOW_MANIFEST_ID

  const summary =
    active &&
    [
      `${Object.keys(active.components).length} component${
        Object.keys(active.components).length === 1 ? '' : 's'
      }`,
      Object.keys(active.tokens.colors).length
        ? `${Object.keys(active.tokens.colors).length} colors`
        : null,
      Object.keys(active.tokens.spacing).length
        ? `${Object.keys(active.tokens.spacing).length} spacing`
        : null,
      isImported && !Object.keys(active.tokens.colors).length ? 'generic renderers' : null,
    ]
      .filter(Boolean)
      .join(' · ')

  return (
    <section className="flex flex-col gap-xs">
      <h2 className="text-xs font-semibold text-ink-muted">Design system</h2>

      <select
        value={activeId}
        onChange={(e) => void setActive(e.target.value)}
        className="rounded-md border border-line bg-surface px-sm py-xs text-sm text-ink focus:outline-none focus:ring focus:ring-brand"
      >
        {library.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} · v{m.version}
          </option>
        ))}
      </select>

      <div className="flex flex-wrap items-center gap-xs">
        <button
          type="button"
          onClick={() => componentsRef.current?.click()}
          className="flex-1 rounded-md border border-line bg-surface px-sm py-xs text-xs font-medium text-ink hover:bg-subtle"
        >
          Import Storybook JSON…
        </button>
        {isImported ? (
          <>
            <button
              type="button"
              onClick={() => tokensRef.current?.click()}
              className="rounded-md border border-line bg-surface px-sm py-xs text-xs font-medium text-ink hover:bg-subtle"
            >
              Import tokens…
            </button>
            <button
              type="button"
              onClick={() => void remove(activeId)}
              className="rounded-md border border-line bg-surface px-sm py-xs text-xs font-medium text-ink-muted hover:text-danger"
            >
              Remove
            </button>
          </>
        ) : null}
      </div>

      <input
        ref={componentsRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void onComponentsFile(file)
        }}
      />
      <input
        ref={tokensRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void onTokensFile(file)
        }}
      />

      {summary ? <p className="text-xs text-ink-muted">{summary}</p> : null}

      {status ? (
        <p className={cx('text-xs', status.kind === 'error' ? 'text-danger' : 'text-ink-muted')}>
          {status.text}
        </p>
      ) : null}
    </section>
  )
}
