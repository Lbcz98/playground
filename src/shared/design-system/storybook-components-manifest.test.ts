import { describe, expect, it } from 'vitest'
import COMPONENTS_MANIFEST from './__fixtures__/components-manifest.json'
import {
  componentsOf,
  isComponentsManifest,
  literalOptions,
  readDocgenProp,
  snapshotFromStorybook,
  unquoteLiteral,
} from './storybook-components-manifest'

const lit = (value: string) => ({ name: 'literal', value: `'${value}'` })
const union = (...values: string[]) => ({ name: 'union', elements: values.map(lit) })

describe('literalOptions', () => {
  it('reads a literal union in source order', () => {
    expect(literalOptions(union('live', 'replay'))).toEqual(['live', 'replay'])
  })

  it('ignores null and undefined members — they make a prop optional, not an option', () => {
    expect(literalOptions({ name: 'union', elements: [lit('a'), { name: 'null' }, { name: 'undefined' }] })).toEqual(['a'])
  })

  it('resolves Extract and Exclude around literal unions', () => {
    const states = union('default', 'focus', 'selected', 'loading', 'disabled')
    expect(literalOptions({ name: 'Extract', elements: [states, union('default', 'focus')] })).toEqual(['default', 'focus'])
    expect(literalOptions({ name: 'Exclude', elements: [states, union('loading', 'disabled')] })).toEqual([
      'default',
      'focus',
      'selected',
    ])
  })

  it('reads the PropTypes oneOf shape', () => {
    expect(literalOptions({ name: 'enum', value: [{ value: "'sm'" }, { value: "'lg'" }] })).toEqual(['sm', 'lg'])
  })

  it('gives up on anything that is not all literals', () => {
    expect(literalOptions({ name: 'union', elements: [lit('a'), { name: 'string' }] })).toBeNull()
    expect(literalOptions({ name: 'Exclude', elements: [{ name: 'unknown' }, union('md')] })).toBeNull()
    expect(literalOptions({ name: 'SpacingStep' })).toBeNull()
  })
})

describe('unquoteLiteral', () => {
  it('strips the quotes and reads the escapes, as the string itself', () => {
    expect(unquoteLiteral("'Paredão formado!\\nVote agora'")).toBe('Paredão formado!\nVote agora')
    expect(unquoteLiteral(String.raw`'it\'s'`)).toBe("it's")
    expect(unquoteLiteral('440')).toBe('440')
  })
})

describe('readDocgenProp', () => {
  it('classifies the type, strips default quotes, and flags deprecated aliases', () => {
    expect(
      readDocgenProp({
        tsType: union('a', 'b'),
        defaultValue: { value: "'a'" },
        description: '@deprecated Use `tone`.',
      }),
    ).toEqual({ type: 'union', kind: 'enum', options: ['a', 'b'], required: false, defaultValue: 'a', description: '@deprecated Use `tone`.', deprecated: true })
    expect(readDocgenProp({ tsType: { name: 'signature', type: 'object', raw: '{ a: string }' } })?.kind).toBe('object')
    expect(readDocgenProp({ tsType: { name: 'signature', type: 'function', raw: '() => void' } })?.kind).toBe('function')
  })
})

describe('the Storybook components manifest', () => {
  it('is told apart from a docgen map or argTypes', () => {
    expect(isComponentsManifest(COMPONENTS_MANIFEST)).toBe(true)
    expect(isComponentsManifest({ components: { Button: { props: {} } } })).toBe(false)
  })

  it('flattens subcomponents in after their parent', () => {
    const names = componentsOf(COMPONENTS_MANIFEST).map((c) => c.name)
    expect(names.indexOf('ContentCardHeader')).toBeGreaterThan(names.indexOf('ContentCard'))
  })

  it('snapshots deterministically, with stories grouped by component and no absolute paths', () => {
    const index = {
      v: 5,
      entries: {
        'ui-kit-content-card--focus': { type: 'story', id: 'ui-kit-content-card--focus', title: 'UI Kit/Content Card' },
        'ui-kit-content-card--default': { type: 'story', id: 'ui-kit-content-card--default', title: 'UI Kit/Content Card' },
        'ui-kit-content-card--docs': { type: 'docs', id: 'ui-kit-content-card--docs', title: 'UI Kit/Content Card' },
      },
    }
    const a = snapshotFromStorybook(index, COMPONENTS_MANIFEST)
    expect(JSON.stringify(a)).toBe(JSON.stringify(snapshotFromStorybook(index, COMPONENTS_MANIFEST)))
    expect(a.components['ui-kit-content-card'].stories).toEqual(['ui-kit-content-card--default', 'ui-kit-content-card--focus'])
    expect(a.components['templates-screens'].error).toMatch(/No component file found/)
    expect(JSON.stringify(a)).not.toMatch(/\/Users\//)
  })

  it('refuses a file that is not a components manifest', () => {
    expect(() => snapshotFromStorybook({}, { v: 5, entries: {} })).toThrow(/componentsManifest/)
  })
})
