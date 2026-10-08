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

import { type ReactNode, useState } from 'react'
import { size, Stack, Text, vars, type SizeRole } from '@/primitives'
import scheduleIcon from './icons/schedule.svg'
import miscellaneousFocusIcon from './icons/miscellaneous-focus.svg'
import weatherIcon from './icons/weather.svg'
import { RoundButtonShell, type RoundButtonState } from './RoundButtonShell'
import './ui-kit.css'

export type MainMenuItem = 'login' | 'schedule' | 'miscellaneous' | 'program' | 'channel-bug'

/** One of the things the miscellaneous button cycles through. */
export type MiscellaneousItem = NonNullable<MainMenuProps['miscellaneousItems']>[number]

export interface MainMenuProps {
  /**
   * The one focused button. Default `program` — when Home opens, the focus is on
   * the program button (Figma: Main Menu › Focus). On Home it is the button whose
   * rail is on screen: `program` for the rail on the right; `miscellaneous`,
   * `schedule` or `login` for a rail on the left. `channel-bug` is the channel
   * logo; `null` when the focus is elsewhere on the screen.
   */
  focusedItem?: MainMenuItem | null

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
  // Written out (not a named interface) so react-docgen expands the fields for the importer.
  miscellaneousItems?: { title: string; subtitle?: string; iconSrc?: string }[]
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

/** Content, not chrome: the image given, or a neutral circle when there is none. */
function ContentCircle({ src, role, alt }: { src?: string; role: SizeRole; alt: string }): ReactNode {
  const edge = vars({ '--_size': size(role) })
  if (src) return <img src={src} alt={alt} className="sfs-main-menu-circle" style={edge} />
  return <span className="sfs-main-menu-circle" data-empty="" style={edge} />
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
  const layer = 'sfs-main-menu-cycle-layer'
  return (
    <span className="sfs-main-menu-cycle" data-fade={fade ? '' : undefined}>
      {moving ? (
        <span
          key={`out-${step.previous}`}
          className={`${layer} ${fade ? 'sfs-carousel-fade-out' : 'sfs-carousel-out'}`}
          onAnimationEnd={onDone}
        >
          {render(items[step.previous as number])}
        </span>
      ) : null}
      <span key={`in-${step.index}`} className={moving ? `${layer} ${fade ? 'sfs-carousel-fade-in' : 'sfs-carousel-in'}` : layer}>
        {render(items[step.index])}
      </span>
    </span>
  )
}

/** The home menu along the bottom edge: login, schedule and miscellaneous, then the live program and the channel bug. */
export function MainMenu({
  focusedItem,
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
  const focused = focusedItem !== undefined ? focusedItem : 'program'
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
          <img src={scheduleIcon} alt="" className="sfs-main-menu-icon" />
        </RoundButtonShell>

        <Stack direction="row" align="center">
          <RoundButtonShell interactionState={stateOf('miscellaneous')} focusItem="miscellaneous" label="Miscellaneous" onClick={onMiscellaneousClick}>
            {/* At rest it shows its current item (the weather); focused, the dots of
                "more" — the button holds various interactivities (Figma: Personalização). */}
            {focused === 'miscellaneous' ? (
              <img src={miscellaneousFocusIcon} alt="" className="sfs-main-menu-icon" />
            ) : (
              <CycleLayers
                step={cycle}
                items={items}
                onDone={settle}
                render={(item) => <img src={item.iconSrc ?? weatherIcon} alt="" className="sfs-main-menu-item-icon" />}
              />
            )}
          </RoundButtonShell>
          <div className="sfs-main-menu-text">
            <CycleLayers
              step={cycle}
              items={items}
              fade
              onDone={settle}
              render={(item) => (
                <span className="sfs-main-menu-lines">
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
              <span aria-hidden className="sfs-carousel-tick" onAnimationIteration={next} />
            ) : null}
          </div>
        </Stack>
      </Stack>

      <Stack direction="row" align="center" gap="3xs">
        <Stack direction="row" align="center">
          <div className="sfs-main-menu-program">
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
          className="sfs-main-menu-bug sfs-motion sfs-focusable"
          aria-label="Interactive content"
          data-focus-item="channel-bug"
          data-focused={focused === 'channel-bug' ? '' : undefined}
          onClick={onBugClick}
        >
          <ContentCircle src={bugSrc} role="channel-bug" alt="" />
        </button>
      </Stack>
    </Stack>
  )
}
