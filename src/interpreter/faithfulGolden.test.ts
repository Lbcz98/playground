/**
 * What the interpreter makes of a fixed Faithful request, pinned before phase 9D:
 * the trees and every issue, ids left out. It exercises the repairs 9D makes
 * deviation-aware (root stretch, stray focus, anchors, slots, links, level root)
 * and must stay identical for a Faithful screen.
 */
import { describe, expect, it } from 'vitest'
import { interpretPrototype } from './interpret'
import { DTV_SCREEN_LAYERS } from '@/shared/design-system/screen-layers'
import { SCREEN_TEMPLATES } from '@/shared/templates'
import type { CanvasNode } from '@/model/nodeTree'

const deep = DTV_SCREEN_LAYERS.models.find((m) => m.level === 3)!.id

/** A request that breaks pattern rules in the ways a model does. */
const REQUEST = {
  version: 1,
  id: 'home',
  screen: { model: 'home', level: 1 },
  root: {
    type: 'Stack',
    props: { direction: 'horizontal', align: 'start', justify: 'center', padding: 'md', bogus: 1 },
    children: [
      { type: 'ContentCardHeader' },
      { type: 'InteractivityButton', props: { title: 'Um', interactionState: 'focus' }, goTo: 'deep' },
      { type: 'InteractivityButton', props: { title: 'Dois', interactionState: 'focus' } },
      { type: 'Button', props: { label: 'A' }, anchor: true },
      { type: 'Button', props: { label: 'B' }, anchor: true },
      { type: 'Carousel' },
      { type: 'ContentCard', children: [{ type: 'ContentCardFooter' }, { type: 'ContentCardHeader' }, { type: 'ContentCardHeader' }] },
    ],
  },
  screens: [{ id: 'deep', screen: { model: deep, level: 3 }, root: { type: 'Stack', children: [{ type: 'Stack' }, { type: 'Stack' }] } }],
}

const strip = (node: CanvasNode): unknown => ({
  type: node.type,
  props: node.props,
  ...(node.anchor ? { anchor: true } : {}),
  ...(node.goTo ? { goTo: node.goTo } : {}),
  ...(node.screen ? { screen: node.screen } : {}),
  children: node.children.map(strip),
})

function snapshotOf(doc: unknown): unknown {
  const result = interpretPrototype(doc)
  if (!result.ok) throw new Error(result.error)
  return {
    screens: result.screens.map((s) => ({ id: s.id, name: s.name, tree: strip(s.tree) })),
    issues: result.issues.map((i) => `${i.level} · ${i.path} · ${i.message}`),
    linkCount: result.linkCount,
  }
}

describe('Faithful interpretation (golden)', () => {
  it('a request that breaks patterns is repaired exactly as before', () => {
    expect(snapshotOf(REQUEST)).toMatchSnapshot()
  })

  it('every reference screen interprets to the same tree', () => {
    for (const t of SCREEN_TEMPLATES) expect(snapshotOf(t.blueprint)).toMatchSnapshot(t.id)
  })
})
