/**
 * PropertyControl — the control-mapping engine (spec §8 Step 1).
 *
 * Given one `ManifestProp` from the active design system, it renders the right
 * input: enum → <select>, boolean → toggle, number → number field, string →
 * text/textarea — and, when the prop draws from a token scale (`tokenGroup`,
 * Phase 7), a <select> of that scale's real token names instead of a free-text
 * field, with a swatch for color tokens. Everything is a token-styled native
 * element (no Radix) so it stays consistent with the rest of the app and adds
 * no dependency.
 *
 * Per spec §7b, this panel is part of the app shell, not the canvas: the swatch
 * shows the token's literal resolved value (plain data, like a color picker
 * would), never a `var(--sfs-*)` — those only exist inside the canvas scope.
 *
 * It is dumb and controlled: `currentValue` in, `onChange(next)` out. The
 * PropertyInspector owns wiring that back to the Zustand store.
 */

import type { ManifestProp } from '@/shared/design-system/manifest'
import { inferControl, propLabel } from '@/shared/design-system/manifest'
import { cx } from '@/lib/cx'

export interface PropertyControlProps {
  propName: string
  propDef: ManifestProp
  currentValue: unknown
  onChange: (value: unknown) => void
  /**
   * This prop's token scale in the ACTIVE manifest, e.g. `{ brand: <hex> }`
   * for a `tokenGroup: 'colors'` prop. Only passed when the active system
   * actually declares tokens in that group.
   */
  tokenDict?: Record<string, string>
}

const FIELD_CLASS =
  'rounded-md border border-line bg-surface px-sm py-xs text-sm text-ink focus:outline-none focus:ring focus:ring-brand'

export function PropertyControl({
  propName,
  propDef,
  currentValue,
  onChange,
  tokenDict,
}: PropertyControlProps): JSX.Element {
  const id = `prop-${propName}`
  const kind = inferControl(propDef)
  const label = propLabel(propDef)

  const tokenNames = tokenDict ? Object.keys(tokenDict) : []
  // An explicit enum (`options`) is authoritative; a `tokenGroup` only kicks in
  // as a fallback UI when the prop is otherwise a free string.
  const isTokenSelect = !propDef.options && !!propDef.tokenGroup && tokenNames.length > 0

  return (
    <div className="flex flex-col gap-xs">
      <label
        htmlFor={id}
        className="flex items-center justify-between gap-sm text-xs font-medium text-ink-muted"
      >
        <span>{label}</span>
        {kind === 'boolean' ? (
          <Switch id={id} checked={Boolean(currentValue)} onChange={(next) => onChange(next)} />
        ) : null}
      </label>

      {isTokenSelect ? (
        <div className="flex items-center gap-xs">
          {propDef.tokenGroup === 'colors' ? (
            <ColorSwatch value={tokenDict?.[stringValue(currentValue, propDef)]} />
          ) : null}
          <select
            id={id}
            value={stringValue(currentValue, propDef)}
            onChange={(e) => onChange(e.target.value)}
            className={cx(FIELD_CLASS, 'flex-1')}
          >
            {tokenNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      ) : kind === 'select' && propDef.options ? (
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
      ) : kind === 'number' ? (
        <input
          id={id}
          type="number"
          value={currentValue === undefined || currentValue === null ? '' : String(currentValue)}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          className={FIELD_CLASS}
        />
      ) : kind === 'textarea' ? (
        <textarea
          id={id}
          rows={3}
          value={stringValue(currentValue, propDef)}
          onChange={(e) => onChange(e.target.value)}
          className={FIELD_CLASS}
        />
      ) : kind === 'text' ? (
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

/** A small square showing a token's literal, resolved value — plain data. */
function ColorSwatch({ value }: { value: string | undefined }): JSX.Element {
  return (
    <span
      aria-hidden
      className="h-md w-md shrink-0 rounded-sm border border-line"
      style={value ? { backgroundColor: value } : undefined}
    />
  )
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
