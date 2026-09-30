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

describe('sanitizeProps — a list prop is repaired item by item (9D; was pinned in 9A as a whole-prop reset)', () => {
  /** Home with MainMenu's `miscellaneousItems` set to `items`; the menu's props after interpretation, and the issues. */
  function menuWith(items: unknown) {
    const doc = structuredClone(homeTemplate.blueprint) as unknown as { root: CanvasNode }
    const menu = find(doc.root, 'MainMenu')!
    menu.props = { ...menu.props, miscellaneousItems: items }
    const result = interpretBlueprint(doc)
    if (!result.ok) throw new Error(result.error)
    return {
      items: find(result.tree, 'MainMenu')!.props.miscellaneousItems,
      warns: result.issues.filter((i) => i.level === 'warn' && i.ruleId === 'component.api').map((i) => i.message),
    }
  }

  it('keeps the good items and drops only the item whose required field is bad, naming the node and the field', () => {
    const { items, warns } = menuWith([{ title: 'Kept' }, { title: 5 }, { title: 'Also kept', subtitle: 'ok' }])
    expect(items).toEqual([{ title: 'Kept' }, { title: 'Also kept', subtitle: 'ok' }])
    expect(warns).toEqual([
      'Dropped miscellaneousItems[1] on <MainMenu> — "title" is required and 5 is not an allowed value, so there is no default to keep the item by.',
    ])
  })

  it('drops an item that lacks a required field, and one that is not an object', () => {
    const { items, warns } = menuWith([{ subtitle: 'no title' }, 'text', { title: 'ok' }])
    expect(items).toEqual([{ title: 'ok' }])
    expect(warns).toHaveLength(2)
    expect(warns[1]).toMatch(/Dropped miscellaneousItems\[1\] on <MainMenu> — an item is an object with title, subtitle, iconSrc/)
  })

  it('repairs only the bad field when it is optional, keeping the rest of the item', () => {
    const { items, warns } = menuWith([{ title: 'Kept', subtitle: 7, iconSrc: 'a.svg' }])
    expect(items).toEqual([{ title: 'Kept', iconSrc: 'a.svg' }])
    expect(warns).toEqual(['Ignored miscellaneousItems[0].subtitle=7 on <MainMenu> (not an allowed value) — kept the default.'])
  })

  it('removes an unsupported field and keeps the item', () => {
    const { items, warns } = menuWith([{ title: 'Kept', bogus: 1 }])
    expect(items).toEqual([{ title: 'Kept' }])
    expect(warns).toEqual(['Removed unsupported field "bogus" from miscellaneousItems[0] on <MainMenu>.'])
  })

  it('a list over its limit still falls back whole (the limit is the list’s, not an item’s)', () => {
    const { items, warns } = menuWith(Array.from({ length: 9 }, (_, i) => ({ title: `T${i}` })))
    expect(items).toEqual([])
    expect(warns.some((w) => /Ignored miscellaneousItems=/.test(w))).toBe(true)
  })

  it('a valid list is untouched, with no issue', () => {
    const { items, warns } = menuWith([{ title: 'A', subtitle: 'B' }])
    expect(items).toEqual([{ title: 'A', subtitle: 'B' }])
    expect(warns).toEqual([])
  })
})
