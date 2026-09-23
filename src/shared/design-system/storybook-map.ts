/**
 * Where each built-in catalog component lives in Storybook — the join the catalog
 * parity tests (`catalog-storybook-parity.test.ts`) read to diff `catalog.ts`
 * against the committed Storybook snapshot (tests/storybook/manifest.snapshot.json).
 *
 * Every catalog id must appear here, so a new catalog component cannot skip the
 * parity gate: it either names its story component, or says in words why it has
 * none.
 *
 * - `story` — the component a Storybook title documents (`component` is the
 *   snapshot id; `subcomponent` picks one declared in that story's meta).
 *   `codeOnly` lists every prop the code has and the catalog deliberately leaves
 *   out, with why; anything else Storybook shows must be in the catalog.
 *   `valueMap` lists catalog values that stand for a different code value.
 * - `docgen-unreadable` — it has a story, but react-docgen cannot read its props.
 *   The parity test checks the snapshot really is empty, so the entry has to be
 *   upgraded the day docgen can read it.
 * - `registry-only` — rendered by a hand-written renderer in registry.tsx and
 *   documented by no story.
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

export type StorybookBinding =
  | {
      kind: 'story'
      component: string
      subcomponent?: string
      codeOnly?: Record<string, CodeOnlyReason>
      valueMap?: Record<string, Record<string, 'null'>>
    }
  | { kind: 'docgen-unreadable'; component: string; reason: string }
  | { kind: 'registry-only'; reason: string }

const REGISTRY_ONLY =
  'Hand-written Tailwind renderer in registry.tsx; no story documents it (src/primitives has its own, different component).'

export const STORYBOOK_MAP: Record<string, StorybookBinding> = {
  Stack: { kind: 'registry-only', reason: REGISTRY_ONLY },
  Text: { kind: 'registry-only', reason: REGISTRY_ONLY },
  Button: { kind: 'registry-only', reason: REGISTRY_ONLY },
  Input: { kind: 'registry-only', reason: `${REGISTRY_ONLY} The DTV kit has no input component.` },

  MainMenu: {
    kind: 'story',
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
    kind: 'story',
    component: 'ui-kit-interactivity-menu',
    codeOnly: { items: 'composition', activeIndex: 'composition', children: 'composition' },
  },
  InteractivityCard: {
    kind: 'story',
    component: 'ui-kit-button',
    codeOnly: { state: 'deprecated-alias', thumbnail: 'asset-slot', advertising: 'not-in-catalog-yet' },
  },
  LabelVideo: { kind: 'story', component: 'ui-kit-label-video', codeOnly: { focus: 'deprecated-alias' } },
  WideButton: { kind: 'story', component: 'ui-kit-wide-button', codeOnly: { status: 'deprecated-alias' } },
  Notification: { kind: 'story', component: 'ui-kit-notification', codeOnly: { logoSrc: 'asset-slot' } },
  AlertBug: { kind: 'story', component: 'ui-kit-alert-bug', codeOnly: { src: 'asset-slot' } },
  RoundedButton: { kind: 'story', component: 'ui-kit-rounded-button', codeOnly: { focus: 'deprecated-alias' } },
  CloseButton: { kind: 'story', component: 'ui-kit-close-button' },

  ContentCard: { kind: 'story', component: 'ui-kit-content-card', codeOnly: { children: 'composition' } },
  ContentCardHeader: {
    kind: 'story',
    component: 'ui-kit-content-card',
    subcomponent: 'ContentCardHeader',
    codeOnly: {
      icon: 'asset-slot',
      ad: 'not-in-catalog-yet',
      match: 'not-in-catalog-yet',
      partner: 'not-in-catalog-yet',
      stats: 'not-in-catalog-yet',
    },
  },
  ContentCardBody: {
    kind: 'story',
    component: 'ui-kit-content-card',
    subcomponent: 'ContentCardBody',
    codeOnly: { children: 'composition' },
  },
  ContentCardFooter: {
    kind: 'story',
    component: 'ui-kit-content-card',
    subcomponent: 'ContentCardFooter',
    codeOnly: { children: 'composition' },
  },

  TableCell: {
    kind: 'docgen-unreadable',
    component: 'ui-kit-table-cell',
    reason:
      'Its props are a discriminated union (TeamCellProps | AthleteCellProps | ScoutCellProps); react-docgen documents none of them.',
  },
}

/** Storybook components that document no catalog component, and why. */
export const STORYBOOK_ONLY: Record<string, string> = {
  'templates-screens': 'Reference screens rendered from Blueprint templates, not a component.',
  'ui-kit-overlay': 'The scrim is drawn by the screen model (Camadas), never placed by a Blueprint.',
  'ui-kit-overlay-screen-models': 'The screen model preview; a Blueprint names the model in `screen`, not as a node.',
  'primitives-box': 'Primitive used to build the kit; the catalog exposes Stack instead.',
  'primitives-button': 'Primitive used to build the kit; the catalog Button is the registry renderer.',
  'primitives-heading': 'Primitive used to build the kit.',
  'primitives-stack': 'Primitive used to build the kit; the catalog Stack is the registry renderer.',
  'primitives-text': 'Primitive used to build the kit; the catalog Text is the registry renderer.',
}
