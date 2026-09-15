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
import { focusOutline, size, spacing, Stack, Text, token, type SizeRole } from '@/primitives'
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

const PILL = token('--dimension-radius-semantic-pill')

/** A text column that can shrink below its content, so long titles ellipsise. */
const textStack: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: spacing('3xs'),
  minWidth: 0,
}

function ContentCircle({ src, role, alt }: { src?: string; role: SizeRole; alt: string }): ReactNode {
  const edge = size(role)
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        style={{ width: edge, height: edge, borderRadius: PILL, objectFit: 'cover', display: 'block' }}
      />
    )
  }
  return (
    <span
      style={{
        width: edge,
        height: edge,
        borderRadius: PILL,
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
    <Stack as="nav" direction="row" align="center" justify="between">
      <Stack direction="row" align="center" gap="3xs">
        <RoundButtonShell label="Profile" onClick={onAvatarClick}>
          <ContentCircle src={avatarSrc} role="avatar" alt="" />
        </RoundButtonShell>

        <RoundButtonShell label="Schedule" onClick={onScheduleClick}>
          <img
            src={scheduleIcon}
            alt=""
            style={{ width: size('icon-xl'), height: size('icon-xl'), display: 'block' }}
          />
        </RoundButtonShell>

        <Stack direction="row" align="center">
          <RoundButtonShell label="Weather" onClick={onWeatherClick}>
            <img
              src={weatherIcon}
              alt=""
              style={{ width: size('icon-2xl'), height: size('icon-2xl'), display: 'block' }}
            />
          </RoundButtonShell>
          <div style={{ ...textStack, paddingInlineStart: spacing('3xs') }}>
            <Text variant="body-lg-bold" opacity="title" truncate>
              {weatherTitle}
            </Text>
            <Text variant="body-md-medium" opacity="text-secondary">
              {weatherSubtitle}
            </Text>
          </div>
        </Stack>
      </Stack>

      <Stack direction="row" align="center" gap="3xs">
        <Stack direction="row" align="center">
          <div
            style={{
              ...textStack,
              alignItems: 'end',
              textAlign: 'right',
              paddingInline: spacing('xs'),
              paddingBlock: spacing('2xs'),
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
            <ContentCircle src={logoSrc} role="program-logo" alt="" />
          </RoundButtonShell>
        </Stack>

        <button
          type="button"
          aria-label="Interactive content"
          onClick={onBugClick}
          style={{
            width: size('channel-bug'),
            height: size('channel-bug'),
            padding: 0,
            border: 'none',
            borderRadius: PILL,
            background: 'none',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            // The logo fills the button, so focus sits outside it instead of as an inset ring.
            ...(bugFocused ? focusOutline : null),
          }}
        >
          <ContentCircle src={bugSrc} role="channel-bug" alt="" />
        </button>
      </Stack>
    </Stack>
  )
}
