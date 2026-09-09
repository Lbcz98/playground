import { describe, expect, it } from 'vitest'
import { hydrateRegistry } from './registry'
import { SCREENFLOW_MANIFEST } from '@/shared/design-system/screenflow-manifest'
import { parseStorybookDocgen } from '@/shared/design-system/storybook-adapter'

describe('hydrateRegistry — built-in ScreenFlow', () => {
  const reg = hydrateRegistry(SCREENFLOW_MANIFEST)

  it('exposes every manifest component with a real (non-generic) renderer', () => {
    expect(reg.types.sort()).toEqual(['Button', 'Input', 'Stack', 'Text'])
    for (const t of reg.types) expect(reg.get(t)!.generic).toBe(false)
  })

  it('carries compiled schema, default props and synthesised controls', () => {
    const stack = reg.get('Stack')!
    expect(stack.defaultProps.gap).toBe('md')
    expect(stack.schema.safeParse(stack.defaultProps).success).toBe(true)
    expect(stack.controls.gap).toEqual({ kind: 'select', label: 'Gap', options: expect.any(Array) })
    expect(stack.controls.bordered).toEqual({ kind: 'boolean', label: 'Bordered' })
  })

  it('renders without throwing', () => {
    const el = reg.get('Button')!.render({ label: 'Go', variant: 'primary', size: 'md' }, null)
    expect(el).toBeTruthy()
  })
})

describe('hydrateRegistry — imported design system', () => {
  const imported = parseStorybookDocgen(
    {
      components: {
        Hero: {
          displayName: 'Hero',
          props: {
            title: { required: true, type: { name: 'string' } },
            children: { required: false, type: { name: 'node' } },
          },
        },
      },
    },
    { id: 'acme', name: 'Acme', version: '1.0.0' },
  )
  const reg = hydrateRegistry(imported)

  it('falls back to the generic renderer for every component', () => {
    expect(reg.get('Hero')!.generic).toBe(true)
    const el = reg.get('Hero')!.render({ title: 'Hi' }, null)
    expect(el).toBeTruthy()
  })

  it('still provides default props and controls from the manifest', () => {
    const hero = reg.get('Hero')!
    expect(hero.acceptsChildren).toBe(true)
    expect(hero.controls.title).toEqual({ kind: 'text', label: 'Title' })
    expect(hero.defaultProps).toHaveProperty('title')
  })
})
