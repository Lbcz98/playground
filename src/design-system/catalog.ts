/**
 * Component catalog — the pure-data half of the design system.
 *
 * Everything here is framework-agnostic (Zod schemas, token enums, metadata) so it
 * can be imported by the renderer, the interpreter AND the Electron main process
 * (which builds the LLM system prompt from it). The React `render` functions live
 * in `registry.tsx`, which composes this catalog with them.
 *
 * The registry is a CLOSED set: adding a component = adding one entry here.
 */

import { z } from 'zod'
import type { AlertBugStyle } from '@/ui-kit/AlertBug'
import type { InteractivityButtonState } from '@/ui-kit/InteractivityButton'
import type { LabelVideoKind } from '@/ui-kit/LabelVideo'
import type { MainMenuItem } from '@/ui-kit/MainMenu'
import type { NotificationKind } from '@/ui-kit/Notification'
import type { RoundButtonState } from '@/ui-kit/RoundButtonShell'
import type { WideButtonStatus } from '@/ui-kit/WideButton'
import {
  BUTTON_VARIANTS,
  CONTROL_SIZES,
  RADIUS_TOKENS,
  SHADOW_TOKENS,
  SPACE_TOKENS,
  STACK_ALIGN,
  STACK_DIRECTIONS,
  STACK_JUSTIFY,
  SURFACE_TOKENS,
  TEXT_TONES,
  TEXT_VARIANTS,
} from './tokens'
import { contentCardSpec, frameSpec, spacingScale } from './primitives'

// ---------------------------------------------------------------------------
// Inspector control metadata (drives the properties panel UI)
// ---------------------------------------------------------------------------

export type Control =
  | { kind: 'text'; label: string }
  | { kind: 'textarea'; label: string }
  | { kind: 'boolean'; label: string }
  | { kind: 'select'; label: string; options: readonly string[] }
  | { kind: 'number'; label: string; min?: number; max?: number; step?: number }

export type ComponentCategory = 'layout' | 'content' | 'form'

export interface CatalogEntry {
  type: string
  label: string
  category: ComponentCategory
  /** One-line purpose, used in the LLM system prompt. */
  summary: string
  /** Whether this component slot may contain child nodes. */
  acceptsChildren: boolean
  /** The only children it takes, in this order, each at most once — any may be left out. */
  slots?: readonly string[]
  /** The only components it may sit directly inside. */
  parents?: readonly string[]
  schema: z.ZodTypeAny
  defaultProps: Record<string, unknown>
  controls: Record<string, Control>
}

const spaceEnum = z.enum(SPACE_TOKENS)
const radiusEnum = z.enum(RADIUS_TOKENS)
const shadowEnum = z.enum(SHADOW_TOKENS)

// ===========================================================================
// Schemas — `.strict()` so any unknown prop is rejected, every value a token.
// ===========================================================================

export const stackSchema = z
  .object({
    direction: z.enum(STACK_DIRECTIONS).default('vertical'),
    gap: spaceEnum.default('sm'),
    padding: spaceEnum.default('none'),
    align: z.enum(STACK_ALIGN).default('stretch'),
    justify: z.enum(STACK_JUSTIFY).default('start'),
    surface: z.enum(SURFACE_TOKENS).default('none'),
    radius: radiusEnum.default('none'),
    shadow: shadowEnum.default('none'),
    bordered: z.boolean().default(false),
    grow: z.boolean().default(false),
  })
  .strict()
export type StackProps = z.infer<typeof stackSchema>

export const textSchema = z
  .object({
    content: z.string().default('Text'),
    variant: z.enum(TEXT_VARIANTS).default('body'),
    tone: z.enum(TEXT_TONES).default('default'),
    align: z.enum(['start', 'center', 'end']).default('start'),
  })
  .strict()
export type TextProps = z.infer<typeof textSchema>

export const buttonSchema = z
  .object({
    label: z.string().default('Button'),
    variant: z.enum(BUTTON_VARIANTS).default('primary'),
    size: z.enum(CONTROL_SIZES).default('md'),
    fullWidth: z.boolean().default(false),
    disabled: z.boolean().default(false),
  })
  .strict()
export type ButtonProps = z.infer<typeof buttonSchema>

// ===========================================================================
// DTV UI Kit — the parts a real screen is made of (`src/ui-kit`)
// ===========================================================================

/**
 * The option lists mirror each component's own union, `satisfies` proving it at
 * compile time. The imports are type-only, so this file stays runtime-free for
 * the Electron main process.
 */
export const CARD_STATES = ['default', 'focus', 'selected'] as const satisfies readonly InteractivityButtonState[]
export const CONTROL_STATES = ['default', 'focus'] as const satisfies readonly RoundButtonState[]
export const WIDE_BUTTON_STATES = [
  'default',
  'focus',
  'loading',
  'disabled',
] as const satisfies readonly WideButtonStatus[]
export const LABEL_VIDEO_KINDS = ['live', 'replay'] as const satisfies readonly LabelVideoKind[]
/** `none` is focus elsewhere on the screen — the component's `null`. */
export const MAIN_MENU_ITEMS = [
  'program',
  'profile',
  'schedule',
  'weather',
  'channel-bug',
  'none',
] as const satisfies readonly (MainMenuItem | 'none')[]

export const mainMenuSchema = z
  .object({
    focusedItem: z.enum(MAIN_MENU_ITEMS).default('program'),
    programTitle: z.string().default(''),
    programSubtitle: z.string().default(''),
    weatherTitle: z.string().default(''),
    weatherSubtitle: z.string().default(''),
  })
  .strict()
export type MainMenuNodeProps = z.infer<typeof mainMenuSchema>

export const RAIL_ALIGN = ['start', 'end'] as const

export const interactivityMenuSchema = z
  .object({
    heading: z.string().default(''),
    align: z.enum(RAIL_ALIGN).default('start'),
  })
  .strict()
export type InteractivityMenuNodeProps = z.infer<typeof interactivityMenuSchema>

export const interactivityCardSchema = z
  .object({
    title: z.string().default(''),
    overline: z.string().default(''),
    subtitle: z.string().default(''),
    live: z.boolean().default(false),
    check: z.boolean().default(false),
    interactionState: z.enum(CARD_STATES).default('default'),
    /** A sponsored card: the sponsor row's wording, e.g. "Publicidade". Empty: no row. */
    advertisingLabel: z.string().default(''),
  })
  .strict()
export type InteractivityButtonProps = z.infer<typeof interactivityCardSchema>

export const labelVideoSchema = z
  .object({
    kind: z.enum(LABEL_VIDEO_KINDS).default('live'),
    interactionState: z.enum(CONTROL_STATES).default('default'),
    mini: z.boolean().default(false),
  })
  .strict()
export type LabelVideoNodeProps = z.infer<typeof labelVideoSchema>

export const wideButtonSchema = z
  .object({
    label: z.string().default(''),
    interactionState: z.enum(WIDE_BUTTON_STATES).default('default'),
    iconLeft: z.boolean().default(false),
    iconRight: z.boolean().default(false),
  })
  .strict()
export type WideButtonNodeProps = z.infer<typeof wideButtonSchema>

export const roundedButtonSchema = z
  .object({
    label: z.string().default('Voltar'),
    interactionState: z.enum(CONTROL_STATES).default('default'),
  })
  .strict()
export type RoundedButtonNodeProps = z.infer<typeof roundedButtonSchema>

export const closeButtonSchema = z
  .object({
    label: z.string().default('Fechar'),
    interactionState: z.enum(CONTROL_STATES).default('default'),
  })
  .strict()
export type CloseButtonNodeProps = z.infer<typeof closeButtonSchema>

const CARD_HEIGHT_MIN = 2 * parseFloat(spacingScale[contentCardSpec.inset])

export const contentCardSchema = z
  .object({
    interactionState: z.enum(CONTROL_STATES).default('default'),
    height: z
      .number()
      .min(CARD_HEIGHT_MIN)
      .max(contentCardSpec.maxHeight)
      .multipleOf(frameSpec.grid)
      .default(contentCardSpec.height),
  })
  .strict()
export type ContentCardNodeProps = z.infer<typeof contentCardSchema>

export const contentCardHeaderSchema = z
  .object({
    overline: z.string().default(''),
    /** Empty: not drawn — a header may be only a match, a partner or an ad tag. */
    title: z.string().default(''),
    subtitle: z.string().default(''),
    /** A match: the two sides' short names, facing each other. Drawn only when both are set. */
    homeTeam: z.string().default(''),
    awayTeam: z.string().default(''),
    /** Column headings beside the subtitle, over a table's team columns. Empty ones are not drawn. */
    stat1: z.string().default(''),
    stat2: z.string().default(''),
    stat3: z.string().default(''),
    /** Who presents the card, above the title; `partnerVerified` adds the verified tick. */
    partnerName: z.string().default(''),
    partnerVerified: z.boolean().default(false),
    /** An advertising tag under the header, over a rule. */
    adLabel: z.string().default(''),
  })
  .strict()
export type ContentCardHeaderNodeProps = z.infer<typeof contentCardHeaderSchema>

export const contentCardBodySchema = z
  .object({
    quote: z.string().default(''),
  })
  .strict()
export type ContentCardBodyNodeProps = z.infer<typeof contentCardBodySchema>

export const contentCardFooterSchema = z
  .object({
    caption: z.string().default(''),
  })
  .strict()
export type ContentCardFooterNodeProps = z.infer<typeof contentCardFooterSchema>

const CONTENT_CARD_ZONES = ['ContentCardHeader', 'ContentCardBody', 'ContentCardFooter'] as const

export const TABLE_CELL_TYPES = ['team', 'athlete', 'scout'] as const

/**
 * One row of a Content Card's table. The row type decides which props are drawn;
 * the rest are ignored, so a row is described by filling in only what it shows.
 * The crest is a slot in code and has no canvas counterpart, so a row built here
 * names its team rather than badging it.
 */
export const tableCellSchema = z
  .object({
    cellType: z.enum(TABLE_CELL_TYPES).default('team'),
    /** Team short name, athlete name, or the stat a scout row compares. */
    label: z.string().default('SAO'),
    /** Standing position on a team row, shirt number on an athlete row. */
    lead: z.string().default(''),
    /** Team row columns, left to right. Empty ones are not drawn. */
    stat1: z.string().default(''),
    stat2: z.string().default(''),
    stat3: z.string().default(''),
    /** Scout row: the two sides' values. */
    leftValue: z.string().default(''),
    rightValue: z.string().default(''),
    /** Athlete row marks. */
    yellowCard: z.boolean().default(false),
    redCard: z.boolean().default(false),
    goals: z.number().int().min(0).max(9).default(0),
    substitute: z.string().default(''),
    /** Team row: marks the viewer's own team. */
    favorite: z.boolean().default(false),
    /** The rule under the row — a table draws it under a heading, not every row. */
    divider: z.boolean().default(false),
  })
  .strict()
export type TableCellNodeProps = z.infer<typeof tableCellSchema>

export const NOTIFICATION_KINDS = ['message', 'rounded'] as const satisfies readonly NotificationKind[]

export const notificationSchema = z
  .object({
    kind: z.enum(NOTIFICATION_KINDS).default('message'),
    title: z.string().default(''),
    interactionState: z.enum(CONTROL_STATES).default('default'),
  })
  .strict()
export type NotificationNodeProps = z.infer<typeof notificationSchema>

export const ALERT_BUG_STYLES = ['interface', 'transmission'] as const satisfies readonly AlertBugStyle[]

export const alertBugSchema = z
  .object({
    bugStyle: z.enum(ALERT_BUG_STYLES).default('interface'),
    label: z.string().default('Conteúdo interativo'),
    interactionState: z.enum(CONTROL_STATES).default('default'),
  })
  .strict()
export type AlertBugNodeProps = z.infer<typeof alertBugSchema>

// ===========================================================================
// Catalog
// ===========================================================================

export const Catalog = {
  Stack: {
    type: 'Stack',
    label: 'Stack',
    category: 'layout',
    summary:
      'The only layout primitive. A flexbox row or column with token-based gap and padding. Nest Stacks to build any layout — there is no absolute positioning.',
    acceptsChildren: true,
    schema: stackSchema,
    defaultProps: stackSchema.parse({}),
    controls: {
      direction: { kind: 'select', label: 'Direction', options: STACK_DIRECTIONS },
      gap: { kind: 'select', label: 'Gap', options: SPACE_TOKENS },
      padding: { kind: 'select', label: 'Padding', options: SPACE_TOKENS },
      align: { kind: 'select', label: 'Align', options: STACK_ALIGN },
      justify: { kind: 'select', label: 'Justify', options: STACK_JUSTIFY },
      surface: { kind: 'select', label: 'Surface', options: SURFACE_TOKENS },
      radius: { kind: 'select', label: 'Radius', options: RADIUS_TOKENS },
      shadow: { kind: 'select', label: 'Shadow', options: SHADOW_TOKENS },
      bordered: { kind: 'boolean', label: 'Border' },
      grow: { kind: 'boolean', label: 'Fill available space' },
    },
  },
  Text: {
    type: 'Text',
    label: 'Text',
    category: 'content',
    summary: 'A single run of text. Pick a variant for size/weight; the element (h1–h3/p/span) follows.',
    acceptsChildren: false,
    schema: textSchema,
    defaultProps: textSchema.parse({}),
    controls: {
      content: { kind: 'textarea', label: 'Content' },
      variant: { kind: 'select', label: 'Variant', options: TEXT_VARIANTS },
      tone: { kind: 'select', label: 'Tone', options: TEXT_TONES },
      align: { kind: 'select', label: 'Align', options: ['start', 'center', 'end'] },
    },
  },
  Button: {
    type: 'Button',
    label: 'Button',
    category: 'form',
    summary: 'A call-to-action button. Text-only label, no children.',
    acceptsChildren: false,
    schema: buttonSchema,
    defaultProps: buttonSchema.parse({}),
    controls: {
      label: { kind: 'text', label: 'Label' },
      variant: { kind: 'select', label: 'Variant', options: BUTTON_VARIANTS },
      size: { kind: 'select', label: 'Size', options: CONTROL_SIZES },
      fullWidth: { kind: 'boolean', label: 'Full width' },
      disabled: { kind: 'boolean', label: 'Disabled' },
    },
  },
  // --- DTV UI Kit ---------------------------------------------------------

  MainMenu: {
    type: 'MainMenu',
    label: 'Main Menu',
    category: 'layout',
    summary:
      'The home menu pinned along the bottom edge: profile, schedule and weather on the left, the live program and the channel bug on the right. One screen has at most one, and it belongs in the anchored cluster.',
    acceptsChildren: false,
    schema: mainMenuSchema,
    defaultProps: mainMenuSchema.parse({}),
    controls: {
      focusedItem: { kind: 'select', label: 'Focused item', options: MAIN_MENU_ITEMS },
      programTitle: { kind: 'text', label: 'Program title' },
      programSubtitle: { kind: 'text', label: 'Program subtitle' },
      weatherTitle: { kind: 'text', label: 'Weather title' },
      weatherSubtitle: { kind: 'text', label: 'Weather subtitle' },
    },
  },
  InteractivityMenu: {
    type: 'InteractivityMenu',
    label: 'Interactivity Menu',
    category: 'layout',
    summary:
      'A horizontal rail of interactivity cards. On the home screen it carries no heading and sits on the right; once the viewer enters it the whole row expands, the entered card taking the focus and the rest going selected.',
    acceptsChildren: true,
    schema: interactivityMenuSchema,
    defaultProps: interactivityMenuSchema.parse({}),
    controls: {
      heading: { kind: 'text', label: 'Heading' },
      align: { kind: 'select', label: 'Align', options: RAIL_ALIGN },
    },
  },
  InteractivityButton: {
    type: 'InteractivityButton',
    label: 'Interactivity Button',
    category: 'content',
    summary:
      'One card in a rail. As an interactivity it is the way into a nível 3 screen and carries its title alone — no overline, no subtitle, no live badge. Overline, subtitle and the live badge belong to the schedule section, where a card stands for a programme. A sponsored card sets advertisingLabel (e.g. "Publicidade"), which adds the sponsor row under its text.',
    acceptsChildren: false,
    schema: interactivityCardSchema,
    defaultProps: interactivityCardSchema.parse({}),
    controls: {
      title: { kind: 'text', label: 'Title' },
      overline: { kind: 'text', label: 'Overline' },
      subtitle: { kind: 'text', label: 'Subtitle' },
      live: { kind: 'boolean', label: 'Live badge' },
      check: { kind: 'boolean', label: 'Check mark' },
      interactionState: { kind: 'select', label: 'State', options: CARD_STATES },
      advertisingLabel: { kind: 'text', label: 'Sponsor row' },
    },
  },
  LabelVideo: {
    type: 'LabelVideo',
    label: 'Label Video',
    category: 'content',
    summary: 'The AO VIVO / REPLAY chip that says what the video behind the screen is.',
    acceptsChildren: false,
    schema: labelVideoSchema,
    defaultProps: labelVideoSchema.parse({}),
    controls: {
      kind: { kind: 'select', label: 'Kind', options: LABEL_VIDEO_KINDS },
      interactionState: { kind: 'select', label: 'State', options: CONTROL_STATES },
      mini: { kind: 'boolean', label: 'Mini' },
    },
  },
  WideButton: {
    type: 'WideButton',
    label: 'Wide Button',
    category: 'form',
    summary: 'The pill call-to-action of a screen — "Assistir", "Entrar na sala". Text with optional icons.',
    acceptsChildren: false,
    schema: wideButtonSchema,
    defaultProps: wideButtonSchema.parse({}),
    controls: {
      label: { kind: 'text', label: 'Label' },
      interactionState: { kind: 'select', label: 'State', options: WIDE_BUTTON_STATES },
      iconLeft: { kind: 'boolean', label: 'Icon left' },
      iconRight: { kind: 'boolean', label: 'Icon right' },
    },
  },
  Notification: {
    type: 'Notification',
    label: 'Notification',
    category: 'content',
    summary:
      'The message that arrives in the top-right corner, over whatever is on screen: the programme logo and a line saying why it came. `rounded` withholds the text and shows the logo alone. It carries no scrim of its own — a screen showing one uses a layer model whose shades include the top-right corner.',
    acceptsChildren: false,
    schema: notificationSchema,
    defaultProps: notificationSchema.parse({}),
    controls: {
      kind: { kind: 'select', label: 'Kind', options: NOTIFICATION_KINDS },
      title: { kind: 'textarea', label: 'Title' },
      interactionState: { kind: 'select', label: 'State', options: CONTROL_STATES },
    },
  },
  AlertBug: {
    type: 'AlertBug',
    label: 'Alert Bug',
    category: 'content',
    summary:
      'The bug in the bottom-right corner that says an interactivity is waiting. It is the whole of a nível 0 screen, over the clean broadcast. `interface` is the kit\u2019s own bug and can hold the focus; `transmission` is the broadcaster\u2019s larger mark and never does.',
    acceptsChildren: false,
    schema: alertBugSchema,
    defaultProps: alertBugSchema.parse({}),
    controls: {
      bugStyle: { kind: 'select', label: 'Style', options: ALERT_BUG_STYLES },
      label: { kind: 'text', label: 'Label' },
      interactionState: { kind: 'select', label: 'State', options: CONTROL_STATES },
    },
  },
  RoundedButton: {
    type: 'RoundedButton',
    label: 'Rounded Button',
    category: 'form',
    summary: 'The icon-only round control that steps back a level. To dismiss an interactivity, use Close Button.',
    acceptsChildren: false,
    schema: roundedButtonSchema,
    defaultProps: roundedButtonSchema.parse({}),
    controls: {
      label: { kind: 'text', label: 'Label' },
      interactionState: { kind: 'select', label: 'State', options: CONTROL_STATES },
    },
  },
  CloseButton: {
    type: 'CloseButton',
    label: 'Close Button',
    category: 'form',
    summary: 'The icon-only round control that closes an interactivity, anchored in the focused corner.',
    acceptsChildren: false,
    schema: closeButtonSchema,
    defaultProps: closeButtonSchema.parse({}),
    controls: {
      label: { kind: 'text', label: 'Label' },
      interactionState: { kind: 'select', label: 'State', options: CONTROL_STATES },
    },
  },
  ContentCard: {
    type: 'ContentCard',
    label: 'Content Card',
    category: 'content',
    summary:
      'The tall 288-wide card for a vertical highlight (statistics, a line-up). Holds up to three zones — Header, Body, Footer — in that order; leave out any you do not need.',
    acceptsChildren: true,
    slots: CONTENT_CARD_ZONES,
    schema: contentCardSchema,
    defaultProps: contentCardSchema.parse({}),
    controls: {
      interactionState: { kind: 'select', label: 'State', options: CONTROL_STATES },
      height: {
        kind: 'number',
        label: 'Height',
        min: CARD_HEIGHT_MIN,
        max: contentCardSpec.maxHeight,
        step: frameSpec.grid,
      },
    },
  },
  ContentCardHeader: {
    type: 'ContentCardHeader',
    label: 'Content Card Header',
    category: 'content',
    summary:
      "A Content Card's top zone; everything is optional and collapses when empty. Plain: overline, title, subtitle. A match: homeTeam and awayTeam face each other above the title (set title to \"\" to show the match alone). A table heading: subtitle with stat1–stat3 as the column headings over the Table Cell team rows' stat1–stat3. A partner: partnerName above the title, partnerVerified adds the verified tick. An ad: adLabel, a tag under the header over a rule. Only goes inside a Content Card.",
    acceptsChildren: false,
    parents: ['ContentCard'],
    schema: contentCardHeaderSchema,
    defaultProps: contentCardHeaderSchema.parse({}),
    controls: {
      overline: { kind: 'text', label: 'Overline' },
      title: { kind: 'text', label: 'Title' },
      subtitle: { kind: 'text', label: 'Subtitle' },
      homeTeam: { kind: 'text', label: 'Home team' },
      awayTeam: { kind: 'text', label: 'Away team' },
      stat1: { kind: 'text', label: 'Column 1 heading' },
      stat2: { kind: 'text', label: 'Column 2 heading' },
      stat3: { kind: 'text', label: 'Column 3 heading' },
      partnerName: { kind: 'text', label: 'Partner' },
      partnerVerified: { kind: 'boolean', label: 'Partner verified' },
      adLabel: { kind: 'text', label: 'Ad tag' },
    },
  },
  ContentCardBody: {
    type: 'ContentCardBody',
    label: 'Content Card Body',
    category: 'content',
    summary:
      "A Content Card's main zone; it takes the height the others leave. Holds the card's content, and an optional quote under it. Only goes inside a Content Card.",
    acceptsChildren: true,
    parents: ['ContentCard'],
    schema: contentCardBodySchema,
    defaultProps: contentCardBodySchema.parse({}),
    controls: {
      quote: { kind: 'textarea', label: 'Quote' },
    },
  },
  ContentCardFooter: {
    type: 'ContentCardFooter',
    label: 'Content Card Footer',
    category: 'content',
    summary:
      "A Content Card's bottom zone, pinned to the bottom edge: a caption, and any controls it holds. Only goes inside a Content Card.",
    acceptsChildren: true,
    parents: ['ContentCard'],
    schema: contentCardFooterSchema,
    defaultProps: contentCardFooterSchema.parse({}),
    controls: {
      caption: { kind: 'text', label: 'Caption' },
    },
  },
  TableCell: {
    type: 'TableCell',
    label: 'Table Cell',
    category: 'content',
    summary:
      "One row of a table inside a Content Card's body: a team and its columns, an athlete and their marks, or a scout row naming a stat between the two sides' values. Stack them to build the table. Only goes inside a Content Card Body.",
    acceptsChildren: false,
    parents: ['ContentCardBody'],
    schema: tableCellSchema,
    defaultProps: tableCellSchema.parse({}),
    controls: {
      cellType: { kind: 'select', label: 'Row', options: TABLE_CELL_TYPES },
      label: { kind: 'text', label: 'Name' },
      lead: { kind: 'text', label: 'Position / number' },
      stat1: { kind: 'text', label: 'Stat 1' },
      stat2: { kind: 'text', label: 'Stat 2' },
      stat3: { kind: 'text', label: 'Stat 3' },
      leftValue: { kind: 'text', label: 'Left value' },
      rightValue: { kind: 'text', label: 'Right value' },
      yellowCard: { kind: 'boolean', label: 'Yellow card' },
      redCard: { kind: 'boolean', label: 'Red card' },
      goals: { kind: 'number', label: 'Goals', min: 0, max: 9, step: 1 },
      substitute: { kind: 'text', label: 'Substitute' },
      favorite: { kind: 'boolean', label: 'Favourite' },
      divider: { kind: 'boolean', label: 'Divider' },
    },
  },
} as const satisfies Record<string, CatalogEntry>

export type CatalogType = keyof typeof Catalog

export const CATALOG_TYPES = Object.keys(Catalog) as CatalogType[]

export function isCatalogType(type: string): type is CatalogType {
  return Object.prototype.hasOwnProperty.call(Catalog, type)
}

export function getCatalogEntry(type: string): CatalogEntry | null {
  return isCatalogType(type) ? Catalog[type] : null
}
