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
import { useEffect, useRef, useState } from 'react'
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
  'rounded-md border border-line bg-surface px-2xs py-3xs text-sm text-ink focus:outline-none focus:ring focus:ring-brand'

/** One list item as a line: its fields in order, `|`-separated (a `|` inside a value is `\\|`), trailing blanks dropped. */
export function itemToLine(item: unknown, fields: string[]): string {
  const values = fields.map((f) =>
    item && typeof item === 'object' ? String((item as Record<string, unknown>)[f] ?? '').replace(/\|/g, '\\|') : '',
  )
  while (values.length > 1 && values[values.length - 1] === '') values.pop()
  return values.join(' | ')
}

/** A line back to an item — split on unescaped `|`; a blank field is left out. */
export function lineToItem(line: string, fields: string[]): Record<string, string> {
  const parts = line.split(/(?<!\\)\|/).map((p) => p.trim().replace(/\\\|/g, '|'))
  return Object.fromEntries(fields.flatMap((f, i) => (parts[i] ? [[f, parts[i]]] : [])))
}

/** The draft text as items, or why it can't be saved yet (a missing required field, too many items). */
export function parseListDraft(text: string, prop: ManifestProp): { items: Record<string, string>[] } | { error: string } {
  const fields = Object.values(prop.fields ?? {})
  const items = text
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => lineToItem(l, fields.map((f) => f.name)))
  if (prop.max !== undefined && items.length > prop.max) return { error: `At most ${prop.max} items.` }
  for (const [i, item] of items.entries()) {
    const missing = fields.find((f) => f.required && !item[f.name])
    if (missing) return { error: `Line ${i + 1} needs a ${missing.name}.` }
  }
  return { items }
}

/**
 * A list of objects, one item per line. It edits its own draft text — so spaces,
 * new lines and a started `|` survive typing — and saves only a valid list; an
 * invalid draft shows why instead of reaching the canvas.
 */
function ObjectListField({ id, propDef, currentValue, onChange }: {
  id: string
  propDef: ManifestProp
  currentValue: unknown
  onChange: (value: unknown) => void
}): JSX.Element {
  const fieldNames = Object.keys(propDef.fields ?? {})
  const saved = Array.isArray(currentValue) ? currentValue.map((item) => itemToLine(item, fieldNames)).join('\n') : ''
  const [draft, setDraft] = useState(saved)
  const [error, setError] = useState<string | null>(null)
  // A change from elsewhere (undo, another node, the agent) replaces the draft,
  // unless it is just this draft saved back.
  const lastSaved = useRef(saved)
  useEffect(() => {
    if (saved !== lastSaved.current) {
      lastSaved.current = saved
      setDraft(saved)
      setError(null)
    }
  }, [saved])

  return (
    <>
      <textarea
        id={id}
        rows={3}
        value={draft}
        aria-invalid={error !== null}
        onChange={(e) => {
          const text = e.target.value
          setDraft(text)
          const parsed = parseListDraft(text, propDef)
          if ('error' in parsed) return setError(parsed.error)
          setError(null)
          lastSaved.current = parsed.items.map((item) => itemToLine(item, fieldNames)).join('\n')
          onChange(parsed.items)
        }}
        className={FIELD_CLASS}
      />
      <span className="text-xs text-ink-muted">
        {error ?? `One item per line: ${fieldNames.join(' | ')}`}
      </span>
    </>
  )
}

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
    <div className="flex flex-col gap-3xs">
      <label
        htmlFor={id}
        className="flex items-center justify-between gap-2xs text-xs font-medium text-ink-muted"
      >
        <span>{label}</span>
        {kind === 'boolean' ? (
          <Switch id={id} checked={Boolean(currentValue)} onChange={(next) => onChange(next)} />
        ) : null}
      </label>

      {isTokenSelect ? (
        <div className="flex items-center gap-3xs">
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
          min={propDef.min}
          max={propDef.max}
          step={propDef.step}
          value={currentValue === undefined || currentValue === null ? '' : String(currentValue)}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          className={FIELD_CLASS}
        />
      ) : kind === 'list' && propDef.fields ? (
        <ObjectListField id={id} propDef={propDef} currentValue={currentValue} onChange={onChange} />
      ) : kind === 'list' ? (
        // A list of text, edited as one comma-separated line.
        <input
          id={id}
          type="text"
          value={Array.isArray(currentValue) ? currentValue.join(', ') : ''}
          onChange={(e) => onChange(e.target.value.split(',').map((item) => item.trim()).filter(Boolean))}
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
