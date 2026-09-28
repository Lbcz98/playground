import { beforeEach, describe, expect, it } from 'vitest'
import { useFlowStore } from './flowStore'
import { homeTemplate } from '@/shared/templates/home'
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

    const run = store().applyAgentBlueprint(homeTemplate.blueprint, 'Build a 3-tier pricing card')

    expect(run.ok).toBe(true)
    expect(store().past).toHaveLength(1)
    expect(store().tree).not.toBe(before)
    expect(store().tree.children).toHaveLength(1) // one module: rail + menu
    expect(store().lastActionLabel).toMatch(/^AI · /)
  })

  it('is reverted by a single undo, and re-applied by a single redo', () => {
    const initialLabels = store().tree.children.map((c) => c.props.content)

    store().applyAgentBlueprint(homeTemplate.blueprint, 'pricing')
    expect(store().tree.children.length).toBe(1)

    store().undo()
    expect(store().past).toHaveLength(0)
    expect(store().tree.children.map((c) => c.props.content)).toEqual(initialLabels)

    store().redo()
    expect(store().tree.children.length).toBe(1)
  })

  it('treats two generations as two independent undo steps', () => {
    store().applyAgentBlueprint(homeTemplate.blueprint, 'first')
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

describe('the layer rule on the canvas document', () => {
  it('starts as a Home screen that passes the layout QA', () => {
    expect(store().tree.screen).toEqual({ model: 'home', level: 1 })
    expect(frameLayoutErrors({ root: store().tree }, SCREENFLOW_MANIFEST)).toEqual([])
  })

  it('changes the layer model in one undoable step, and ignores a no-op', () => {
    store().setScreen({ model: 'home', level: 1 })
    expect(store().past).toHaveLength(0)
    store().setScreen({ model: 'interactivity-cards-right', level: 3 })
    expect(store().tree.screen).toEqual({ model: 'interactivity-cards-right', level: 3 })
    expect(store().past).toHaveLength(1)
    store().undo()
    expect(store().tree.screen).toEqual({ model: 'home', level: 1 })
  })

  it('takes the generated screen’s model', () => {
    store().applyAgentBlueprint({ ...homeTemplate.blueprint, screen: { model: 'home-notification', level: 1 } }, 'pricing')
    expect(store().tree.screen).toEqual({ model: 'home-notification', level: 1 })
    store().undo()
    expect(store().tree.screen).toEqual({ model: 'home', level: 1 })
  })
})

describe('screens — several frames in one document', () => {
  const doc = (): BlueprintDocument => ({
    ...homeTemplate.blueprint,
    id: 'a',
    name: 'Option A',
    screens: ['b', 'c'].map((id) => ({
      id,
      name: `Option ${id.toUpperCase()}`,
      screen: homeTemplate.blueprint.screen,
      root: homeTemplate.blueprint.root,
    })),
  })

  it('starts with one screen whose tree is `tree`', () => {
    expect(store().screens).toHaveLength(1)
    expect(store().tree).toBe(store().screens[0].tree)
    expect(store().tree.props.align).toBe('stretch')
  })

  it('renders three options as three frames in ONE undo step', () => {
    const run = store().applyAgentBlueprint(doc(), 'three options')
    expect(run.ok && run.screenCount).toBe(3)
    expect(store().screens.map((s) => s.name)).toEqual(['Option A', 'Option B', 'Option C'])
    expect(store().activeId).toBe('a')
    expect(store().past).toHaveLength(1)

    store().undo()
    expect(store().screens).toHaveLength(1)
    store().redo()
    expect(store().screens).toHaveLength(3)
  })

  it('edits only the open screen, and switching keeps each screen’s edits', () => {
    store().applyAgentBlueprint(doc(), 'x')
    const child = store().tree.children[0].id
    store().updateProps(child, { content: 'Edited on A' })
    store().setActiveScreen('b')
    expect(store().tree.children[0].props.content).not.toBe('Edited on A')
    store().setActiveScreen('a')
    expect(store().tree.children[0].props.content).toBe('Edited on A')
    expect(store().tree).toBe(store().screens.find((s) => s.id === 'a')!.tree)
  })

  it('undo brings back the screen that was open', () => {
    store().applyAgentBlueprint(doc(), 'x')
    store().setActiveScreen('c')
    store().updateProps(store().tree.children[0].id, { content: 'C' })
    store().undo()
    expect(store().activeId).toBe('c')
    expect(store().tree.children[0].props.content).not.toBe('C')
  })

  it('deletes a screen (to keep the option picked), never the last, and drops links to it', () => {
    const linked = doc()
    linked.root = structuredClone(linked.root)
    linked.root.children![0].goTo = 'b'
    store().applyAgentBlueprint(linked, 'x')
    expect(JSON.stringify(store().screens[0].tree)).toContain('"goTo":"b"')

    store().deleteScreen('b')
    expect(store().screens.map((s) => s.id)).toEqual(['a', 'c'])
    expect(JSON.stringify(store().screens[0].tree)).not.toContain('goTo')

    store().deleteScreen('a')
    expect(store().activeId).toBe('c')
    store().deleteScreen('c')
    expect(store().screens).toHaveLength(1)
  })
})

describe('agent notes', () => {
  it('ride on the run report', () => {
    const run = store().applyAgentBlueprint({ ...homeTemplate.blueprint, notes: ['Aproximei o mapa.'] }, 'x')
    expect(run.ok && run.notes).toEqual(['Aproximei o mapa.'])
  })
})
