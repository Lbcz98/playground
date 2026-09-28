import { describe, expect, it } from 'vitest'
import { interpretBlueprint } from './interpret'
import { homeTemplate } from '@/shared/templates/home'
import { countNodes, type CanvasNode } from '@/model/nodeTree'
import type { DesignSystemManifest } from '@/shared/design-system/manifest'

function allIds(node: CanvasNode, acc: string[] = []): string[] {
  acc.push(node.id)
  node.children.forEach((c) => allIds(c, acc))
  return acc
}

describe('interpretBlueprint', () => {
  it('accepts the home template with no corrections', () => {
    const result = interpretBlueprint(homeTemplate.blueprint)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.issues).toHaveLength(0)
    expect(result.nodeCount).toBe(countNodes(result.tree))
    // one module: the rail over the main menu
    expect(result.tree.children).toHaveLength(1)
    expect(result.tree.children[0].children).toHaveLength(2)
  })

  it('assigns a fresh unique id to every node', () => {
    const result = interpretBlueprint(homeTemplate.blueprint)
    if (!result.ok) throw new Error('expected ok')
    const ids = allIds(result.tree)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every((id) => /^n_[0-9a-f]{8}$/.test(id) || id.startsWith('n_'))).toBe(true)
  })

  it('drops unknown components', () => {
    const result = interpretBlueprint({
      version: 1,
      root: {
        type: 'Stack',
        children: [
          { type: 'Text', props: { content: 'kept' } },
          { type: 'Carousel', props: { slides: 3 } },
          { type: 'MarqueeHero' },
        ],
      },
    })
    if (!result.ok) throw new Error('expected ok')
    expect(result.tree.children).toHaveLength(1)
    expect(result.tree.children[0].type).toBe('Text')
    expect(result.issues.filter((i) => /unknown component/i.test(i.message))).toHaveLength(2)
  })

  it('removes unsupported props and coerces invalid token values to the default', () => {
    // Nested one level deep — the ROOT is also held to the active screen level's
    // own layout rules (default: Home, whose outermost container must be a
    // column), which this test isn't about.
    const result = interpretBlueprint({
      version: 1,
      root: {
        type: 'Stack',
        children: [
          {
            type: 'Stack',
            props: { gap: 'ginormous', padding: '10px', boxShadow: '0 0 4px red', direction: 'horizontal' },
          },
        ],
      },
    })
    if (!result.ok) throw new Error('expected ok')
    const p = result.tree.children[0].props
    expect(p.direction).toBe('horizontal') // valid -> kept
    expect(p.gap).toBe('sm') // invalid enum -> default
    expect(p.padding).toBe('none') // "10px" rejected -> default
    expect('boxShadow' in p).toBe(false) // unknown prop -> removed
    expect(result.issues.some((i) => /gap=/.test(i.message))).toBe(true)
    expect(result.issues.some((i) => /padding=/.test(i.message))).toBe(true)
    expect(result.issues.some((i) => /boxShadow/.test(i.message))).toBe(true)
  })

  it('drops children from components that cannot hold them', () => {
    const result = interpretBlueprint({
      version: 1,
      root: {
        type: 'Stack',
        children: [{ type: 'Text', props: { content: 'no kids' }, children: [{ type: 'Button' }] }],
      },
    })
    if (!result.ok) throw new Error('expected ok')
    expect(result.tree.children[0].children).toHaveLength(0)
    expect(result.issues.some((i) => /can.t contain children/i.test(i.message))).toBe(true)
  })

  it('wraps a non-container root in a Stack', () => {
    const result = interpretBlueprint({
      version: 1,
      root: { type: 'Button', props: { label: 'Solo' } },
    })
    if (!result.ok) throw new Error('expected ok')
    expect(result.tree.type).toBe('Stack')
    expect(result.tree.children).toHaveLength(1)
    expect(result.tree.children[0].type).toBe('Button')
    expect(result.issues.some((i) => i.level === 'info' && /Wrapped/.test(i.message))).toBe(true)
  })

  it('rejects unsupported versions and non-objects', () => {
    expect(interpretBlueprint({ version: 2, root: { type: 'Stack' } }).ok).toBe(false)
    expect(interpretBlueprint(null).ok).toBe(false)
    expect(interpretBlueprint('nope').ok).toBe(false)
    expect(interpretBlueprint({ version: 1 }).ok).toBe(false)
  })
})

describe('interpretBlueprint — frame rules', () => {
  it('keeps "anchor" on only one direct child of the root', () => {
    const result = interpretBlueprint({
      version: 1,
      root: {
        type: 'Stack',
        children: [
          { type: 'Stack', anchor: true },
          { type: 'Stack', anchor: true, children: [{ type: 'Button', anchor: true }] },
        ],
      },
    })
    if (!result.ok) throw new Error('expected ok')
    const [first, second] = result.tree.children
    expect(first.anchor).toBeUndefined()
    expect(second.anchor).toBe(true)
    expect(second.children[0].anchor).toBeUndefined()
    expect(result.issues.some((i) => /only a direct child of the root/.test(i.message))).toBe(true)
    expect(result.issues.some((i) => /at most one element group/.test(i.message))).toBe(true)
  })

  it('repairs the root margin and module-group gutters', () => {
    const result = interpretBlueprint({
      version: 1,
      root: {
        type: 'Stack',
        props: { padding: 'xl', gap: 'lg' },
        children: [{ type: 'Stack', props: { gap: 'xl' }, children: [{ type: 'Stack' }, { type: 'Stack' }] }],
      },
    })
    if (!result.ok) throw new Error('expected ok')
    expect(result.tree.props.padding).toBe('none')
    expect(result.tree.props.gap).toBe('sm')
    expect(result.tree.children[0].props.gap).toBe('sm')
    expect(result.issues.filter((i) => i.level === 'info')).toHaveLength(3)
  })

  it('un-centers a statically centered master layout, leaving nested centering alone', () => {
    const result = interpretBlueprint({
      version: 1,
      root: {
        type: 'Stack',
        props: { align: 'center', justify: 'center' },
        children: [{ type: 'Stack', props: { align: 'center' } }],
      },
    })
    if (!result.ok) throw new Error('expected ok')
    expect([result.tree.props.align, result.tree.props.justify]).toEqual(['stretch', 'start'])
    expect(result.tree.children[0].props.align).toBe('center')
    expect(result.issues.filter((i) => /static center alignment/.test(i.message))).toHaveLength(1)
    expect(result.issues.filter((i) => /always stretches/.test(i.message))).toHaveLength(1)
  })

  it('never seeds an off-grid default — it snaps to the nearest on-grid step', () => {
    const manifest: DesignSystemManifest = {
      id: 'odd',
      name: 'Odd',
      version: '1.0.0',
      tokens: { colors: {}, spacing: { none: '0px', sm: '16px', odd: '20px', lg: '24px' }, typography: {} },
      components: {
        Box: {
          id: 'Box',
          name: 'Box',
          description: 'a container',
          acceptsChildren: true,
          props: {
            padding: { name: 'padding', type: { name: 'enum' }, required: false, defaultValue: 'odd', tokenGroup: 'spacing' },
          },
        },
      },
    }
    const result = interpretBlueprint({ version: 1, root: { type: 'Box', children: [{ type: 'Box' }] } }, manifest)
    if (!result.ok) throw new Error('expected ok')
    expect(result.tree.props.padding).toBe('none') // root: frame supplies the margin
    expect(result.tree.children[0].props.padding).toBe('sm') // 20px → nearest on-grid step
  })
})

describe('interpretBlueprint — Content Card repair', () => {
  const zone = (type: string, props: Record<string, unknown> = {}) => ({ type, props })
  const doc = (children: unknown[]) => ({
    version: 1 as const,
    screen: { model: 'interactivity-cards-right' as const, level: 3 as const },
    root: { type: 'Stack', children: [{ type: 'ContentCard', children }] },
  })
  const cardOf = (r: ReturnType<typeof interpretBlueprint>) => (r.ok ? r.tree.children[0] : null)

  it('puts the zones back in order and drops a second one', () => {
    const r = interpretBlueprint(
      doc([zone('ContentCardFooter'), zone('ContentCardHeader'), zone('ContentCardHeader', { title: 'twice' })]),
    )
    expect(r.ok).toBe(true)
    expect(cardOf(r)!.children.map((c) => c.type)).toEqual(['ContentCardHeader', 'ContentCardFooter'])
    if (!r.ok) return
    expect(r.issues.some((i) => /second <ContentCardHeader>/.test(i.message))).toBe(true)
    expect(r.issues.some((i) => /back in the order/.test(i.message))).toBe(true)
  })

  it('drops a stranger from the card and a zone from outside one', () => {
    const r = interpretBlueprint({
      version: 1,
      screen: { model: 'interactivity-cards-right', level: 3 },
      root: {
        type: 'Stack',
        children: [
          { type: 'ContentCard', children: [{ type: 'Text' }, zone('ContentCardBody')] },
          zone('ContentCardHeader'),
        ],
      },
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.tree.children.map((c) => c.type)).toEqual(['ContentCard'])
    expect(r.tree.children[0].children.map((c) => c.type)).toEqual(['ContentCardBody'])
  })
})
