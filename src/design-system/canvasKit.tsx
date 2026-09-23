/**
 * The canvas kit — the layout Stack, Text and Button the built-in catalog offers
 * next to the DTV UI Kit, as real components so Storybook documents the very
 * element the canvas draws (`Canvas Kit/*` stories; the catalog parity tests diff
 * their docgen against `catalog.ts`).
 *
 * Styling is Tailwind, compiled from `primitives.ts`. Every prop's union is written
 * out, because react-docgen can't read a type derived from a scale's keys; the
 * `Same` checks at the bottom pin each one to the catalog's schema, so the two
 * can't drift.
 *
 * They hold no state and no hooks: the registry calls them as plain functions
 * (see `registry.tsx`), so the element it gets back is the component's own root —
 * the one the canvas decorates with selection and `data-node-id`.
 */

import type { ReactElement, ReactNode } from 'react'
import { cx } from '@/lib/cx'
import type { ButtonProps, StackProps, TextProps } from './catalog'
import { GAP_CLASS, PADDING_CLASS, RADIUS_CLASS, SHADOW_CLASS, SURFACE_CLASS } from './tokens'

/** A step of the spacing scale. `md` is off the 8pt grid, so the frame rules keep it out of layouts. */
type Space = 'none' | '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'

// ===========================================================================
// Stack
// ===========================================================================

export interface CanvasStackProps {
  /** The main axis. Default `vertical`. */
  direction?: 'vertical' | 'horizontal'
  /** Space between children. On the root and between modules it is the frame's gutter. Default `sm`. */
  gap?: Space
  /** Space inside the edge. The root keeps `none` — the frame applies the safe area. Default `none`. */
  padding?: Space
  /** Cross-axis alignment. Default `stretch`. */
  align?: 'start' | 'center' | 'end' | 'stretch'
  /** Main-axis distribution. Default `start`. */
  justify?: 'start' | 'center' | 'end' | 'between'
  /** Background role. The root stays `none`, so the video shows through. Default `none`. */
  surface?: 'none' | 'surface' | 'subtle' | 'brand-subtle'
  /** Corner radius step. Default `none`. */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  /** Elevation step. Default `none`. */
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  /** Draws the default border. Default off. */
  bordered?: boolean
  /** Takes the free space along its parent's main axis. Default off. */
  grow?: boolean
  children?: ReactNode
}

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

/** The only layout container: a flexbox row or column with token gap and padding. Nest them to build any layout. */
export function CanvasStack({
  direction = 'vertical',
  gap = 'sm',
  padding = 'none',
  align = 'stretch',
  justify = 'start',
  surface = 'none',
  radius = 'none',
  shadow = 'none',
  bordered = false,
  grow = false,
  children,
}: CanvasStackProps): ReactElement {
  return (
    <div
      className={cx(
        'flex min-w-none',
        DIRECTION_CLASS[direction],
        GAP_CLASS[gap],
        PADDING_CLASS[padding],
        ALIGN_CLASS[align],
        JUSTIFY_CLASS[justify],
        SURFACE_CLASS[surface],
        RADIUS_CLASS[radius],
        SHADOW_CLASS[shadow],
        bordered && 'border border-line',
        grow && 'flex-1',
      )}
    >
      {children}
    </div>
  )
}

// ===========================================================================
// Text
// ===========================================================================

export interface CanvasTextProps {
  /** The words. Default `Text`. */
  content?: string
  /** Size and weight; the element follows (display h1, title h2, heading h3, body p, caption span). Default `body`. */
  variant?: 'display' | 'title' | 'heading' | 'body' | 'caption'
  /** Colour role. Default `default`. */
  tone?: 'default' | 'muted' | 'inverse' | 'brand'
  /** Text alignment. Default `start`. */
  align?: 'start' | 'center' | 'end'
}

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

/** A single run of text. */
export function CanvasText({
  content = 'Text',
  variant = 'body',
  tone = 'default',
  align = 'start',
}: CanvasTextProps): ReactElement {
  const Tag = TEXT_TAG[variant]
  return (
    <Tag className={cx('m-none', TEXT_VARIANT_CLASS[variant], TEXT_TONE_CLASS[tone], TEXT_ALIGN_CLASS[align])}>
      {content}
    </Tag>
  )
}

// ===========================================================================
// Button
// ===========================================================================

export interface CanvasButtonProps {
  /** What it does, e.g. "Create account". Default `Button`. */
  label?: string
  /** Emphasis. Default `primary`. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  /** Control size. Default `md`. */
  size?: 'sm' | 'md' | 'lg'
  /** Fills its container's width. Default off. */
  fullWidth?: boolean
  /** Shown but not actionable. Default off. */
  disabled?: boolean
}

const BUTTON_SIZE_CLASS: Record<ButtonProps['size'], string> = {
  sm: 'text-sm px-2xs py-3xs gap-3xs',
  md: 'text-md px-sm py-2xs gap-3xs',
  lg: 'text-lg px-lg py-sm gap-2xs',
}
const BUTTON_VARIANT_CLASS: Record<ButtonProps['variant'], string> = {
  primary: 'bg-brand text-ink-inverse hover:bg-brand-hover',
  secondary: 'bg-surface text-ink border border-line hover:bg-subtle',
  ghost: 'bg-transparent text-ink hover:bg-subtle',
  danger: 'bg-danger text-ink-inverse hover:bg-danger-hover',
}

/** A text-only call to action. */
export function CanvasButton({
  label = 'Button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
}: CanvasButtonProps): ReactElement {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cx(
        'inline-flex items-center justify-center rounded-md font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring focus-visible:ring-brand',
        'disabled:opacity-50 disabled:pointer-events-none',
        BUTTON_SIZE_CLASS[size],
        BUTTON_VARIANT_CLASS[variant],
        fullWidth && 'w-full',
      )}
    >
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// The written-out unions are exactly the catalog's — a compile error otherwise.
// ---------------------------------------------------------------------------

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false

true satisfies Same<Required<Omit<CanvasStackProps, 'children'>>, StackProps>
true satisfies Same<Required<CanvasTextProps>, TextProps>
true satisfies Same<Required<CanvasButtonProps>, ButtonProps>
