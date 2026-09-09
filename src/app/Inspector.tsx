import { getEntry, type Control } from '@/design-system/registry'
import { findNode } from '@/model/nodeTree'
import { useFlowStore } from '@/store/flowStore'

function Field({
  name,
  control,
  value,
  onChange,
}: {
  name: string
  control: Control
  value: unknown
  onChange: (value: unknown) => void
}): JSX.Element {
  const labelId = `field-${name}`
  return (
    <label htmlFor={labelId} className="flex flex-col gap-xs">
      <span className="text-xs font-medium text-ink-muted">{control.label}</span>

      {control.kind === 'text' && (
        <input
          id={labelId}
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-md border border-line bg-surface px-sm py-xs text-sm text-ink focus:outline-none focus:ring focus:ring-brand"
        />
      )}

      {control.kind === 'textarea' && (
        <textarea
          id={labelId}
          rows={3}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-md border border-line bg-surface px-sm py-xs text-sm text-ink focus:outline-none focus:ring focus:ring-brand"
        />
      )}

      {control.kind === 'boolean' && (
        <input
          id={labelId}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-md w-md accent-brand"
        />
      )}

      {control.kind === 'select' && (
        <select
          id={labelId}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-md border border-line bg-surface px-sm py-xs text-sm text-ink focus:outline-none focus:ring focus:ring-brand"
        >
          {control.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
    </label>
  )
}

export function Inspector(): JSX.Element {
  const tree = useFlowStore((s) => s.tree)
  const selectedId = useFlowStore((s) => s.selectedId)
  const updateProps = useFlowStore((s) => s.updateProps)

  const node = selectedId ? findNode(tree, selectedId) : null
  const entry = node ? getEntry(node.type) : null

  return (
    <section className="flex flex-1 flex-col gap-md overflow-auto p-lg">
      <h2 className="text-xs font-semibold text-ink-muted">Inspector</h2>

      {!node || !entry ? (
        <p className="text-sm text-ink-muted">Select a component on the canvas to edit it.</p>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">{entry.label}</span>
            <span className="text-xs text-ink-muted">{node.id}</span>
          </div>
          <div className="flex flex-col gap-sm">
            {Object.entries(entry.controls).map(([name, control]) => (
              <Field
                key={name}
                name={name}
                control={control}
                value={(node.props as Record<string, unknown>)[name]}
                onChange={(value) => updateProps(node.id, { [name]: value })}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
