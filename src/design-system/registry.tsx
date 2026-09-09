/**
 * ComponentRegistry — the catalog (`catalog.ts`) plus the React `render` function
 * for each component. This is what the canvas uses to turn a `CanvasNode` into
 * real DOM. `render` maps already-validated props to token Tailwind classes only.
 *
 * Adding a component: add the entry in `catalog.ts`, then a `render` function here.
 */

import type { ReactElement, ReactNode } from 'react'
import { cx } from '@/lib/cx'
import {
  GAP_CLASS,
  PADDING_CLASS,
  RADIUS_CLASS,
  SHADOW_CLASS,
  SURFACE_CLASS,
} from './tokens'
import {
  Catalog,
  type CatalogEntry,
  type ButtonProps,
  type InputProps,
  type StackProps,
  type TextProps,
  buttonSchema,
  inputSchema,
  stackSchema,
  textSchema,
} from './catalog'

export type { Control, ComponentCategory } from './catalog'

export interface RegistryEntry extends CatalogEntry {
  render: (props: Record<string, unknown>, children: ReactNode) => ReactElement
}

// ===========================================================================
// Stack
// ===========================================================================

const DIRECTION_CLASS: Record<StackProps['direction'], string> = {
  vertical: 'flex-col',
  horizontal: 'flex-row',
}
const ALIGN_CLASS: Record<StackProps['align'], string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
}
const JUSTIFY_CLASS: Record<StackProps['justify'], string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
}

function renderStack(raw: Record<string, unknown>, children: ReactNode): ReactElement {
  const p = stackSchema.parse(raw)
  return (
    <div
      className={cx(
        'flex min-w-none',
        DIRECTION_CLASS[p.direction],
        GAP_CLASS[p.gap],
        PADDING_CLASS[p.padding],
        ALIGN_CLASS[p.align],
        JUSTIFY_CLASS[p.justify],
        SURFACE_CLASS[p.surface],
        RADIUS_CLASS[p.radius],
        SHADOW_CLASS[p.shadow],
        p.bordered && 'border border-line',
        p.grow && 'flex-1',
      )}
    >
      {children}
    </div>
  )
}

// ===========================================================================
// Text
// ===========================================================================

const TEXT_VARIANT_CLASS: Record<TextProps['variant'], string> = {
  display: 'text-2xl font-bold',
  title: 'text-xl font-semibold',
  heading: 'text-lg font-semibold',
  body: 'text-md font-regular',
  caption: 'text-sm font-regular',
}
const TEXT_TONE_CLASS: Record<TextProps['tone'], string> = {
  default: 'text-ink',
  muted: 'text-ink-muted',
  inverse: 'text-ink-inverse',
  brand: 'text-brand',
}
const TEXT_ALIGN_CLASS: Record<TextProps['align'], string> = {
  start: 'text-left',
  center: 'text-center',
  end: 'text-right',
}
const TEXT_TAG: Record<TextProps['variant'], 'h1' | 'h2' | 'h3' | 'p' | 'span'> = {
  display: 'h1',
  title: 'h2',
  heading: 'h3',
  body: 'p',
  caption: 'span',
}

function renderText(raw: Record<string, unknown>): ReactElement {
  const p = textSchema.parse(raw)
  const Tag = TEXT_TAG[p.variant]
  return (
    <Tag
      className={cx(
        'm-none',
        TEXT_VARIANT_CLASS[p.variant],
        TEXT_TONE_CLASS[p.tone],
        TEXT_ALIGN_CLASS[p.align],
      )}
    >
      {p.content}
    </Tag>
  )
}

// ===========================================================================
// Button
// ===========================================================================

const BUTTON_SIZE_CLASS: Record<ButtonProps['size'], string> = {
  sm: 'text-sm px-sm py-xs gap-xs',
  md: 'text-md px-md py-sm gap-xs',
  lg: 'text-lg px-lg py-md gap-sm',
}
const BUTTON_VARIANT_CLASS: Record<ButtonProps['variant'], string> = {
  primary: 'bg-brand text-ink-inverse hover:bg-brand-hover',
  secondary: 'bg-surface text-ink border border-line hover:bg-subtle',
  ghost: 'bg-transparent text-ink hover:bg-subtle',
  danger: 'bg-danger text-ink-inverse hover:bg-danger-hover',
}

function renderButton(raw: Record<string, unknown>): ReactElement {
  const p = buttonSchema.parse(raw)
  return (
    <button
      type="button"
      disabled={p.disabled}
      className={cx(
        'inline-flex items-center justify-center rounded-md font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring focus-visible:ring-brand',
        'disabled:opacity-50 disabled:pointer-events-none',
        BUTTON_SIZE_CLASS[p.size],
        BUTTON_VARIANT_CLASS[p.variant],
        p.fullWidth && 'w-full',
      )}
    >
      {p.label}
    </button>
  )
}

// ===========================================================================
// Input
// ===========================================================================

const INPUT_SIZE_CLASS: Record<InputProps['size'], string> = {
  sm: 'text-sm px-sm py-xs',
  md: 'text-md px-md py-sm',
  lg: 'text-lg px-md py-sm',
}
const INPUT_STATE_CLASS: Record<InputProps['state'], string> = {
  default: 'border-line',
  error: 'border-danger',
}

function renderInput(raw: Record<string, unknown>): ReactElement {
  const p = inputSchema.parse(raw)
  return (
    <div className="flex flex-col gap-xs">
      {p.label ? <span className="text-sm font-medium text-ink">{p.label}</span> : null}
      <input
        type="text"
        placeholder={p.placeholder}
        className={cx(
          'w-full rounded-md border bg-surface text-ink',
          'placeholder:text-ink-muted focus:outline-none focus:ring focus:ring-brand',
          INPUT_SIZE_CLASS[p.size],
          INPUT_STATE_CLASS[p.state],
        )}
      />
      {p.helpText ? (
        <span className={cx('text-xs', p.state === 'error' ? 'text-danger' : 'text-ink-muted')}>
          {p.helpText}
        </span>
      ) : null}
    </div>
  )
}

// ===========================================================================
// Registry
// ===========================================================================

export const ComponentRegistry = {
  Stack: { ...Catalog.Stack, render: renderStack },
  Text: { ...Catalog.Text, render: renderText },
  Button: { ...Catalog.Button, render: renderButton },
  Input: { ...Catalog.Input, render: renderInput },
} as const satisfies Record<string, RegistryEntry>

export type RegistryType = keyof typeof ComponentRegistry

export const REGISTRY_TYPES = Object.keys(ComponentRegistry) as RegistryType[]

export function isRegistryType(type: string): type is RegistryType {
  return Object.prototype.hasOwnProperty.call(ComponentRegistry, type)
}

export function getEntry(type: string): RegistryEntry | null {
  return isRegistryType(type) ? ComponentRegistry[type] : null
}
