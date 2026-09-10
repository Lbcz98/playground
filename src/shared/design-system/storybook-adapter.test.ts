import { describe, expect, it } from 'vitest'
import { parseStorybookDocgen } from './storybook-adapter'
import { manifestZodSchema } from './manifest'

/**
 * A mock Storybook / react-docgen extraction for a Button + a Card, mixed in with
 * story metadata that the adapter must ignore.
 */
const STORYBOOK_PAYLOAD = {
  name: 'Acme UI',
  version: '2.4.0',
  components: {
    Button: {
      displayName: 'Button',
      description: 'Primary call-to-action.',
      props: {
        variant: {
          required: false,
          description: 'Visual style',
          defaultValue: { value: "'primary'", computed: false },
          type: {
            name: 'enum',
            value: [{ value: "'primary'" }, { value: "'secondary'" }, { value: "'ghost'" }],
          },
        },
        size: {
          required: false,
          defaultValue: { value: "'md'" },
          type: { name: 'enum', value: [{ value: "'sm'" }, { value: "'md'" }, { value: "'lg'" }] },
        },
        disabled: {
          required: false,
          defaultValue: { value: 'false' },
          type: { name: 'bool' },
        },
        label: {
          required: true,
          type: { name: 'string' },
        },
        onClick: {
          required: false,
          type: { name: 'func' },
        },
      },
    },
    Card: {
      displayName: 'Card',
      description: 'A surface container.',
      props: {
        elevation: {
          required: false,
          defaultValue: { value: '1' },
          type: { name: 'number' },
        },
        children: {
          required: false,
          type: { name: 'node' },
        },
      },
    },
    // Story metadata — no prop schema. Must be dropped.
    'button--primary': {
      parameters: { fileName: './Button.stories.tsx' },
      storyFn: '[Function]',
    },
  },
}

describe('parseStorybookDocgen', () => {
  const manifest = parseStorybookDocgen(STORYBOOK_PAYLOAD)

  it('produces a schema-valid manifest', () => {
    expect(manifestZodSchema.safeParse(manifest).success).toBe(true)
  })

  it('carries identity from the payload', () => {
    expect(manifest.name).toBe('Acme UI')
    expect(manifest.version).toBe('2.4.0')
    expect(manifest.id).toBe('acme-ui')
  })

  it('keeps component definitions and drops story metadata', () => {
    expect(Object.keys(manifest.components).sort()).toEqual(['Button', 'Card'])
  })

  it('captures variant enums as `options` (the critical bit)', () => {
    expect(manifest.components.Button.props.variant.options).toEqual([
      'primary',
      'secondary',
      'ghost',
    ])
    expect(manifest.components.Button.props.size.options).toEqual(['sm', 'md', 'lg'])
  })

  it('normalises prop types and defaults', () => {
    const p = manifest.components.Button.props
    expect(p.variant.type.name).toBe('enum')
    expect(p.variant.defaultValue).toBe('primary')
    expect(p.disabled.type.name).toBe('boolean')
    expect(p.disabled.defaultValue).toBe(false)
    expect(p.label.required).toBe(true)
    expect(p.label.type.name).toBe('string')
  })

  it('coerces numeric defaults and detects the children slot', () => {
    expect(manifest.components.Card.props.elevation.type.name).toBe('number')
    expect(manifest.components.Card.props.elevation.defaultValue).toBe(1)
    expect(manifest.components.Card.acceptsChildren).toBe(true)
    expect(manifest.components.Button.acceptsChildren).toBe(false)
  })

  it('reads the Storybook argTypes shape too', () => {
    const m = parseStorybookDocgen(
      {
        components: {
          Badge: {
            name: 'Badge',
            argTypes: {
              tone: {
                options: ['info', 'warn', 'error'],
                control: { type: 'select' },
                table: { defaultValue: { summary: 'info' } },
                type: { name: 'string', required: false },
              },
            },
          },
        },
      },
      { id: 'acme', name: 'Acme', version: '1.0.0' },
    )
    expect(m.components.Badge.props.tone.options).toEqual(['info', 'warn', 'error'])
    expect(m.components.Badge.props.tone.defaultValue).toBe('info')
  })

  it('throws when there are no component definitions', () => {
    expect(() => parseStorybookDocgen({ stories: { 'x--y': {} } })).toThrow(/No component definitions/)
  })

  it('infers tokenGroup for token-typed props by name', () => {
    const m = parseStorybookDocgen({
      components: {
        Box: {
          displayName: 'Box',
          props: {
            background: { type: { name: 'string' }, required: false },
            padding: { type: { name: 'string' }, required: false },
            cornerRadius: { type: { name: 'string' }, required: false },
            label: { type: { name: 'string' }, required: false },
            count: { type: { name: 'number' }, required: false },
          },
        },
      },
    })
    const p = m.components.Box.props
    expect(p.background.tokenGroup).toBe('colors')
    expect(p.padding.tokenGroup).toBe('spacing')
    expect(p.cornerRadius.tokenGroup).toBe('radius')
    expect(p.label.tokenGroup).toBeUndefined()
    expect(p.count.tokenGroup).toBeUndefined()
  })

  it('ingests design tokens carried in the same JSON', () => {
    const m = parseStorybookDocgen({
      name: 'Toked',
      components: { Btn: { displayName: 'Btn', props: {} } },
      tokens: {
        color: { $type: 'color', brand: { $value: '#0055ff' } },
        space: { $type: 'dimension', md: { $value: '16px' } },
      },
    })
    expect(m.tokens.colors).toEqual({ brand: '#0055ff' })
    expect(m.tokens.spacing).toEqual({ md: '16px' })
  })
})
