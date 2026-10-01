/**
 * Test fixtures shared by the deviation tests and the 9G golden set: for every declarable pattern, a screen that
 * breaks it and nothing else (and where its declaration belongs); for each 9G law trap, a screen that breaks the
 * law. Tests only — nothing in the app imports this.
 */

import { homeTemplate } from '@/shared/templates/home'
import { screenTemplate } from '@/shared/templates'
import { DTV_SCREEN_LAYERS } from '../screen-layers'

type Doc = Record<string, any>
export const home = (): Doc => structuredClone(homeTemplate.blueprint) as unknown as Doc
const model = (level: number) => DTV_SCREEN_LAYERS.models.find((m) => m.level === level)!.id
export const lvl = (n: number) => ({ model: model(n), level: n })
/** Home with its root pushed off `align: stretch` — one pattern broken (`layout.root-align`). */
export const breaksRootAlign = (): Doc => {
  const doc = home()
  doc.root.props = { ...doc.root.props, align: 'start' }
  return doc
}
const rail = (d: Doc): Doc => d.root.children[0].children[0]
/** A valid screen of a template, as a further screen of a flow. */
const page = (id: string, template: string): Doc => {
  const b = structuredClone(screenTemplate(template)!.blueprint) as unknown as Doc
  return { id, screen: b.screen, root: b.root }
}
/** The level-2 rail page (four cards, one focused) and the level-3 single-interactivity page (one card, the anchored back button focused). */
const level2 = (id: string) => page(id, 'interactivity-buttons-right')
const level3 = (id: string) => page(id, 'interactivity-cards-right')

export interface PatternBreak {
  /** A document that breaks the rule, nothing else. */
  doc: () => Doc
  /** The node a node-scoped declaration belongs on. */
  node: (doc: Doc) => Doc
  /** The screen object a screen-level declaration belongs in (where the break is reported). */
  screen: (doc: Doc) => Doc
}

export const PATTERN_BREAKS: Record<string, PatternBreak> = {
  'layout.slots': {
    doc: () => { const d = home(); d.root.children[0].children.push({ type: 'ContentCardHeader' }); return d },
    node: (d) => d.root.children[0],
    screen: (d) => d.screen,
  },
  'flow.next-level': {
    doc: () => {
      const d = home()
      d.root.children[0].children[0].children[0].goTo = 'other'
      return { ...d, id: 'home', screens: [level3('other')] }
    },
    node: (d) => d.root.children[0].children[0].children[0],
    screen: (d) => d.screen,
  },
  'flow.link-roles': {
    doc: () => {
      const d = home()
      d.root.children[0].children[1].goTo = 'other' // the main menu carries no link
      return { ...d, id: 'home', screens: [level2('other')] }
    },
    node: (d) => d.root.children[0].children[1],
    screen: (d) => d.screen,
  },
  'flow.rail-consistency': {
    // A level-2 page that shows fewer cards than the Home rail it is entered from: reported on that page's root.
    doc: () => {
      const rail2 = level2('rail')
      // Two of the Home rail's four cards (the focused one kept).
      rail2.root.children[0].children = rail2.root.children[0].children.slice(1, 3)
      return { ...home(), id: 'home', screens: [rail2] }
    },
    node: (d) => d.screens[0].root,
    screen: (d) => d.screens[0].screen,
  },
  'level.module-limit': {
    doc: () => {
      // The level-3 page with a second content module next to the first.
      const p = level3('first')
      p.root.children.splice(1, 0, structuredClone(p.root.children[0]))
      return { version: 1, screen: p.screen, root: p.root }
    },
    node: (d) => d.root,
    screen: (d) => d.screen,
  },
  'level.root-direction': {
    doc: () => { const d = home(); d.root.props = { ...d.root.props, direction: 'horizontal' }; return d },
    node: (d) => d.root,
    screen: (d) => d.screen,
  },
  'level.initial-focus': {
    doc: () => {
      // Focus starts on the first rail card instead of the program button: the menu rests.
      const d = home()
      d.root.children[0].children[0].children[0].props = { title: 'Um', interactionState: 'focus' }
      d.root.children[0].children[1].props = { ...d.root.children[0].children[1].props, focusedItem: 'none' }
      return d
    },
    node: (d) => d.root,
    screen: (d) => d.screen,
  },
  'layout.root-align': { doc: breaksRootAlign, node: (d) => d.root, screen: (d) => d.screen },
  'layout.no-static-center': {
    doc: () => { const d = home(); d.root.props = { ...d.root.props, justify: 'center' }; return d },
    node: (d) => d.root,
    screen: (d) => d.screen,
  },
  'layout.anchor': {
    doc: () => { const d = home(); d.root.children.push({ type: 'Button', props: { label: 'A' }, anchor: true }, { type: 'Button', props: { label: 'B' }, anchor: true }); return d },
    node: (d) => d.root,
    screen: (d) => d.screen,
  },
  'registry.new-component': {
    doc: () => {
      const d = home()
      d.root.children[0].children.push({ type: 'Proposal', props: { description: 'Placar ao vivo', proposedApi: { homeScore: 'number' } } })
      return d
    },
    node: (d) => d.root.children[0].children[2],
    screen: (d) => d.screen,
  },
  'layers.overlay-model': {
    doc: () => { const d = home(); d.screen = { model: 'composed', level: 1, shades: ['scrim', 'bottom'] }; return d },
    node: (d) => d.root,
    screen: (d) => d.screen,
  },
}

/** A screen that breaks a law, and the laws the validator reports for it in each mode. */
export interface LawBreak {
  doc: () => Doc
  laws: { faithful: string[]; exploratory: string[] }
}

export const LAW_BREAKS: Record<string, LawBreak> = {
  // A raw hex: on a primitive it is tokens.only; Faithful has no primitive at all, so the node is an unknown component.
  'raw-hex': {
    doc: () => {
      const d = home()
      d.root.children[0].children.unshift({ type: 'primitive:Text', props: { text: 'GOL', color: '#e10600' }, reuse: { considered: 'Text', why: 'sem cor' } })
      return d
    },
    laws: { faithful: ['component.api'], exploratory: ['tokens.only'] },
  },
  // A raw px value on a component prop is not one of its token values.
  'raw-px': {
    doc: () => { const d = home(); rail(d).props = { ...rail(d).props, gap: '13px' }; return d },
    laws: { faithful: ['component.api'], exploratory: ['component.api'] },
  },
  'unknown-component': {
    doc: () => { const d = home(); d.root.children[0].children.push({ type: 'Carousel', props: {} }); return d },
    laws: { faithful: ['component.api'], exploratory: ['component.api'] },
  },
  'two-focused': {
    doc: () => { const d = home(); rail(d).children.slice(0, 2).forEach((c: Doc) => (c.props = { ...c.props, interactionState: 'focus' })); return d },
    laws: { faithful: ['focus.single'], exploratory: ['focus.single'] },
  },
  'opaque-content': {
    doc: () => { const d = home(); d.root.props = { ...d.root.props, surface: 'raised' }; return d },
    laws: { faithful: ['component.api', 'layers.stack'], exploratory: ['component.api', 'layers.stack'] },
  },
}
