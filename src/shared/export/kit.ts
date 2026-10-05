/**
 * Where each DTV blueprint node type lives in the kit — the join the TSX exporter
 * reads to turn `{ type: 'MainMenu' }` into `import { MainMenu } from …`.
 *
 * The names are the kit's own (the DTV system's), not the built-in catalog's: a
 * blueprint written against the catalog (`Stack` with `direction: 'vertical'`)
 * must be translated first, the way `scripts/storybook/dtv-templates.ts` does.
 *
 * Every entry is held to the real module by `toTsx.test.ts` (the export exists),
 * and the generated code is held to the real props by the TypeScript compiler.
 */

export interface KitImport {
  /** The module path as written in this repo (`@/ui-kit/…`); the exporter can rewrite it. */
  module: string
  /** The exported name. */
  name: string
}

const ui = (name: string, file = name): KitImport => ({ module: `@/ui-kit/${file}`, name })

export const DTV_KIT: Readonly<Record<string, KitImport>> = {
  Stack: { module: '@/primitives', name: 'Stack' },
  AlertBug: ui('AlertBug'),
  CloseButton: ui('CloseButton'),
  ContentCard: ui('ContentCard'),
  ContentCardBody: ui('ContentCardBody', 'ContentCard'),
  ContentCardFooter: ui('ContentCardFooter', 'ContentCard'),
  ContentCardHeader: ui('ContentCardHeader', 'ContentCard'),
  InteractivityButton: ui('InteractivityButton'),
  InteractivityMenu: ui('InteractivityMenu'),
  LabelVideo: ui('LabelVideo'),
  MainMenu: ui('MainMenu'),
  Notification: ui('Notification'),
  RoundedButton: ui('RoundedButton'),
  TableCell: ui('TableCell'),
  WideButton: ui('WideButton'),
}

/** The frame every exported screen sits in. */
export const SCREEN_IMPORT: KitImport = { module: '@/ui-kit/Screen', name: 'Screen' }
