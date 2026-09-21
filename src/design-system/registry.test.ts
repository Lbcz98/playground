import { describe, expect, it } from 'vitest'
import { hydrateRegistry } from './registry'
import { SCREENFLOW_MANIFEST } from '@/shared/design-system/screenflow-manifest'
import { parseStorybookDocgen } from '@/shared/design-system/storybook-adapter'

describe('hydrateRegistry — built-in ScreenFlow', () => {
  const reg = hydrateRegistry(SCREENFLOW_MANIFEST)

  it('exposes every manifest component with a real (non-generic) renderer', () => {
    expect(reg.types.sort()).toEqual([
      'AlertBug',
      'Button',
      'CloseButton',
      'ContentCard',
      'ContentCardBody',
      'ContentCardFooter',
      'ContentCardHeader',
      'Input',
      'InteractivityCard',
      'InteractivityMenu',
      'LabelVideo',
      'MainMenu',
      'Notification',
      'RoundedButton',
      'Stack',
      'Text',
      'WideButton',
    ])
    for (const t of reg.types) expect(reg.get(t)!.generic).toBe(false)
  })

  it('carries compiled schema, default props and synthesised controls', () => {
    const stack = reg.get('Stack')!
    expect(stack.defaultProps.gap).toBe('sm')
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

  it('the generic renderer is chrome from --sfs-* vars, never a literal', () => {
    const el = reg.get('Hero')!.render({ title: 'Hi' }, null) as {
      props: { style?: Record<string, unknown> }
    }
    const style = el.props.style ?? {}
    for (const value of Object.values(style)) {
      if (typeof value === 'string') expect(value).toMatch(/^var\(--sfs-/)
    }
    expect(style.backgroundColor).toBe('var(--sfs-color-surface)')
    expect(style.color).toBe('var(--sfs-color-ink)')
    expect(style.borderColor).toBe('var(--sfs-color-line)')
    expect(style.borderLeftColor).toBe('var(--sfs-color-brand)')
    expect(style.borderRadius).toBe('var(--sfs-radius-md)')
    expect(style.padding).toBe('var(--sfs-space-md)')
  })
})

describe('hydrateRegistry — generic renderer resolves token-typed props', () => {
  const imported = parseStorybookDocgen(
    {
      components: {
        Badge: {
          displayName: 'Badge',
          props: {
            background: { required: false, type: { name: 'string' } },
            cornerRadius: { required: false, type: { name: 'string' } },
          },
        },
      },
      tokens: {
        color: { $type: 'color', brand: { $value: '#e0218a' } },
        radius: { $type: 'dimension', lg: { $value: '16px' } },
      },
    },
    { id: 'acme2', name: 'Acme2', version: '1.0.0' },
  )
  const reg = hydrateRegistry(imported)

  it('a component-declared token prop overrides the box background/radius', () => {
    expect(reg.get('Badge')!.component.props.background.tokenGroup).toBe('colors')
    const el = reg.get('Badge')!.render({ background: 'brand', cornerRadius: 'lg' }, null) as {
      props: { style?: Record<string, unknown> }
    }
    expect(el.props.style?.backgroundColor).toBe('var(--sfs-color-brand)')
    expect(el.props.style?.borderRadius).toBe('var(--sfs-radius-lg)')
  })

  it('falls back to the base surface when the prop value is empty', () => {
    const el = reg.get('Badge')!.render({}, null) as { props: { style?: Record<string, unknown> } }
    expect(el.props.style?.backgroundColor).toBe('var(--sfs-color-surface)')
  })

  it('a value that names no real token falls through instead of dangling', () => {
    const el = reg.get('Badge')!.render({ background: 'not-a-real-token' }, null) as {
      props: { style?: Record<string, unknown> }
    }
    expect(el.props.style?.backgroundColor).toBe('var(--sfs-color-surface)')
  })
})

describe('hydrateRegistry — live components (Phase 8B)', () => {
  const imported = parseStorybookDocgen(
    {
      components: {
        Hero: { displayName: 'Hero', props: { title: { required: false, type: { name: 'string' } } } },
        Footer: { displayName: 'Footer', props: {} },
      },
    },
    { id: 'acme3', name: 'Acme3', version: '1.0.0' },
  )

  function LiveHero(props: Record<string, unknown>) {
    return { type: 'live-hero-marker', props, key: null } as unknown as null
  }

  it('renders a component the bundle provides, and leaves an uncovered one generic', () => {
    const reg = hydrateRegistry(imported, { Hero: LiveHero })
    const hero = reg.get('Hero')!
    expect(hero.live).toBe(true)
    expect(hero.generic).toBe(false)
    expect(reg.liveCount).toBe(1)
    expect(reg.genericCount).toBe(1) // Footer has no live component -> stays generic

    const footer = reg.get('Footer')!
    expect(footer.live).toBe(false)
    expect(footer.generic).toBe(true)
  })

  it('wraps the live component in a boundary and forwards props', () => {
    const reg = hydrateRegistry(imported, { Hero: LiveHero })
    const el = reg.get('Hero')!.render({ title: 'Hi' }, null) as {
      props: { children: { type: unknown; props: Record<string, unknown> } }
    }
    // el = <LiveComponentBoundary><LiveHero title="Hi">…</LiveHero></LiveComponentBoundary>
    const inner = el.props.children
    expect(inner.type).toBe(LiveHero)
    expect(inner.props.title).toBe('Hi')
  })

  it('never mistakes the built-in ScreenFlow system for a live-bundle candidate', () => {
    // Passing a `live` map keyed by ScreenFlow's own component ids must be a no-op —
    // the built-in system always uses its hand-written renderers.
    const reg = hydrateRegistry(SCREENFLOW_MANIFEST, { Button: LiveHero })
    expect(reg.get('Button')!.live).toBe(false)
    expect(reg.get('Button')!.generic).toBe(false)
  })
})
