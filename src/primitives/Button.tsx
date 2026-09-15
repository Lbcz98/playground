/**
 * Button — the generic action primitive.
 *
 * Rest surfaces map to the functional semantic colours: `primary` sits on
 * background-elevated, `secondary` on background-overlay, `ghost` on nothing
 * with text-secondary. `primary` and `secondary` draw the kit's one
 * `<RestingBorder>`.
 *
 * Focus draws the kit's one `<FocusRing>` and loading its one `<Spinner>`, so a
 * primitive button behaves exactly like a kit component. Unlike WideButton's
 * fixed width, it sizes to its label.
 *
 * Controlled, like every kit component: the app's remote/keyboard handler sets
 * `interactionState="focus"`; the button doesn't track focus itself.
 */

import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import type { TextStyle } from '@/styles/global-tokens'
import { FocusRing } from './FocusRing'
import { resolveInteractionState, type InteractionState } from './interactionState'
import { RestingBorder } from './RestingBorder'
import { Spinner } from './Spinner'
import { Text } from './Text'
import {
  size as sizeRole,
  spacing,
  surface,
  textColor,
  token,
  type GridSpacing,
  type SizeRole,
  type SurfaceColor,
  type TextColor,
} from './tokens'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'md' | 'lg'
export type ButtonStatus = Extract<InteractionState, 'default' | 'focus' | 'loading' | 'disabled'>

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style' | 'className' | 'disabled' | 'color'> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Default `default`. */
  interactionState?: ButtonStatus
  /** @deprecated Use `interactionState` — same values. */
  status?: ButtonStatus
  iconLeft?: ReactNode
  iconRight?: ReactNode
  /** The label. */
  children: ReactNode
}

const SURFACE: Record<ButtonVariant, { fill?: SurfaceColor; bordered: boolean; text: TextColor }> = {
  primary: { fill: 'elevated', bordered: true, text: 'primary' },
  secondary: { fill: 'overlay', bordered: true, text: 'primary' },
  ghost: { bordered: false, text: 'secondary' },
}

/** `md` matches WideButton's height; `lg` steps up one control size. */
const SIZE = {
  md: { height: 'control-height', paddingX: 'lg', icon: 'icon-sm', label: 'body-sm-bold' },
  lg: { height: 'control-height-lg', paddingX: 'xl', icon: 'icon-lg', label: 'body-md-bold' },
} as const satisfies Record<ButtonSize, { height: SizeRole; paddingX: GridSpacing; icon: SizeRole; label: TextStyle }>

function rootStyle(variant: ButtonVariant, size: ButtonSize, state: ButtonStatus): CSSProperties {
  const { fill, text } = SURFACE[variant]
  const focus = state === 'focus'
  return {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    height: sizeRole(SIZE[size].height),
    margin: 0,
    paddingBlock: 0,
    paddingInline: spacing(SIZE[size].paddingX),
    border: 'none',
    borderRadius: token('--dimension-radius-semantic-pill'),
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    backgroundColor: !focus && fill ? surface(fill) : 'transparent',
    color: textColor(focus ? 'primary' : text),
    cursor: state === 'disabled' ? 'not-allowed' : state === 'loading' ? 'progress' : 'pointer',
  }
}

const overlay: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
}

function iconSlot(size: ButtonSize): CSSProperties {
  const edge = sizeRole(SIZE[size].icon)
  return { display: 'grid', placeItems: 'center', width: edge, height: edge, flexShrink: 0 }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    interactionState,
    status,
    iconLeft,
    iconRight,
    children,
    type = 'button',
    onClick,
    ...rest
  },
  ref,
) {
  const state = resolveInteractionState('primitives/Button', interactionState, { prop: 'status', value: status }, 'default')
  const loading = state === 'loading'
  const disabled = state === 'disabled'
  const focus = state === 'focus'

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      disabled={disabled}
      aria-busy={loading || undefined}
      onClick={loading ? undefined : onClick}
      style={rootStyle(variant, size, state)}
    >
      {focus && <FocusRing shape="pill" />}
      {!focus && SURFACE[variant].bordered && <RestingBorder shape="pill" />}
      <span
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: spacing('2xs'),
          // Hidden, not removed, so a loading button keeps its width.
          visibility: loading ? 'hidden' : undefined,
          opacity: disabled ? token('--opacity-semantic-state-disabled') : undefined,
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
          <Spinner size={SIZE[size].icon} />
        </span>
      )}
    </button>
  )
})
