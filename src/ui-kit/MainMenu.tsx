/**
 * Main Menu — Figma UI Kit, page "Menus e navegação", component set 3270:8678
 * (Focus × Motion; Motion=Off is the collapsed menu).
 *
 * Each button owns a rail of interactivity buttons (the menu roles, declared in
 * the layer rule — `screenLayers.menu`):
 *   - Program — rail on the right: the programme's context. Home opens here.
 *   - Miscellaneous — rail on the left: various types of interactivities.
 *   - Schedule — rail on the left: one card per programme — time, live or not, name.
 *   - Login — rail on the left: account settings.
 * On Home the focused button is the one whose rail is on screen.
 *
 * A left cluster (login, schedule, miscellaneous) and a right cluster (the
 * live program's EPG text + logo, then a channel bug), pinned to opposite
 * edges. Figma absolute-positions "Options" and "Live" within a full-width
 * frame; this uses `justify-content: space-between` instead, matching the
 * Button/WideButton convention of flow layout over percentage insets.
 *
 * Every round control here (login, schedule, miscellaneous, program) is the same
 * `RoundButtonShell` RoundedButton already uses — this component carries no
 * new circular-button styling of its own.
 *
 * A TV screen has exactly one focused item, so focus is a single `focusedItem`
 * — like InteractivityMenu's `activeIndex` — rather than a flag per control.
 *
 * Avatar/program-logo/channel-bug are real, per-viewer/per-broadcast content,
 * not kit chrome — they're plain `src` props with no bundled default image; a
 * neutral token-coloured circle fills in when none is given.
 */

import { type CSSProperties, type ReactNode, useState } from 'react'
import { focusOutline, size, spacing, Stack, Text, token, warnDeprecated, type SizeRole } from '@/primitives'
import scheduleIcon from './icons/schedule.svg'
import miscellaneousFocusIcon from './icons/miscellaneous-focus.svg'
import weatherIcon from './icons/weather.svg'
import { RoundButtonShell, type RoundButtonState } from './RoundButtonShell'

export type MainMenuItem = 'login' | 'schedule' | 'miscellaneous' | 'program' | 'channel-bug'

/** One of the things the miscellaneous button cycles through. */
export interface MiscellaneousItem {
  title: string
  subtitle?: string
  /** Its icon — content, not a kit asset. Default: the weather glyph. */
  iconSrc?: string
}

export interface MainMenuProps {
  /**
   * The one focused button. Default `program` — when Home opens, the focus is on
   * the program button (Figma: Main Menu › Focus). On Home it is the button whose
   * rail is on screen: `program` for the rail on the right; `miscellaneous`,
   * `schedule` or `login` for a rail on the left. `channel-bug` is the channel
   * logo; `null` when the focus is elsewhere on the screen.
   */
  focusedItem?: MainMenuItem | null
  /**
   * @deprecated Use `focusedItem="channel-bug"`. Like that, it moves focus off the
   * program logo — a TV screen has one focused item.
   */
  bugFocused?: boolean

  /** The viewer's avatar, on the Login button. */
  avatarSrc?: string
  /** Login — opens its rail on the left: account settings. */
  onLoginClick?: () => void

  /** Schedule — opens its rail on the left: one card per programme, with its time, whether it is live, and its name. */
  onScheduleClick?: () => void

  /** The miscellaneous button’s first line (its current item, e.g. the weather). */
  miscellaneousTitle?: string
  /** The miscellaneous button’s second line. */
  miscellaneousSubtitle?: string
  /**
   * What the miscellaneous button holds, when it holds several: at rest it cycles
   * through them — one every `motion.semantic.carousel-step` — the icon shrinking
   * out and the next one growing in, the lines dissolving, all on the system
   * spring (Figma: Dinamic Carousel). Replaces miscellaneousTitle/Subtitle. An
   * item's icon is content (a crest, a programme logo), so it is a `src`; without
   * one the weather glyph stands in.
   */
  miscellaneousItems?: MiscellaneousItem[]
  /** Miscellaneous — opens its rail on the left: various types of interactivities. Focused, it shows the dots of "more". */
  onMiscellaneousClick?: () => void

  /** The live program’s name. */
  programTitle?: string
  /** The line under the program’s name, e.g. its time slot. */
  programSubtitle?: string
  /** The programme's logo, on the Program button. */
  logoSrc?: string
  /** Program — opens its rail on the right: the programme's context. Home's focus starts here. */
  onLogoClick?: () => void

  /** The channel logo. */
  bugSrc?: string
  /** The channel logo — not a menu role; it leads back to the clean broadcast. */
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

interface CycleStep {
  index: number
  /** The item leaving, while it animates out; null at rest. */
  previous: number | null
}

/**
 * The current item and, while it leaves, the previous one, stacked in one grid
 * cell: the previous shrinks and fades out (Figma's Motion=2 pose, about a third
 * of its size), the current grows in — or, with `fade`, both only dissolve. The
 * first item renders with no motion at all, which is also what a frozen or
 * reduced-motion screen keeps.
 */
function CycleLayers({
  step,
  items,
  fade,
  render,
  onDone,
}: {
  step: CycleStep
  items: MiscellaneousItem[]
  fade?: boolean
  render: (item: MiscellaneousItem) => ReactNode
  onDone: () => void
}): ReactNode {
  const moving = step.previous !== null
  const layer: CSSProperties = { gridArea: '1 / 1', display: 'grid', placeItems: fade ? 'start' : 'center', minWidth: 0 }
  return (
    <span style={{ display: 'grid', minWidth: 0 }}>
      {moving ? (
        <span
          key={`out-${step.previous}`}
          className={fade ? 'sfs-carousel-fade-out' : 'sfs-carousel-out'}
          onAnimationEnd={onDone}
          style={layer}
        >
          {render(items[step.previous as number])}
        </span>
      ) : null}
      <span key={`in-${step.index}`} className={moving ? (fade ? 'sfs-carousel-fade-in' : 'sfs-carousel-in') : undefined} style={layer}>
        {render(items[step.index])}
      </span>
    </span>
  )
}

/** The home menu along the bottom edge: login, schedule and miscellaneous, then the live program and the channel bug. */
export function MainMenu({
  focusedItem,
  bugFocused,
  avatarSrc,
  onLoginClick,
  onScheduleClick,
  miscellaneousTitle,
  miscellaneousSubtitle,
  miscellaneousItems,
  onMiscellaneousClick,
  programTitle,
  programSubtitle,
  logoSrc,
  onLogoClick,
  bugSrc,
  onBugClick,
}: MainMenuProps): ReactNode {
  if (bugFocused !== undefined) warnDeprecated('ui-kit/MainMenu', 'bugFocused', 'focusedItem')
  const focused = focusedItem !== undefined ? focusedItem : bugFocused ? 'channel-bug' : 'program'
  const stateOf = (item: MainMenuItem): RoundButtonState => (item === focused ? 'focus' : 'default')

  const items: MiscellaneousItem[] = miscellaneousItems?.length
    ? miscellaneousItems
    : [{ title: miscellaneousTitle ?? '', subtitle: miscellaneousSubtitle }]
  const [cycle, setCycle] = useState<CycleStep>({ index: 0, previous: null })
  const next = () => setCycle((c) => ({ index: (c.index + 1) % items.length, previous: c.index }))
  const settle = () => setCycle((c) => ({ ...c, previous: null }))

  return (
    <Stack as="nav" direction="row" align="center" justify="between">
      <Stack direction="row" align="center" gap="3xs">
        <RoundButtonShell interactionState={stateOf('login')} focusItem="login" label="Login" onClick={onLoginClick}>
          <ContentCircle src={avatarSrc} role="avatar" alt="" />
        </RoundButtonShell>

        <RoundButtonShell interactionState={stateOf('schedule')} focusItem="schedule" label="Schedule" onClick={onScheduleClick}>
          <img
            src={scheduleIcon}
            alt=""
            style={{ width: size('icon-xl'), height: size('icon-xl'), display: 'block' }}
          />
        </RoundButtonShell>

        <Stack direction="row" align="center">
          <RoundButtonShell interactionState={stateOf('miscellaneous')} focusItem="miscellaneous" label="Miscellaneous" onClick={onMiscellaneousClick}>
            {/* At rest it shows its current item (the weather); focused, the dots of
                "more" — the button holds various interactivities (Figma: Personalização). */}
            {focused === 'miscellaneous' ? (
              <img
                src={miscellaneousFocusIcon}
                alt=""
                style={{ width: size('icon-xl'), height: size('icon-xl'), display: 'block' }}
              />
            ) : (
              <CycleLayers
                step={cycle}
                items={items}
                onDone={settle}
                render={(item) => (
                  <img
                    src={item.iconSrc ?? weatherIcon}
                    alt=""
                    style={{ width: size('icon-2xl'), height: size('icon-2xl'), display: 'block' }}
                  />
                )}
              />
            )}
          </RoundButtonShell>
          <div style={{ ...textStack, paddingInlineStart: spacing('3xs') }}>
            <CycleLayers
              step={cycle}
              items={items}
              fade
              onDone={settle}
              render={(item) => (
                <span style={textStack}>
                  <Text variant="body-lg-bold" opacity="title" truncate>
                    {item.title}
                  </Text>
                  <Text variant="body-md-medium" color="subtle">
                    {item.subtitle}
                  </Text>
                </span>
              )}
            />
            {items.length > 1 ? (
              <span aria-hidden className="sfs-carousel-tick" onAnimationIteration={next} style={{ position: 'absolute' }} />
            ) : null}
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
            <Text variant="body-md-medium" color="subtle">
              {programSubtitle}
            </Text>
          </div>
          <RoundButtonShell interactionState={stateOf('program')} focusItem="program" label="Now playing" onClick={onLogoClick}>
            <ContentCircle src={logoSrc} role="program-logo" alt="" />
          </RoundButtonShell>
        </Stack>

        <button
          type="button"
          className="sfs-motion"
          aria-label="Interactive content"
          data-focus-item="channel-bug"
          data-focused={focused === 'channel-bug' ? '' : undefined}
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
            ...(focused === 'channel-bug' ? focusOutline : null),
          }}
        >
          <ContentCircle src={bugSrc} role="channel-bug" alt="" />
        </button>
      </Stack>
    </Stack>
  )
}
