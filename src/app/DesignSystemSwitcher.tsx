import { useRef, useState } from 'react'
import { useDesignSystemStore } from '@/store/designSystemStore'
import { SCREENFLOW_MANIFEST_ID } from '@/shared/design-system/screenflow-manifest'
import { cx } from '@/lib/cx'

/**
 * Switch the active design system and import new ones from a Storybook /
 * react-docgen JSON export. The Canvas, Inspector and AI agent all follow the
 * selection instantly.
 */
export function DesignSystemSwitcher(): JSX.Element {
  const library = useDesignSystemStore((s) => s.library)
  const activeId = useDesignSystemStore((s) => s.activeId)
  const setActive = useDesignSystemStore((s) => s.setActive)
  const importStorybook = useDesignSystemStore((s) => s.importStorybook)
  const remove = useDesignSystemStore((s) => s.remove)

  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null)

  async function onFile(file: File): Promise<void> {
    setStatus(null)
    let json: unknown
    try {
      json = JSON.parse(await file.text())
    } catch {
      setStatus({ kind: 'error', text: 'That file is not valid JSON.' })
      return
    }
    const name = file.name.replace(/\.json$/i, '')
    const result = await importStorybook(json, { name })
    setStatus(
      result.ok
        ? { kind: 'ok', text: `Imported "${result.id}".` }
        : { kind: 'error', text: result.error },
    )
  }

  const active = library.find((m) => m.id === activeId)
  const canRemove = activeId !== SCREENFLOW_MANIFEST_ID

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

      <div className="flex items-center gap-xs">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex-1 rounded-md border border-line bg-surface px-sm py-xs text-xs font-medium text-ink hover:bg-subtle"
        >
          Import Storybook JSON…
        </button>
        {canRemove ? (
          <button
            type="button"
            onClick={() => void remove(activeId)}
            className="rounded-md border border-line bg-surface px-sm py-xs text-xs font-medium text-ink-muted hover:text-danger"
          >
            Remove
          </button>
        ) : null}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void onFile(file)
        }}
      />

      {active ? (
        <p className="text-xs text-ink-muted">
          {Object.keys(active.components).length} component
          {Object.keys(active.components).length === 1 ? '' : 's'}
          {active.id !== SCREENFLOW_MANIFEST_ID ? ' · generic renderers' : ''}
        </p>
      ) : null}

      {status ? (
        <p className={cx('text-xs', status.kind === 'error' ? 'text-danger' : 'text-ink-muted')}>
          {status.text}
        </p>
      ) : null}
    </section>
  )
}
