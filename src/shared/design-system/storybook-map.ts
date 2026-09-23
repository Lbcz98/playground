/**
 * Where each built-in catalog component lives in Storybook — the join the catalog
 * parity tests (`catalog-storybook-parity.test.ts`) read to diff `catalog.ts`
 * against the committed Storybook snapshot (tests/storybook/manifest.snapshot.json).
 *
 * Every catalog id must appear here, so a new catalog component cannot skip the
 * parity gate. Each names the component a Storybook title documents (`component`
 * is the snapshot id; `subcomponent` picks one declared in that story's meta):
 *
 * - `codeOnly` lists every prop the code has and the catalog deliberately leaves
 *   out, with why; anything else Storybook shows must be in the catalog.
 * - `valueMap` lists catalog values that stand for a different code value.
 * - `propMap` names the code props a catalog prop lands in, where the registry
 *   renderer translates rather than hands the props over as they are.
 * - `defaultOverrides` names the props whose catalog default deliberately differs
 *   from the code's, with why; every other default must match.
 */

/** Why a prop exists in code but not in the catalog. */
export type CodeOnlyReason =
  /** A `@deprecated` alias of a catalog prop — old call sites only. */
  | 'deprecated-alias'
  /** An image URL or a node slot — the agent has no assets to pass. */
  | 'asset-slot'
  /** Composition the Blueprint expresses with child nodes, or state the canvas owns. */
  | 'composition'
  /** Content the catalog does not offer the agent yet. */
  | 'not-in-catalog-yet'

export interface StorybookBinding {
  component: string
  subcomponent?: string
  codeOnly?: Record<string, CodeOnlyReason>
  valueMap?: Record<string, Record<string, 'null'>>
  propMap?: Record<string, readonly string[]>
  defaultOverrides?: Record<string, string>
}

/**
 * The kit's controls default to their focused Figma variant; on a screen only
 * one element holds focus, so one placed without a state rests.
 */
const RESTS = 'A screen focuses one element, so a control placed without a state rests.'

export const STORYBOOK_MAP: Record<string, StorybookBinding> = {
  Stack: { component: 'canvas-kit-stack', codeOnly: { children: 'composition' } },
  Text: { component: 'canvas-kit-text' },
  Button: { component: 'canvas-kit-button' },

  MainMenu: {
    component: 'ui-kit-main-menu',
    codeOnly: {
      avatarSrc: 'asset-slot',
      logoSrc: 'asset-slot',
      bugSrc: 'asset-slot',
      bugFocused: 'deprecated-alias',
    },
    // The catalog's "none" is the code's `null`: focus is elsewhere on the screen.
    valueMap: { focusedItem: { none: 'null' } },
  },
  InteractivityMenu: {
    component: 'ui-kit-interactivity-menu',
    codeOnly: { items: 'composition', activeIndex: 'composition', children: 'composition' },
  },
  InteractivityCard: {
    component: 'ui-kit-button',
    codeOnly: { state: 'deprecated-alias', thumbnail: 'asset-slot', advertising: 'not-in-catalog-yet' },
    defaultOverrides: {
      interactionState: RESTS,
      live: 'As an interactivity the card carries its title alone; the live badge belongs to the schedule section.',
      overline: 'As an interactivity the card carries its title alone; the overline belongs to the schedule section.',
      subtitle: 'As an interactivity the card carries its title alone; the subtitle belongs to the schedule section.',
    },
  },
  LabelVideo: {
    component: 'ui-kit-label-video',
    codeOnly: { focus: 'deprecated-alias' },
    defaultOverrides: { interactionState: RESTS },
  },
  WideButton: {
    component: 'ui-kit-wide-button',
    codeOnly: { status: 'deprecated-alias' },
    defaultOverrides: { interactionState: RESTS },
  },
  Notification: { component: 'ui-kit-notification', codeOnly: { logoSrc: 'asset-slot' } },
  AlertBug: { component: 'ui-kit-alert-bug', codeOnly: { src: 'asset-slot' } },
  RoundedButton: {
    component: 'ui-kit-rounded-button',
    codeOnly: { focus: 'deprecated-alias' },
    defaultOverrides: { interactionState: RESTS },
  },
  CloseButton: { component: 'ui-kit-close-button', defaultOverrides: { interactionState: RESTS } },

  ContentCard: { component: 'ui-kit-content-card', codeOnly: { children: 'composition' } },
  ContentCardHeader: {
    component: 'ui-kit-content-card',
    subcomponent: 'ContentCardHeader',
    // The badges and logos inside match / partner / ad are image slots the agent can't fill.
    codeOnly: { icon: 'asset-slot' },
    // The catalog's flat fields; renderContentCardHeader builds the kit's shapes from them.
    propMap: {
      homeTeam: ['match'],
      awayTeam: ['match'],
      stat1: ['stats'],
      stat2: ['stats'],
      stat3: ['stats'],
      partnerName: ['partner'],
      partnerVerified: ['partner'],
      adLabel: ['ad'],
    },
  },
  ContentCardBody: {
    component: 'ui-kit-content-card',
    subcomponent: 'ContentCardBody',
    codeOnly: { children: 'composition' },
  },
  ContentCardFooter: {
    component: 'ui-kit-content-card',
    subcomponent: 'ContentCardFooter',
    codeOnly: { children: 'composition' },
  },

  TableCell: {
    component: 'ui-kit-table-cell',
    codeOnly: { shield: 'asset-slot' },
    // The catalog flattens the three rows into one set of fields; renderTableCell
    // hands each to the prop of the row it belongs to.
    propMap: {
      cellType: ['type'],
      label: ['name', 'label'],
      lead: ['position', 'number'],
      stat1: ['stats'],
      stat2: ['stats'],
      stat3: ['stats'],
      leftValue: ['values'],
      rightValue: ['values'],
    },
  },
}

/** Storybook components that document no catalog component, and why. */
export const STORYBOOK_ONLY: Record<string, string> = {
  'templates-screens': 'Reference screens rendered from Blueprint templates, not a component.',
  'ui-kit-overlay': 'The scrim is drawn by the screen model (Camadas), never placed by a Blueprint.',
  'ui-kit-overlay-screen-models': 'The screen model preview; a Blueprint names the model in `screen`, not as a node.',
  'primitives-box': 'Primitive used to build the kit; the catalog exposes Stack instead.',
  'primitives-button': 'Primitive used to build the kit; the catalog Button is Canvas Kit/Button.',
  'primitives-heading': 'Primitive used to build the kit.',
  'primitives-stack': 'Primitive used to build the kit; the catalog Stack is Canvas Kit/Stack.',
  'primitives-text': 'Primitive used to build the kit; the catalog Text is Canvas Kit/Text.',
}
