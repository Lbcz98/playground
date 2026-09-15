import { beforeEach, describe, expect, it } from 'vitest'
import { useFlowStore } from './flowStore'
import { PRICING_CARD_BLUEPRINT } from '@/shared/fixtures/pricingCard'
import type { BlueprintDocument } from '@/shared/blueprint'
import { frameLayoutErrors } from '@/shared/layout/frame'
import { SCREENFLOW_MANIFEST } from '@/shared/design-system/screenflow-manifest'

const store = () => useFlowStore.getState()

beforeEach(() => {
  store().reset()
})

describe('applyAgentBlueprint — per-turn undo', () => {
  it('renders the Blueprint and records exactly one history step', () => {
    const before = store().tree

    const run = store().applyAgentBlueprint(PRICING_CARD_BLUEPRINT, 'Build a 3-tier pricing card')

    expect(run.ok).toBe(true)
    expect(store().past).toHaveLength(1)
    expect(store().tree).not.toBe(before)
    expect(store().tree.children).toHaveLength(2) // header + tier row
    expect(store().lastActionLabel).toMatch(/^AI · /)
  })

  it('is reverted by a single undo, and re-applied by a single redo', () => {
    const initialLabels = store().tree.children.map((c) => c.props.content)

    store().applyAgentBlueprint(PRICING_CARD_BLUEPRINT, 'pricing')
    expect(store().tree.children.length).toBe(2)

    store().undo()
    expect(store().past).toHaveLength(0)
    expect(store().tree.children.map((c) => c.props.content)).toEqual(initialLabels)

    store().redo()
    expect(store().tree.children.length).toBe(2)
  })

  it('treats two generations as two independent undo steps', () => {
    store().applyAgentBlueprint(PRICING_CARD_BLUEPRINT, 'first')
    const firstTreeChildCount = store().tree.children.length

    const smaller: BlueprintDocument = {
      version: 1,
      root: { type: 'Stack', children: [{ type: 'Text', props: { content: 'v2' } }] },
    }
    store().applyAgentBlueprint(smaller, 'second')
    expect(store().tree.children).toHaveLength(1)
    expect(store().past).toHaveLength(2)

    store().undo() // back to first generation
    expect(store().tree.children.length).toBe(firstTreeChildCount)
  })

  it('does not touch history when the Blueprint is invalid', () => {
    const run = store().applyAgentBlueprint({ version: 9 } as unknown as BlueprintDocument, 'bad')
    expect(run.ok).toBe(false)
    expect(store().past).toHaveLength(0)
    expect(store().lastAgentRun?.ok).toBe(false)
  })
})

describe('frame anchoring', () => {
  const anchoredIds = () => store().tree.children.filter((c) => c.anchor).map((c) => c.id)

  it('starts on a frame-compliant screen: primary actions in the content, only a secondary cluster anchored', () => {
    const tree = store().tree
    expect(frameLayoutErrors({ root: tree }, SCREENFLOW_MANIFEST)).toEqual([])
    expect(anchoredIds()).toHaveLength(1)

    const labels = (node: (typeof tree.children)[number]) => node.children.map((c) => c.props.label)
    expect(labels(tree.children.find((c) => c.anchor)!)).toEqual(['Help'])
    const contentActions = tree.children.find((c) => !c.anchor && c.type === 'Stack')!
    expect(labels(contentActions)).toEqual(['Get started', 'Learn more'])
  })

  it('anchors at most one direct child of the root, undoably', () => {
    const [title, body] = store().tree.children
    store().setAnchor(title.id, true)
    expect(anchoredIds()).toEqual([title.id])
    store().setAnchor(body.id, true)
    expect(anchoredIds()).toEqual([body.id])

    store().undo()
    expect(anchoredIds()).toEqual([title.id])
    store().setAnchor(title.id, false)
    expect(anchoredIds()).toEqual([])
  })

  it('ignores anchor requests for nested nodes', () => {
    const cluster = store().tree.children.find((c) => c.anchor)!
    store().setAnchor(cluster.children[0].id, true)
    expect(store().past).toHaveLength(0)
  })
})
