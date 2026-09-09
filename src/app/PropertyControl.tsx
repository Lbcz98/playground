/**
 * PropertyControl — the control-mapping engine (spec §8 Step 1).
 *
 * Given one `ManifestProp` from the active design system, it renders the right
 * input: enum → <select>, boolean → toggle, number → number field, string →
 * text/textarea. Everything is a token-styled native element (no Radix) so it
 * stays consistent with the rest of the app and adds no dependency.
 *
 * It is dumb and controlled: `currentValue` in, `onChange(next)` out. The
 * PropertyInspector owns wiring that back to the Zustand store.
 */

import type { ManifestProp } from '@/shared/design-system/manifest'
import { inferControl, propLabel } from '@/shared/design-system/manifest'

export interface PropertyControlProps {
  propName: string
  propDef: ManifestProp
  currentValue: unknown
  onChange: (value: unknown) => void
}

const FIELD_CLASS =
  'rounded-md border border-line bg-surface px-sm py-xs text-sm text-ink focus:outline-none focus:ring focus:ring-brand'

export function PropertyControl({
  propName,
  propDef,
  currentValue,
  onChange,
}: PropertyControlProps): JSX.Element {
  const id = `prop-${propName}`
  const kind = inferControl(propDef)
  const label = propLabel(propDef)

  return (
    <div className="flex flex-col gap-xs">
      <label
        htmlFor={id}
        className="flex items-center justify-between gap-sm text-xs font-medium text-ink-muted"
      >
        <span>{label}</span>
        {kind === 'boolean' ? (
          <Switch
            id={id}
            checked={Boolean(currentValue)}
            onChange={(next) => onChange(next)}
          />
        ) : null}
      </label>

      {kind === 'select' && propDef.options ? (
        <select
          id={id}
          value={stringValue(currentValue, propDef)}
          onChange={(e) => onChange(e.target.value)}
          className={FIELD_CLASS}
        >
          {propDef.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : null}

      {kind === 'number' ? (
        <input
          id={id}
          type="number"
          value={currentValue === undefined || currentValue === null ? '' : String(currentValue)}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          className={FIELD_CLASS}
        />
      ) : null}

      {kind === 'textarea' ? (
        <textarea
          id={id}
          rows={3}
          value={stringValue(currentValue, propDef)}
          onChange={(e) => onChange(e.target.value)}
          className={FIELD_CLASS}
        />
      ) : null}

      {kind === 'text' ? (
        <input
          id={id}
          type="text"
          value={stringValue(currentValue, propDef)}
          onChange={(e) => onChange(e.target.value)}
          className={FIELD_CLASS}
        />
      ) : null}

      {propDef.description ? (
        <span className="text-xs text-ink-muted">{propDef.description}</span>
      ) : null}
    </div>
  )
}

function stringValue(value: unknown, prop: ManifestProp): string {
  if (value !== undefined && value !== null) return String(value)
  if (prop.defaultValue !== undefined && prop.defaultValue !== null) return String(prop.defaultValue)
  return ''
}

/** A token-styled toggle built from a native checkbox. */
function Switch({
  id,
  checked,
  onChange,
}: {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
}): JSX.Element {
  return (
    <span className="relative inline-flex h-md w-xl shrink-0 items-center">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer h-md w-xl appearance-none rounded-full border border-line bg-subtle transition-colors checked:border-brand checked:bg-brand focus:outline-none focus:ring focus:ring-brand"
      />
      <span className="pointer-events-none absolute left-xs h-sm w-sm rounded-full bg-surface transition-transform peer-checked:translate-x-md" />
    </span>
  )
}
