/**
 * Main Menu — Figma UI Kit node 6024:6367.
 *
 * A left cluster (profile, schedule, a weather item) and a right cluster (the
 * live program's EPG text + logo, then a channel bug), pinned to opposite
 * edges. Figma absolute-positions "Options" and "Live" within a full-width
 * frame; this uses `justify-content: space-between` instead, matching the
 * Button/WideButton convention of flow layout over percentage insets.
 *
 * Every round control here (profile, schedule, weather, logo) is the same
 * `RoundButtonShell` RoundedButton already uses — this component carries no
 * new circular-button styling of its own.
 *
 * Avatar/program-logo/channel-bug are real, per-viewer/per-broadcast content,
 * not kit chrome — they're plain `src` props with no bundled default image; a
 * neutral token-coloured circle fills in when none is given.
 */

import type { CSSProperties, ReactNode } from 'react'
import { Text, token } from '@/primitives'
import scheduleIcon from './icons/schedule.svg'
import weatherIcon from './icons/weather.svg'
import { RoundButtonShell } from './RoundButtonShell'

export interface MainMenuProps {
  avatarSrc?: string
  onAvatarClick?: () => void

  onScheduleClick?: () => void

  weatherTitle?: string
  weatherSubtitle?: string
  onWeatherClick?: () => void

  programTitle?: string
  programSubtitle?: string
  logoSrc?: string
  onLogoClick?: () => void

  bugSrc?: string
  /** Reveals the focus ring around the bug — an interaction affordance, not a static look. */
  bugFocused?: boolean
  onBugClick?: () => void
}

const row: CSSProperties = { display: 'flex', alignItems: 'center' }

const cluster: CSSProperties = {
  ...row,
  gap: 'var(--dimension-spacing-core-3xs)',
}

const textStack: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--dimension-spacing-core-3xs)',
  minWidth: 0,
}

function ContentCircle({ src, size, alt }: { src?: string; size: string; alt: string }): ReactNode {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        style={{
          width: size,
          height: size,
          borderRadius: 'var(--dimension-radius-core-full)',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    )
  }
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--dimension-radius-core-full)',
        backgroundColor: token('--color-semantic-functional-background-elevated'),
        display: 'block',
      }}
    />
  )
}

export function MainMenu({
  avatarSrc,
  onAvatarClick,
  onScheduleClick,
  weatherTitle = 'Previsão do tempo',
  weatherSubtitle = 'São Paulo, SP',
  onWeatherClick,
  programTitle = 'Copa do Mundo: Equador x Argentina',
  programSubtitle = 'A seguir Central da Copa',
  logoSrc,
  onLogoClick,
  bugSrc,
  bugFocused = false,
  onBugClick,
}: MainMenuProps): ReactNode {
  return (
    <nav style={{ ...row, justifyContent: 'space-between', width: '100%' }}>
      <div style={cluster}>
        <RoundButtonShell label="Profile" onClick={onAvatarClick}>
          <ContentCircle src={avatarSrc} size="var(--dimension-spacing-core-2xl)" alt="" />
        </RoundButtonShell>

        <RoundButtonShell label="Schedule" onClick={onScheduleClick}>
          <img
            src={scheduleIcon}
            alt=""
            style={{
              width: 'var(--dimension-spacing-core-xl)',
              height: 'var(--dimension-spacing-core-xl)',
              display: 'block',
            }}
          />
        </RoundButtonShell>

        <div style={row}>
          <RoundButtonShell label="Weather" onClick={onWeatherClick}>
            <img
              src={weatherIcon}
              alt=""
              style={{
                width: 'var(--dimension-spacing-core-2xl)',
                height: 'var(--dimension-spacing-core-2xl)',
                display: 'block',
              }}
            />
          </RoundButtonShell>
          <div style={{ ...textStack, paddingInlineStart: 'var(--dimension-spacing-core-3xs)' }}>
            <Text variant="body-lg-bold" opacity="title" truncate>
              {weatherTitle}
            </Text>
            <Text variant="body-md-medium" opacity="text-secondary">
              {weatherSubtitle}
            </Text>
          </div>
        </div>
      </div>

      <div style={cluster}>
        <div style={row}>
          <div
            style={{
              ...textStack,
              alignItems: 'end',
              textAlign: 'right',
              paddingInline: 'var(--dimension-spacing-core-xs)',
              paddingBlock: 'var(--dimension-spacing-core-2xs)',
              minWidth: 0,
            }}
          >
            <Text variant="body-lg-bold" opacity="title" truncate>
              {programTitle}
            </Text>
            <Text variant="body-md-medium" opacity="text-secondary">
              {programSubtitle}
            </Text>
          </div>
          <RoundButtonShell focus label="Now playing" onClick={onLogoClick}>
            <ContentCircle src={logoSrc} size="var(--dimension-spacing-core-3xl)" alt="" />
          </RoundButtonShell>
        </div>

        <button
          type="button"
          aria-label="Interactive content"
          onClick={onBugClick}
          style={{
            position: 'relative',
            width: 'var(--dimension-spacing-core-4xl)',
            height: 'var(--dimension-spacing-core-4xl)',
            padding: 0,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {bugFocused && (
            <span
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 'var(--dimension-radius-core-full)',
                border: `var(--dimension-border-width-core-thin) solid ${token('--color-semantic-focus-outline')}`,
              }}
            />
          )}
          <ContentCircle src={bugSrc} size="var(--dimension-spacing-core-4xl)" alt="" />
        </button>
      </div>
    </nav>
  )
}
