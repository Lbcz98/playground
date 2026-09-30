/**
 * The rules book — every rule the validator and the interpreter enforce, with an
 * id and a level (docs/plan-AI-Orchestration.md, "Rules book").
 *
 *   - law:        holds in both modes, never bypassable
 *   - pattern:    may be broken only in Exploratory mode, declared on the node or screen
 *   - convention: breaking it only produces a note
 *
 * Written by hand. Nothing generates or overwrites this file: rules compiled from
 * JSDoc (phase 9B) go into a separate generated file that is merged into this one.
 * Global rules (grid, frame, tokens, layers) have no `appliesTo` and live here for good.
 */

import { frameSpec } from '@/design-system/primitives'
import type { DesignSystemManifest, PatternRule } from './manifest'

const { baseWidth, baseHeight, grid, margin, gutter } = frameSpec

export type { PatternRule, RuleFlexibility } from './manifest'

export const RULES = [
  // ── Laws ──────────────────────────────────────────────────────────────────
  {
    id: 'tokens.only',
    title: 'Tokens only',
    statement: 'A design value is always a token name — never a raw hex, rgb, px, rem or % value.',
    flexibility: 'law',
    category: 'tokens',
    source: 'manifest-zod.ts',
  },
  {
    id: 'tokens.semantic-tier',
    title: 'Semantic tier, never core',
    statement: 'A screen names semantic (or layout) tokens; core tokens exist only for other tokens to point at.',
    flexibility: 'law',
    category: 'tokens',
    source: 'manifest-zod.ts',
  },
  {
    id: 'grid.8pt',
    title: `${grid}pt grid`,
    statement: `Every spacing and every grid-bound size is a multiple of ${grid}pt (the documented exceptions aside).`,
    flexibility: 'law',
    category: 'grid',
    source: 'frame.ts',
  },
  {
    id: 'frame.layout',
    title: `Frame ${baseWidth}×${baseHeight}, margin ${margin}, gutter ${gutter}`,
    statement:
      `The layout is ${baseWidth}×${baseHeight} with a ${margin}pt safe-area margin the frame applies itself; the root is the layout container and adds no margin; top-level modules and stacked columns sit exactly ${gutter}pt apart.`,
    flexibility: 'law',
    category: 'frame',
    source: 'frame.ts',
  },
  {
    id: 'layers.stack',
    title: 'Video, overlay, content',
    statement:
      'Every screen is three layers — video, overlay, content. The content layer is transparent: the outermost container paints no background.',
    flexibility: 'law',
    category: 'layers',
    source: 'screen-layers.ts',
  },
  {
    id: 'focus.single',
    title: 'One focus per screen',
    statement: 'A TV screen has exactly one focused element — the one the viewer is on.',
    flexibility: 'law',
    category: 'focus',
    source: 'frame.ts',
  },
  {
    id: 'component.api',
    title: 'Component API',
    statement:
      'Only real components, with their declared props and allowed values; children only on components that accept them, as a list of nodes.',
    flexibility: 'law',
    category: 'component',
    source: 'manifest-zod.ts',
  },
  {
    id: 'blueprint.dsl',
    title: 'Blueprint DSL shape',
    statement:
      'Only the keys the Blueprint DSL defines, version 1, at most 6 screens with unique ids, at most 4 short notes, and every goTo names another screen of the document.',
    flexibility: 'law',
    category: 'dsl',
    source: 'blueprint.ts',
  },
  {
    id: 'layout.anchor-structure',
    title: 'Anchor structure',
    statement:
      'Only a direct child of the root can be anchored, and never the component that holds a level’s focus in the content.',
    flexibility: 'law',
    category: 'layout',
    source: 'frame.ts',
  },

  // ── Patterns ──────────────────────────────────────────────────────────────
  {
    id: 'layers.overlay-model',
    title: 'Overlay models',
    statement:
      'Every screen names one of the fixed layer models, on that model’s level, with its content on the side the model shades.',
    flexibility: 'pattern',
    category: 'layers',
    source: 'screen-layers.ts',
  },
  {
    id: 'level.module-limit',
    title: 'Module limit per level',
    statement: 'A navigation level shows at most its number of content modules (one on levels 0, 2 and 3).',
    flexibility: 'pattern',
    category: 'level',
    source: 'screen-layers.ts',
  },
  {
    id: 'level.root-direction',
    title: 'Root direction per level',
    statement:
      'On levels that require it, the outermost container is a column; on levels whose stack sits at the end of the frame, it is justified to the end.',
    flexibility: 'pattern',
    category: 'level',
    source: 'frame.ts',
  },
  {
    id: 'level.initial-focus',
    title: 'Where focus starts',
    statement:
      'Each level starts its focus on its own component: the main menu on Home, an interactivity button on level 2, the rounded or close button on level 3.',
    flexibility: 'pattern',
    category: 'level',
    source: 'frame.ts',
    appliesTo: ['MainMenu', 'InteractivityButton', 'CloseButton', 'RoundedButton'],
  },
  {
    id: 'flow.next-level',
    title: 'Links from N to N+1',
    statement: 'A link opens the next level or goes back up — it never skips a level.',
    flexibility: 'pattern',
    category: 'flow',
    source: 'flow.ts',
  },
  {
    id: 'flow.link-roles',
    title: 'Link roles',
    statement:
      'The main menu carries no link; a back control returns exactly one level; a close control returns to Home.',
    flexibility: 'pattern',
    category: 'flow',
    source: 'flow.ts',
    appliesTo: ['MainMenu', 'RoundedButton', 'CloseButton'],
  },
  {
    id: 'flow.rail-consistency',
    title: 'Rail consistency',
    statement: 'A second-level page shows as many interactivity buttons as the Home rail it is entered from.',
    flexibility: 'pattern',
    category: 'flow',
    source: 'flow.ts',
    appliesTo: ['InteractivityButton'],
  },
  {
    id: 'layout.slots',
    title: 'Slots, order and parents',
    statement:
      'A component with slots takes each slot at most once, in slot order; a component with parents goes only directly inside them.',
    flexibility: 'pattern',
    category: 'layout',
    source: 'manifest.ts',
    appliesTo: ['ContentCard', 'ContentCardHeader', 'ContentCardBody', 'ContentCardFooter', 'TableCell'],
  },
  {
    id: 'layout.root-align',
    title: 'Root with align: stretch',
    statement: 'The stack that holds the components always stretches; a module places itself inside it.',
    flexibility: 'pattern',
    category: 'layout',
    source: 'frame.ts',
  },
  {
    id: 'layout.no-static-center',
    title: 'No static centering',
    statement: 'The master layout is never statically centered — TV layouts follow the focus.',
    flexibility: 'pattern',
    category: 'layout',
    source: 'frame.ts',
  },
  {
    id: 'layout.anchor',
    title: 'One anchored group',
    statement: 'A frame anchors at most one element group, and only on levels that allow an anchor.',
    flexibility: 'pattern',
    category: 'layout',
    source: 'frame.ts',
  },

  // ── Conventions ───────────────────────────────────────────────────────────
  {
    id: 'templates.reference',
    title: 'Reference screens',
    statement: 'A generation starts from the reference screen whose shape the plan describes.',
    flexibility: 'convention',
    category: 'templates',
    source: 'rules.ts',
  },
  {
    id: 'copy.button-label',
    title: 'Button labels say what they do',
    statement: 'A button label names the action it performs.',
    flexibility: 'convention',
    category: 'copy',
    source: 'rules.ts',
    appliesTo: ['Button', 'WideButton', 'InteractivityButton'],
  },
] as const satisfies readonly PatternRule[]

/**
 * The rules meant to be global: always in the planner prompt, so they carry no
 * `appliesTo`. Any other rule must name its components (`rules.test.ts` holds
 * the two lists together), so a rule is never injected everywhere by omission.
 */
export const GLOBAL_RULE_IDS: readonly string[] = [
  'tokens.only',
  'tokens.semantic-tier',
  'grid.8pt',
  'frame.layout',
  'layers.stack',
  'focus.single',
  'component.api',
  'blueprint.dsl',
  'layout.anchor-structure',
  'layers.overlay-model',
  'level.module-limit',
  'level.root-direction',
  'flow.next-level',
  'layout.root-align',
  'layout.no-static-center',
  'layout.anchor',
  'templates.reference',
]

/** Every id in the built-in book — the validator can only name one of these. */
export type RuleId = (typeof RULES)[number]['id']

/** Where an issue sits, as keys and indexes: `['root', 'children', 1, 'props', 'items', 2, 'label']`. */
export type IssuePath = (string | number)[]

/** One broken rule: which one, the sentence the Generator acts on, and where (relative to the screen). */
export interface RuleProblem {
  ruleId: RuleId
  message: string
  path: IssuePath
}

/** The book the active design system follows: its own, or the built-in one. */
export function rulesOf(manifest: DesignSystemManifest): readonly PatternRule[] {
  return manifest.rules ?? RULES
}

export function ruleById(manifest: DesignSystemManifest, id: string): PatternRule | undefined {
  return rulesOf(manifest).find((rule) => rule.id === id)
}
