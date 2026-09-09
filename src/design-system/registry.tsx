/**
 * ComponentRegistry — a `DesignSystemManifest` hydrated with React `render`
 * functions. This is what the canvas uses to turn a `CanvasNode` into real DOM.
 *
 * `hydrateRegistry(manifest)` pairs every component the active manifest declares
 * with a renderer:
 *   - the built-in ScreenFlow design system uses the hand-written renderers below
 *   - every other (imported) design system renders through `renderGeneric` — a
 *     token-driven structural placeholder — because we don't load external
 *     Storybook React modules
 *
 * Per-component Zod schemas and default props are compiled from the manifest
 * (`manifest-zod.ts`), so the registry always tracks the live design system.
 */

import type { ReactElement, ReactNode } from 'react'
import { z } from 'zod'
import { cx } from '@/lib/cx'
import type {
  DesignSystemManifest,
  ManifestComponent,
} from '@/shared/design-system/manifest'
import { deriveDefaultProps, inferControl, propLabel } from '@/shared/design-system/manifest'
import { compileManifestSchemas } from '@/shared/design-system/manifest-zod'
import { SCREENFLOW_MANIFEST_ID } from '@/shared/design-system/screenflow-manifest'
import {
  GAP_CLASS,
  PADDING_CLASS,
  RADIUS_CLASS,
  SHADOW_CLASS,
  SURFACE_CLASS,
} from './tokens'
import {
  type ButtonProps,
  type Control,
  type InputProps,
  type StackProps,
  type TextProps,
  buttonSchema,
  inputSchema,
  stackSchema,
  textSchema,
} from './catalog'

export type { Control, ComponentCategory } from './catalog'

export type RenderFn = (props: Record<string, unknown>, children: ReactNode) => ReactElement

export interface HydratedEntry {
  id: string
  label: string
  category: string
  summary: string
  acceptsChildren: boolean
  component: ManifestComponent
  /** Strict object schema compiled from the manifest. */
  schema: z.ZodObject<z.ZodRawShape>
  /** Per-prop schemas, for field-level validation / repair. */
  fieldSchemas: Record<string, z.ZodTypeAny>
  defaultProps: Record<string, unknown>
  /** Legacy control metadata, synthesised for the current Inspector / Palette. */
  controls: Record<string, Control>
  render: RenderFn
  /** True when this renders through the generic placeholder. */
  generic: boolean
}

export interface HydratedRegistry {
  manifestId: string
  entries: Record<string, HydratedEntry>
  types: string[]
  get: (type: string) => HydratedEntry | null
  has: (type: string) => boolean
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
// Generic renderer — the fallback for any imported component with no code
// renderer. Structural only: a labelled box that honours the children slot and
// picks up the active design system's brand colour via the injected CSS var.
// ===========================================================================

function summariseProps(component: ManifestComponent, props: Record<string, unknown>): string {
  const parts: string[] = []
  for (const prop of Object.values(component.props)) {
    const value = props[prop.name]
    if (value === undefined || value === '' || value === false) continue
    parts.push(`${prop.name}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
  }
  return parts.join('  ·  ')
}

function makeGenericRenderer(component: ManifestComponent): RenderFn {
  return function renderGeneric(props, children): ReactElement {
    const summary = summariseProps(component, props)
    return (
      <div
        className="flex flex-col gap-xs rounded-md border border-l-4 border-line bg-subtle p-md"
        style={{ borderLeftColor: 'var(--sfs-color-brand)' }}
      >
        <span className="text-xs font-semibold text-ink-muted">{component.name}</span>
        {summary ? <span className="text-sm text-ink">{summary}</span> : null}
        {component.acceptsChildren ? (
          <div className="flex flex-col gap-sm pt-xs">{children}</div>
        ) : null}
      </div>
    )
  }
}

// ===========================================================================
// Registry hydration
// ===========================================================================

/** Hand-written renderers for the built-in ScreenFlow design system. */
export const SCREENFLOW_RENDERERS: Record<string, RenderFn> = {
  Stack: renderStack,
  Text: renderText,
  Button: renderButton,
  Input: renderInput,
}

function toControl(component: ManifestComponent, name: string): Control {
  const prop = component.props[name]
  const label = propLabel(prop)
  const kind = inferControl(prop)
  if (kind === 'select' && prop.options) {
    return { kind: 'select', label, options: prop.options }
  }
  if (kind === 'boolean') return { kind: 'boolean', label }
  if (kind === 'textarea') return { kind: 'textarea', label }
  return { kind: 'text', label }
}

export function hydrateRegistry(manifest: DesignSystemManifest): HydratedRegistry {
  const schemas = compileManifestSchemas(manifest)
  const useCode = manifest.id === SCREENFLOW_MANIFEST_ID
  const entries: Record<string, HydratedEntry> = {}

  for (const component of Object.values(manifest.components)) {
    const schema = schemas[component.id]
    const codeRender = useCode ? SCREENFLOW_RENDERERS[component.id] : undefined
    const controls: Record<string, Control> = {}
    for (const name of Object.keys(component.props)) controls[name] = toControl(component, name)

    entries[component.id] = {
      id: component.id,
      label: component.name,
      category: component.category ?? 'component',
      summary: component.description,
      acceptsChildren: component.acceptsChildren,
      component,
      schema,
      fieldSchemas: schema.shape as Record<string, z.ZodTypeAny>,
      defaultProps: deriveDefaultProps(component),
      controls,
      render: codeRender ?? makeGenericRenderer(component),
      generic: !codeRender,
    }
  }

  const types = Object.keys(entries)
  return {
    manifestId: manifest.id,
    entries,
    types,
    get: (type) => entries[type] ?? null,
    has: (type) => type in entries,
  }
}
