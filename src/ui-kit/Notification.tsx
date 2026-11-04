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
 * The pill is the sum of its parts: Figma's 44 logo (`notification-logo`)
 * centred in the closed circle — the inset is what the circle leaves around it —
 * an `xs` gap and the text column, `notification-text-width`, which keeps a
 * one-line message and a two-line one the same shape. The logo, column and
 * motion were tuned in the notification motion exploration (option 9).
 *
 * `open` makes it arrive and leave. Opening, the pill drops in and widens from
 * the circle while the message fades in from a blur and slides in x with the
 * pill's edge, and the focus ring follows a moment later; closing, message, logo
 * and ring go first, then the pill shrinks back to the circle and, near the end,
 * lifts and fades. It is the one component off the system spring: its own
 * curves and timings are the `motion.semantic.notification-*` tokens.
 *
 * Figma's `Iluminação`, the light pooling in the focused pill, is the glow
 * `<FocusRing>` already carries, so it is not drawn a second time here; what
 * remains of the difference is the ring's own strength, which is kit-wide and
 * lives in `opacity.semantic.focus-glow`.
 */

import type { ReactNode } from 'react'
import { FocusRing, RestingBorder, Text, type InteractionState } from '@/primitives'
import './ui-kit.css'

export type NotificationKind = 'message' | 'rounded'
type NotificationState = Extract<InteractionState, 'default' | 'focus'>

interface NotificationProps {
  /** Use `span` inside a navigation `<Link>`; actions remain buttons. */
  as?: 'button' | 'span'
  /** `message` carries the text; `rounded` is the logo alone. Default `message`. */
  kind?: NotificationKind
  /** Default `default`. */
  interactionState?: NotificationState
  /** What the notification says. Ignored by `rounded`. */
  title?: string
  /** The programme's logo. A neutral circle stands in when there is none. */
  logoSrc?: string
  /**
   * Whether it is on screen. Changing it plays the arrival or the leaving; while
   * closed it is invisible and out of reach. Default `true`, shown at rest.
   */
  open?: boolean
  onClick?: () => void
}

function Logo({ src }: { src?: string }): ReactNode {
  return src ? (
    <img src={src} alt="" className="sfs-notification-logo" />
  ) : (
    <span className="sfs-notification-logo" data-empty="" />
  )
}

/** The message that arrives in the top-right corner: the programme logo and a line saying why it came. */
export function Notification({
  as = 'button',
  kind = 'message',
  interactionState,
  title,
  logoSrc,
  open = true,
  onClick,
}: NotificationProps): ReactNode {
  const state = interactionState ?? 'default'
  const rounded = kind === 'rounded'
  const Element = as

  return (
    <Element
      className={`sfs-notification sfs-motion sfs-focusable${as === 'span' ? ' sfs-link-surface' : ''}`}
      data-kind={kind}
      data-state={state}
      data-open={open}
      {...(as === 'button' ? { type: 'button' as const, tabIndex: open ? undefined : -1 } : {})}
      onClick={as === 'button' ? onClick : undefined}
      aria-label={rounded ? 'Notificação' : undefined}
      aria-hidden={open ? undefined : true}
    >
      <span className="sfs-notification-pill">
        {state === 'focus' ? <FocusRing shape="pill" /> : <RestingBorder shape="pill" />}
        <Logo src={logoSrc} />
        {rounded ? null : (
          <span className="sfs-notification-title">
            <Text as="span" variant="body-md-bold">
              {title}
            </Text>
          </span>
        )}
      </span>
    </Element>
  )
}
