/**
 * Button — the generic action primitive.
 *
 * Rest surfaces map to the functional semantic colours: `primary` sits on
 * background-elevated with a border-default stroke, `secondary` on
 * background-overlay with border-subtle, `ghost` on nothing with text-secondary.
 *
 * Focus is the UI Kit's one focus language — the Primary/Noite gradient ring
 * over a dark inset with a night-light glow, as on WideButton, RoundButtonShell
 * and the card Button — so a primitive button focuses exactly like a kit
 * component. Unlike WideButton's fixed width, it sizes to its label.
 *
 * Controlled, like every kit component: the app's remote/keyboard handler sets
 * `status="focus"`; the button doesn't track focus itself.
 */

import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import type { CssVar, TextStyle } from '@/styles/global-tokens'
import spinnerIcon from '@/ui-kit/icons/spinner.svg'
import './primitives.css'
import { Text } from './Text'
import {
  borderColor,
  cssVar,
  spacing,
  surface,
  textColor,
  type BorderColor,
  type GridSpacing,
  type SurfaceColor,
  type TextColor,
} from './tokens'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'md' | 'lg'
export type ButtonStatus = 'default' | 'focus' | 'loading' | 'disabled'

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style' | 'className' | 'disabled' | 'color'> {
  variant?: ButtonVariant
  size?: ButtonSize
  status?: ButtonStatus
  iconLeft?: ReactNode
  iconRight?: ReactNode
  /** The label. */
  children: ReactNode
}

const SURFACE: Record<ButtonVariant, { fill?: SurfaceColor; stroke?: BorderColor; text: TextColor }> = {
  primary: { fill: 'elevated', stroke: 'default', text: 'primary' },
  secondary: { fill: 'overlay', stroke: 'subtle', text: 'primary' },
  ghost: { text: 'secondary' },
}

/** `md` matches WideButton's height (spacing 2xl); `lg` steps up one spacing token. */
const SIZE = {
  md: { height: '--dimension-spacing-core-2xl', paddingX: 'lg', icon: '--dimension-spacing-core-sm', label: 'body-sm-bold' },
  lg: { height: '--dimension-spacing-core-3xl', paddingX: 'xl', icon: '--dimension-spacing-core-lg', label: 'body-md-bold' },
} as const satisfies Record<ButtonSize, { height: CssVar; paddingX: GridSpacing; icon: CssVar; label: TextStyle }>

const FULL = cssVar('--dimension-radius-core-full')

function rootStyle(variant: ButtonVariant, size: ButtonSize, status: ButtonStatus): CSSProperties {
  const { fill, stroke, text } = SURFACE[variant]
  const focus = status === 'focus'
  return {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    height: cssVar(SIZE[size].height),
    margin: 0,
    paddingBlock: 0,
    paddingInline: spacing(SIZE[size].paddingX),
    border: 'none',
    borderRadius: FULL,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    backgroundColor: !focus && fill ? surface(fill) : 'transparent',
    // An inset shadow, not a border, so the stroke never changes the button's size.
    boxShadow:
      !focus && stroke
        ? `inset 0 0 0 ${cssVar('--dimension-border-width-semantic-button')} ${borderColor(stroke)}`
        : 'none',
    color: textColor(focus ? 'primary' : text),
    cursor: status === 'disabled' ? 'not-allowed' : status === 'loading' ? 'progress' : 'pointer',
  }
}

const focusFrame: CSSProperties = {
  position: 'absolute',
  inset: 0,
  borderRadius: FULL,
  backgroundImage: cssVar('--gradient-primary-night'),
}

const focusInset: CSSProperties = {
  position: 'absolute',
  inset: cssVar('--dimension-border-width-semantic-focus-ring'),
  borderRadius: FULL,
  overflow: 'hidden',
  backgroundColor: cssVar('--color-opacity-dark-70'),
  backgroundImage: `linear-gradient(0deg, ${cssVar('--color-core-neutral-charcoal')} 0%, transparent 100%)`,
}

const focusGlow: CSSProperties = {
  position: 'absolute',
  insetInline: 0,
  bottom: 0,
  height: '80%',
  opacity: cssVar('--opacity-semantic-overlay'),
  backgroundImage: `radial-gradient(ellipse at 50% 100%, ${cssVar('--color-core-primary-night-light')} 0%, transparent 70%)`,
}

const overlay: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
}

function iconSlot(size: ButtonSize): CSSProperties {
  const edge = cssVar(SIZE[size].icon)
  return { display: 'grid', placeItems: 'center', width: edge, height: edge, flexShrink: 0 }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    status = 'default',
    iconLeft,
    iconRight,
    children,
    type = 'button',
    onClick,
    ...rest
  },
  ref,
) {
  const loading = status === 'loading'
  const disabled = status === 'disabled'
  const spinnerEdge = cssVar(SIZE[size].icon)

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      disabled={disabled}
      aria-busy={loading || undefined}
      onClick={loading ? undefined : onClick}
      style={rootStyle(variant, size, status)}
    >
      {status === 'focus' && (
        <span aria-hidden style={focusFrame}>
          <span style={focusInset}>
            <span style={focusGlow} />
          </span>
        </span>
      )}
      <span
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: spacing('2xs'),
          // Hidden, not removed, so a loading button keeps its width.
          visibility: loading ? 'hidden' : undefined,
          opacity: disabled ? cssVar('--opacity-semantic-content-muted') : undefined,
        }}
      >
        {iconLeft && <span style={iconSlot(size)}>{iconLeft}</span>}
        <Text variant={SIZE[size].label} color="inherit">
          {children}
        </Text>
        {iconRight && <span style={iconSlot(size)}>{iconRight}</span>}
      </span>
      {loading && (
        <span style={overlay}>
          <img
            src={spinnerIcon}
            alt=""
            className="sfs-spin"
            style={{ width: spinnerEdge, height: spinnerEdge, display: 'block' }}
          />
        </span>
      )}
    </button>
  )
})
