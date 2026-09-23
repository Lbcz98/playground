/**
 * Notification — Figma UI Kit node 3288:11323.
 *
 * The message that arrives in the top-right corner over whatever is on screen:
 * the programme's logo, and — as a `message` — the line of text that says why it
 * came. `rounded` is the same notification with the text withheld, the logo
 * alone, which is how it rests until it has something to say.
 *
 * It is the one overlay that carries no scrim (the `notification` layer model is
 * the top-right shade alone), so it never dims the picture behind it.
 *
 * Focus is the kit's one `<FocusRing>` over the same pill the round controls
 * use, and the resting pill is the same translucent background — the geometry is
 * `round-button` (the hit target) around `round-button-circle` (the visible
 * pill), exactly as `RoundButtonShell` builds it.
 *
 * Every step across the pill comes off the layout grid and the token list — `sm`
 * inset, `xs` gap, an `avatar`-sized logo — and the pill hugs them, so its width
 * is the sum of its parts rather than a number of its own. The one measure it
 * fixes is the text column, `notification-text-width`, which is what keeps a
 * one-line message and a two-line one the same shape. Figma draws this pill from
 * hand-set values off the grid (18 inset, a 44 logo, 269 wide); the grid is the
 * source of truth, and the Figma component is kept to it rather than the reverse.
 *
 * Figma's `Iluminação`, the light pooling in the focused pill, is the glow
 * `<FocusRing>` already carries, so it is not drawn a second time here; what
 * remains of the difference is the ring's own strength, which is kit-wide and
 * lives in `opacity.semantic.focus-glow`.
 */

import type { CSSProperties, ReactNode } from 'react'
import {
  FocusRing,
  resolveInteractionState,
  RestingBorder,
  size,
  spacing,
  Text,
  token,
  type InteractionState,
} from '@/primitives'

export type NotificationKind = 'message' | 'rounded'
export type NotificationState = Extract<InteractionState, 'default' | 'focus'>

export interface NotificationProps {
  /** `message` carries the text; `rounded` is the logo alone. Default `message`. */
  kind?: NotificationKind
  /** Default `default`. */
  interactionState?: NotificationState
  /** What the notification says. Ignored by `rounded`. */
  title?: string
  /** The programme's logo. A neutral circle stands in when there is none. */
  logoSrc?: string
  onClick?: () => void
}

const PILL = token('--dimension-radius-semantic-pill')

const root: CSSProperties = {
  position: 'relative',
  height: size('round-button'),
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
}

/** The visible pill: the logo, then the text, inside the round-button circle. */
const pill: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: spacing('xs'),
  height: size('round-button-circle'),
  paddingInline: spacing('sm'),
  borderRadius: PILL,
}

/** At rest the pill paints itself; focused, the ring paints its own fill. */
const restPill: CSSProperties = {
  ...pill,
  backgroundColor: token('--color-semantic-functional-background-translucent'),
}

/** `rounded` is the pill closed up around the logo alone. */
const roundedPill: CSSProperties = {
  width: size('round-button-circle'),
  paddingInline: 0,
  justifyContent: 'center',
}

/**
 * The column the message is laid out to, so one line and two give the pill the
 * same shape. `white-space` is inherited, so this is also what lets the title
 * break; and being a flex column it blockifies the `<Text>` span, which is what
 * puts the line box on the text's own line height instead of the one it would
 * otherwise inherit from the page. It hugs that text, and the pill centres it.
 */
const titleColumn: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  width: size('notification-text-width'),
  flexShrink: 0,
  whiteSpace: 'pre-line',
}

function Logo({ src }: { src?: string }): ReactNode {
  const edge = size('avatar')
  // Positioned, so it paints above `<FocusRing>`, which is: an unpositioned logo
  // goes under the ring's fill and the focused pill loses it altogether.
  const shape: CSSProperties = {
    position: 'relative',
    width: edge,
    height: edge,
    borderRadius: PILL,
    display: 'block',
    flexShrink: 0,
  }
  return src ? (
    <img src={src} alt="" style={{ ...shape, objectFit: 'cover' }} />
  ) : (
    <span style={{ ...shape, backgroundColor: token('--color-semantic-functional-background-elevated') }} />
  )
}

/** The message that arrives in the top-right corner: the programme logo and a line saying why it came. */
export function Notification({
  kind = 'message',
  interactionState,
  title = 'Paredão formado!\nVote agora para eliminar',
  logoSrc,
  onClick,
}: NotificationProps): ReactNode {
  const state = resolveInteractionState(
    'ui-kit/Notification',
    interactionState,
    { prop: 'focus', value: undefined },
    'default',
  )
  const focus = state === 'focus'
  const rounded = kind === 'rounded'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rounded ? 'Notificação' : undefined}
      style={{ ...root, width: rounded ? size('round-button') : undefined }}
    >
      <span
        style={{
          ...(focus ? pill : restPill),
          ...(rounded ? roundedPill : null),
        }}
      >
        {focus ? <FocusRing shape="pill" /> : <RestingBorder shape="pill" />}
        <Logo src={logoSrc} />
        {rounded ? null : (
          <span style={titleColumn}>
            <Text as="span" variant="body-sm-bold">
              {title}
            </Text>
          </span>
        )}
      </span>
    </button>
  )
}
