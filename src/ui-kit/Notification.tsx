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

import type { ReactNode } from 'react'
import { FocusRing, RestingBorder, Text, type InteractionState } from '@/primitives'
import './ui-kit.css'

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

function Logo({ src }: { src?: string }): ReactNode {
  return src ? (
    <img src={src} alt="" className="sfs-notification-logo" />
  ) : (
    <span className="sfs-notification-logo" data-empty="" />
  )
}

/** The message that arrives in the top-right corner: the programme logo and a line saying why it came. */
export function Notification({
  kind = 'message',
  interactionState,
  title,
  logoSrc,
  onClick,
}: NotificationProps): ReactNode {
  const state = interactionState ?? 'default'
  const rounded = kind === 'rounded'

  return (
    <button
      className="sfs-notification sfs-motion sfs-focusable"
      data-kind={kind}
      data-state={state}
      type="button"
      onClick={onClick}
      aria-label={rounded ? 'Notificação' : undefined}
    >
      <span className="sfs-notification-pill">
        {state === 'focus' ? <FocusRing shape="pill" /> : <RestingBorder shape="pill" />}
        <Logo src={logoSrc} />
        {rounded ? null : (
          <span className="sfs-notification-title">
            <Text as="span" variant="body-sm-bold">
              {title}
            </Text>
          </span>
        )}
      </span>
    </button>
  )
}
