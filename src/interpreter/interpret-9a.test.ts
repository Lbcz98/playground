/** Phase 9A: the interpreter names the rule behind each repair; `sanitizeProps` is pinned as it is today. */
import { describe, expect, it } from 'vitest'
import { interpretBlueprint, interpretPrototype } from './interpret'
import { DTV_SCREEN_LAYERS } from '@/shared/design-system/screen-layers'
import { homeTemplate } from '@/shared/templates/home'
import type { CanvasNode } from '@/model/nodeTree'

const home = { model: 'home', level: 1 }

function issuesOf(doc: unknown) {
  const result = interpretBlueprint(doc)
  if (!result.ok) throw new Error(result.error)
  return result.issues
}

function find(node: CanvasNode, type: string): CanvasNode | undefined {
  if (node.type === type) return node
  for (const child of node.children ?? []) {
    const hit = find(child, type)
    if (hit) return hit
  }
  return undefined
}

describe('InterpretIssue.ruleId', () => {
  it('names the slot rule when a card zone is dropped from outside its card', () => {
    const issues = issuesOf({ version: 1, screen: home, root: { type: 'Stack', children: [{ type: 'ContentCardHeader' }] } })
    expect(issues.find((i) => i.message.startsWith('Dropped a child'))?.ruleId).toBe('layout.slots')
  })

  it('names the root-align pattern when the root is stretched', () => {
    const issues = issuesOf({ version: 1, screen: home, root: { type: 'Stack', props: { align: 'start' } } })
    expect(issues.find((i) => /always stretches/.test(i.message))?.ruleId).toBe('layout.root-align')
  })

  it('names the flow pattern when a link skipping a level is dropped', () => {
    const deep = DTV_SCREEN_LAYERS.models.find((m) => m.level === 3)!
    const result = interpretPrototype({
      version: 1,
      id: 'home',
      screen: home,
      root: { type: 'Stack', children: [{ type: 'Button', goTo: 'deep' }] },
      screens: [{ id: 'deep', screen: { model: deep.id, level: 3 }, root: { type: 'Stack' } }],
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.issues.find((i) => i.message.startsWith('Dropped the link'))?.ruleId).toBe('flow.next-level')
  })

  it('carries the frame audit’s rule on what is left unrepaired', () => {
    const rail = DTV_SCREEN_LAYERS.models.find((m) => m.level === 2)!
    const issues = issuesOf({
      version: 1,
      screen: { model: rail.id, level: 2 },
      root: { type: 'Stack', props: { direction: 'vertical' }, children: [{ type: 'Stack' }, { type: 'Stack' }] },
    })
    const left = issues.filter((i) => i.message.startsWith('Still breaks a layout rule'))
    expect(left.map((i) => i.ruleId)).toContain('level.module-limit')
  })
})

describe('sanitizeProps (characterization, until 9D)', () => {
  it('resets a whole list prop to its default when one item is bad', () => {
    const doc = structuredClone(homeTemplate.blueprint) as unknown as { root: CanvasNode }
    const menuOf = (tree: CanvasNode) => find(tree, 'MainMenu')!
    const reference = interpretBlueprint(structuredClone(doc))
    if (!reference.ok) throw new Error(reference.error)
    const fallback = menuOf(reference.tree).props.miscellaneousItems

    const menu = find(doc.root, 'MainMenu')!
    menu.props = { ...menu.props, miscellaneousItems: [{ title: 'Kept?' }, { title: 5 }] }
    const result = interpretBlueprint(doc)
    if (!result.ok) throw new Error(result.error)

    // Today the good item is lost with the bad one; 9D repairs only `[1].title`.
    expect(menuOf(result.tree).props.miscellaneousItems).toEqual(fallback)
    const issue = result.issues.find((i) => i.message.startsWith('Ignored miscellaneousItems='))
    expect(issue).toMatchObject({ level: 'warn', ruleId: 'component.api' })
    expect(issue?.message).toMatch(/\(not an allowed value\) — kept the default\.$/)
  })
})
