import { describe, expect, it } from 'vitest'
import {
  defaultForProp,
  deriveDefaultProps,
  inferControl,
  isDesignSystemManifest,
  propLabel,
  rootContainerId,
  tokenCount,
  tokenNames,
  type DesignSystemManifest,
  type ManifestComponent,
  type ManifestProp,
} from './manifest'

function prop(p: Partial<ManifestProp>): ManifestProp {
  return { name: 'x', type: { name: 'string' }, required: false, ...p }
}

describe('inferControl (drives the PropertyControl factory — spec §8 Step 1)', () => {
  it('options → select, regardless of declared type', () => {
    expect(inferControl(prop({ options: ['a', 'b'] }))).toBe('select')
    expect(inferControl(prop({ type: { name: 'string' }, options: ['a'] }))).toBe('select')
  })

  it('boolean → boolean, number → number, string → text', () => {
    expect(inferControl(prop({ type: { name: 'boolean' } }))).toBe('boolean')
    expect(inferControl(prop({ type: { name: 'number' } }))).toBe('number')
    expect(inferControl(prop({ type: { name: 'string' } }))).toBe('text')
  })

  it('an explicit control hint wins', () => {
    expect(inferControl(prop({ type: { name: 'string' }, control: 'textarea' }))).toBe('textarea')
  })
})

describe('default props', () => {
  it('uses the declared default, else a type-appropriate zero', () => {
    expect(defaultForProp(prop({ defaultValue: 'md', options: ['sm', 'md'] }))).toBe('md')
    expect(defaultForProp(prop({ options: ['sm', 'md'] }))).toBe('sm')
    expect(defaultForProp(prop({ type: { name: 'boolean' } }))).toBe(false)
    expect(defaultForProp(prop({ type: { name: 'number' } }))).toBe(0)
    expect(defaultForProp(prop({ type: { name: 'string' } }))).toBe('')
  })

  it('deriveDefaultProps covers every declared prop', () => {
    const component: ManifestComponent = {
      id: 'C',
      name: 'C',
      description: '',
      acceptsChildren: false,
      props: {
        size: prop({ name: 'size', options: ['s', 'l'], defaultValue: 'l' }),
        on: prop({ name: 'on', type: { name: 'boolean' } }),
      },
    }
    expect(deriveDefaultProps(component)).toEqual({ size: 'l', on: false })
  })
})

describe('propLabel', () => {
  it('humanises camelCase and kebab/snake names', () => {
    expect(propLabel(prop({ name: 'helpText' }))).toBe('Help text')
    expect(propLabel(prop({ name: 'full_width' }))).toBe('Full width')
    expect(propLabel(prop({ name: 'label' }))).toBe('Label')
  })
})

describe('rootContainerId', () => {
  it('prefers a Stack, else the first container, else null', () => {
    const mk = (comps: Record<string, Partial<ManifestComponent>>) =>
      ({
        id: 'm',
        name: 'm',
        version: '1',
        tokens: { colors: {}, spacing: {}, typography: {} },
        components: Object.fromEntries(
          Object.entries(comps).map(([id, c]) => [
            id,
            { id, name: id, description: '', acceptsChildren: false, props: {}, ...c },
          ]),
        ),
      }) as Parameters<typeof rootContainerId>[0]

    expect(rootContainerId(mk({ Text: {}, Stack: { acceptsChildren: true } }))).toBe('Stack')
    expect(rootContainerId(mk({ Text: {}, Panel: { acceptsChildren: true } }))).toBe('Panel')
    expect(rootContainerId(mk({ Text: {}, Button: {} }))).toBeNull()
  })
})

describe('token helpers', () => {
  const manifest: DesignSystemManifest = {
    id: 'm',
    name: 'm',
    version: '1',
    tokens: {
      colors: { brand: '#000', ink: '#111' },
      spacing: { md: '16px' },
      typography: {},
      radius: { sm: '4px' },
    },
    components: { A: { id: 'A', name: 'A', description: '', acceptsChildren: false, props: {} } },
  }

  it('tokenNames lists a group; tokenCount sums all groups', () => {
    expect(tokenNames(manifest, 'colors')).toEqual(['brand', 'ink'])
    expect(tokenNames(manifest, 'shadow')).toEqual([])
    expect(tokenCount(manifest.tokens)).toBe(4)
  })
})

describe('isDesignSystemManifest', () => {
  it('accepts a minimal valid manifest and rejects junk', () => {
    expect(
      isDesignSystemManifest({
        id: 'm',
        name: 'm',
        version: '1',
        tokens: { colors: {}, spacing: {}, typography: {} },
        components: { A: { id: 'A', name: 'A', description: '', acceptsChildren: false, props: {} } },
      }),
    ).toBe(true)
    expect(isDesignSystemManifest({ id: 'm' })).toBe(false)
    expect(isDesignSystemManifest(null)).toBe(false)
  })
})
