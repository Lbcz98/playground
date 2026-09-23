import { useRef, useState } from 'react'
import { type ImportResult, selectActiveBundleState, useDesignSystemStore } from '@/store/designSystemStore'
import { SCREENFLOW_MANIFEST_ID } from '@/shared/design-system/screenflow-manifest'
import { cx } from '@/lib/cx'

interface Status {
  kind: 'error' | 'ok'
  text: string
  /** Every warning, one per line — shown on hover. */
  detail?: string
}

/** An import's outcome as one status line; what it had to leave out is counted, and listed on hover. */
function importStatus(result: ImportResult, done: (id: string) => string): Status {
  if (!result.ok) return { kind: 'error', text: result.error }
  const warnings = result.warnings ?? []
  if (warnings.length === 0) return { kind: 'ok', text: `${done(result.id)}.` }
  return {
    kind: 'ok',
    text: `${done(result.id)} · ${warnings.length} warning${warnings.length === 1 ? '' : 's'} (hover for details).`,
    detail: warnings.map((w) => `${w.component}${w.prop ? `.${w.prop}` : ''}: ${w.message}`).join('\n'),
  }
}

/**
 * Switch the active design system, import new ones from a Storybook / react-docgen
 * JSON export, attach design tokens (DTCG / Style Dictionary), and — Phase 8B —
 * attach a live component bundle. The Canvas, Inspector and AI agent all follow
 * the selection instantly.
 */
export function DesignSystemSwitcher(): JSX.Element {
  const library = useDesignSystemStore((s) => s.library)
  const activeId = useDesignSystemStore((s) => s.activeId)
  const registry = useDesignSystemStore((s) => s.registry)
  const bundleState = useDesignSystemStore(selectActiveBundleState)
  const setActive = useDesignSystemStore((s) => s.setActive)
  const importStorybook = useDesignSystemStore((s) => s.importStorybook)
  const importTokens = useDesignSystemStore((s) => s.importTokens)
  const importBundle = useDesignSystemStore((s) => s.importBundle)
  const remove = useDesignSystemStore((s) => s.remove)

  const componentsRef = useRef<HTMLInputElement>(null)
  const tokensRef = useRef<HTMLInputElement>(null)
  const bundleRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status | null>(null)

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
    setStatus(importStatus(result, (id) => `Imported "${id}"`))
  }

  async function onTokensFile(file: File): Promise<void> {
    const json = await readJson(file)
    if (json === undefined) return
    const result = await importTokens(json)
    setStatus(importStatus(result, () => 'Tokens applied'))
  }

  async function onBundleFile(file: File): Promise<void> {
    setStatus(null)
    const code = await file.text()
    const result = await importBundle(code)
    setStatus(
      result.ok
        ? { kind: 'ok', text: 'Bundle attached — loading live components…' }
        : { kind: 'error', text: result.error },
    )
  }

  const active = library.find((m) => m.id === activeId)
  const isImported = activeId !== SCREENFLOW_MANIFEST_ID
  const colorCount = active ? Object.keys(active.tokens.colors).length : 0
  const spacingCount = active ? Object.keys(active.tokens.spacing).length : 0

  const trust = !isImported
    ? null
    : bundleState === 'loading'
      ? 'loading live components…'
      : bundleState === 'error'
        ? 'bundle failed to load · generic renderers'
        : registry.liveCount > 0
          ? registry.genericCount > 0
            ? `${registry.liveCount} live · ${registry.genericCount} generic`
            : `${registry.liveCount} live component${registry.liveCount === 1 ? '' : 's'}`
          : 'generic renderers'

  const summary =
    active &&
    [
      `${Object.keys(active.components).length} component${
        Object.keys(active.components).length === 1 ? '' : 's'
      }`,
      colorCount ? `${colorCount} colors` : null,
      spacingCount ? `${spacingCount} spacing` : null,
      trust,
    ]
      .filter(Boolean)
      .join(' · ')

  return (
    <section className="flex flex-col gap-3xs">
      <h2 className="text-xs font-semibold text-ink-muted">Design system</h2>

      <select
        value={activeId}
        onChange={(e) => void setActive(e.target.value)}
        className="rounded-md border border-line bg-surface px-2xs py-3xs text-sm text-ink focus:outline-none focus:ring focus:ring-brand"
      >
        {library.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} · v{m.version}
          </option>
        ))}
      </select>

      <div className="flex flex-wrap items-center gap-3xs">
        <button
          type="button"
          onClick={() => componentsRef.current?.click()}
          className="flex-1 rounded-md border border-line bg-surface px-2xs py-3xs text-xs font-medium text-ink hover:bg-subtle"
        >
          Import Storybook JSON…
        </button>
        {isImported ? (
          <>
            <button
              type="button"
              onClick={() => tokensRef.current?.click()}
              className="rounded-md border border-line bg-surface px-2xs py-3xs text-xs font-medium text-ink hover:bg-subtle"
            >
              Import tokens…
            </button>
            <button
              type="button"
              onClick={() => bundleRef.current?.click()}
              title="A UMD build with react/react-dom external, exporting window.__sfsDesignSystem = { <ComponentId>: Component }"
              className="rounded-md border border-line bg-surface px-2xs py-3xs text-xs font-medium text-ink hover:bg-subtle"
            >
              Import component bundle…
            </button>
            <button
              type="button"
              onClick={() => void remove(activeId)}
              className="rounded-md border border-line bg-surface px-2xs py-3xs text-xs font-medium text-ink-muted hover:text-danger"
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
      <input
        ref={bundleRef}
        type="file"
        accept="text/javascript,.js"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void onBundleFile(file)
        }}
      />

      {isImported ? (
        <p className="text-xs text-ink-muted">
          A component bundle executes as real code, with the same reach as any web page's own
          script (DOM only) — never Node.js or Electron APIs, and never your files.
        </p>
      ) : null}

      {summary ? <p className="text-xs text-ink-muted">{summary}</p> : null}

      {status ? (
        <p
          className={cx('text-xs', status.kind === 'error' ? 'text-danger' : 'text-ink-muted')}
          title={status.detail}
        >
          {status.text}
        </p>
      ) : null}
    </section>
  )
}
