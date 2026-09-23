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

// ---------------------------------------------------------------------------
// Test plan Phase 2 — the external importer (E2.1–E2.7,
// docs/test-plan-storybook-sot.md).
// ---------------------------------------------------------------------------

import COMPONENTS_MANIFEST from './__fixtures__/components-manifest.json'
import { parseStorybookDocgenWithReport } from './storybook-adapter'
import { validateBlueprintAgainstManifest, compileManifestSchemas } from './manifest-zod'

describe('Phase 2 — importing an external Storybook', () => {
  const { manifest, warnings } = parseStorybookDocgenWithReport(COMPONENTS_MANIFEST, { name: 'Fixture kit' })
  const warned = (component: string, prop?: string) =>
    warnings.filter((w) => w.component === component && (prop === undefined || w.prop === prop))

  it('E2.1 — Storybook 10 manifests/components.json becomes a schema-valid manifest', () => {
    expect(manifestZodSchema.safeParse(manifest).success).toBe(true)
    // Subcomponents come in as components of their own.
    expect(Object.keys(manifest.components)).toEqual(
      expect.arrayContaining(['ContentCard', 'ContentCardHeader', 'ContentCardBody', 'ContentCardFooter', 'LabelVideo']),
    )
    // Literal unions, including Extract<…> around them, become the option list.
    expect(manifest.components.ContentCard.props.interactionState.options).toEqual(['default', 'focus'])
    expect(manifest.components.LabelVideo.props.kind.options).toEqual(['live', 'replay'])
    expect(manifest.components.ContentCard.props.height).toMatchObject({ type: { name: 'number' }, defaultValue: 440 })
    expect(manifest.components.ContentCard.acceptsChildren).toBe(true)
    expect(manifest.components.ContentCardHeader.props.title.description).not.toBe('')
  })

  it('E2.1 — what it could not take is reported, not silently lost', () => {
    // A story with no documentable component.
    expect(warned('Template')[0]?.message).toMatch(/skipped — No component file found/)
    // Two different components share the name "Button".
    expect(warned('Button').some((w) => /second component named "Button"/.test(w.message))).toBe(true)
    // Discriminated-union props react-docgen cannot read.
    expect(warned('TableCell')[0]?.message).toMatch(/documents no props/)
  })

  it('E2.2 — Storybook argTypes give the same component as the docgen export', () => {
    const fromArgTypes = parseStorybookDocgen({
      components: {
        LabelVideo: {
          displayName: 'LabelVideo',
          argTypes: {
            kind: { options: ['live', 'replay'], control: 'select', table: { defaultValue: { summary: "'live'" } } },
            mini: { type: { name: 'boolean' } },
          },
        },
      },
    })
    expect(fromArgTypes.components.LabelVideo.props.kind.options).toEqual(manifest.components.LabelVideo.props.kind.options)
    expect(fromArgTypes.components.LabelVideo.props.mini.type.name).toBe(manifest.components.LabelVideo.props.mini.type.name)
  })

  it('E2.3 — DOM props inherited from node_modules types are dropped, with a warning', () => {
    const report = parseStorybookDocgenWithReport({
      components: {
        Chip: {
          displayName: 'Chip',
          props: {
            tone: { tsType: { name: 'union', elements: [{ name: 'literal', value: "'info'" }, { name: 'literal', value: "'warn'" }] } },
            onMouseEnter: {
              tsType: { name: 'signature', type: 'function', raw: '() => void' },
              parent: { fileName: 'node_modules/@types/react/index.d.ts', name: 'DOMAttributes' },
            },
            'aria-label': {
              tsType: { name: 'string' },
              declarations: [{ fileName: 'node_modules/@types/react/index.d.ts', name: 'AriaAttributes' }],
            },
          },
        },
      },
    })
    expect(Object.keys(report.manifest.components.Chip.props)).toEqual(['tone'])
    expect(report.warnings.map((w) => w.prop).sort()).toEqual(['aria-label', 'onMouseEnter'])
  })

  it('E2.4 — a prop with no literal values is accepted as free text, with a warning — not rejected', () => {
    const report = parseStorybookDocgenWithReport({
      components: {
        Badge: {
          displayName: 'Badge',
          props: {
            variant: { tsType: { name: 'union', raw: "'a' | string", elements: [{ name: 'literal', value: "'a'" }, { name: 'string' }] } },
            tone: { tsType: { name: 'BadgeTone' } },
            label: { tsType: { name: 'string' } },
          },
        },
      },
    })
    const props = report.manifest.components.Badge.props
    expect(props.variant).toMatchObject({ type: { name: 'string' } })
    expect(props.variant.options).toBeUndefined()
    expect(props.tone.options).toBeUndefined()
    expect(report.warnings.map((w) => w.prop).sort()).toEqual(['tone', 'variant'])
    // A plain string is typed as intended — nothing to warn about.
    expect(report.warnings.some((w) => w.prop === 'label')).toBe(false)
  })

  it('E2.5 — a payload with no components throws a readable error', () => {
    expect(() => parseStorybookDocgen({ components: {} })).toThrow(/No component definitions found/)
    expect(() => parseStorybookDocgen('not json at all')).toThrow(/No component definitions found/)
  })

  it('E2.6 — a docs or index file says which file to import instead', () => {
    expect(() => parseStorybookDocgen({ v: 5, entries: {} })).toThrow(/Import manifests\/components\.json instead/)
  })

  it('E2.7 — the imported manifest compiles, and holds a Blueprint to its own components', () => {
    expect(Object.keys(compileManifestSchemas(manifest))).toContain('ContentCard')
    // The layer rule (Camadas) holds for an imported system too, so the screen names its model.
    const screen = { model: 'interactivity-cards-right', level: 3 }
    const own = {
      version: 1,
      screen,
      root: {
        type: 'ContentCard',
        props: { interactionState: 'focus', height: 440 },
        children: [{ type: 'ContentCardHeader', props: { title: 'Estatísticas' } }],
      },
    }
    const result = validateBlueprintAgainstManifest(own, manifest)
    expect(result.ok ? [] : result.errors).toEqual([])

    const offCatalog = { version: 1, screen, root: { type: 'ContentCard', props: { interactionState: 'selected' } } }
    const offResult = validateBlueprintAgainstManifest(offCatalog, manifest)
    expect(offResult.ok ? '' : offResult.errors.join('\n')).toMatch(/interactionState/)
    const builtInOnly = { version: 1, screen, root: { type: 'MainMenu' } }
    const builtInResult = validateBlueprintAgainstManifest(builtInOnly, manifest)
    expect(builtInResult.ok ? '' : builtInResult.errors.join('\n')).toMatch(/MainMenu/)
  })
})
