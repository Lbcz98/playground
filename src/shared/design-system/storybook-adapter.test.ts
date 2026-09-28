import { describe, expect, it } from 'vitest'
import { manifestZodSchema } from './manifest'
import { templatesFor } from '@/design-system/promptSpec'
import { chooseTemplate } from '@/shared/templates'

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

describe('parseStorybookDocgenWithReport', () => {
  const manifest = parseStorybookDocgenWithReport(STORYBOOK_PAYLOAD).manifest

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
    const m = parseStorybookDocgenWithReport(
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
    ).manifest
    expect(m.components.Badge.props.tone.options).toEqual(['info', 'warn', 'error'])
    expect(m.components.Badge.props.tone.defaultValue).toBe('info')
  })

  it('throws when there are no component definitions', () => {
    expect(() => parseStorybookDocgenWithReport({ stories: { 'x--y': {} } }).manifest).toThrow(/No component definitions/)
  })

  it('infers tokenGroup for token-typed props by name', () => {
    const m = parseStorybookDocgenWithReport({
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
    }).manifest
    const p = m.components.Box.props
    expect(p.background.tokenGroup).toBe('colors')
    expect(p.padding.tokenGroup).toBe('spacing')
    expect(p.cornerRadius.tokenGroup).toBe('radius')
    expect(p.label.tokenGroup).toBeUndefined()
    expect(p.count.tokenGroup).toBeUndefined()
  })

  it('ingests design tokens carried in the same JSON', () => {
    const m = parseStorybookDocgenWithReport({
      name: 'Toked',
      components: { Btn: { displayName: 'Btn', props: {} } },
      tokens: {
        color: { $type: 'color', brand: { $value: '#0055ff' } },
        space: { $type: 'dimension', md: { $value: '16px' } },
      },
    }).manifest
    expect(m.tokens.colors).toEqual({ brand: '#0055ff' })
    expect(m.tokens.spacing).toEqual({ md: '16px' })
  })
})

// ---------------------------------------------------------------------------
// Test plan Phase 2 — the external importer (E2.1–E2.7,
// docs/test-plan-storybook-sot.md).
// ---------------------------------------------------------------------------

import COMPONENTS_MANIFEST from './__fixtures__/components-manifest.json'
import { documentedRange, parseStorybookDocgenWithReport } from './storybook-adapter'
import { validateBlueprintAgainstManifest, compileManifestSchemas } from './manifest-zod'
import { buildPlannerPrompt, buildSystemPrompt } from '@/design-system/promptSpec'
import { interpretBlueprint } from '@/interpreter/interpret'

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
    // Two different components share the name "Button": both kept, each named by its story.
    expect(manifest.components).toHaveProperty('PrimitivesButton')
    expect(manifest.components).toHaveProperty('UiKitButton')
    expect(manifest.components).not.toHaveProperty('Button')
    expect(manifest.components.UiKitButton.props).toHaveProperty('live')
    expect(warned('UiKitButton')[0]?.message).toMatch(/more than one component is named "Button"/)
    // Discriminated-union props react-docgen cannot read.
    expect(warned('TableCell')[0]?.message).toMatch(/documents no props/)
  })

  it('E2.2 — Storybook argTypes give the same component as the docgen export', () => {
    const fromArgTypes = parseStorybookDocgenWithReport({
      components: {
        LabelVideo: {
          displayName: 'LabelVideo',
          argTypes: {
            kind: { options: ['live', 'replay'], control: 'select', table: { defaultValue: { summary: "'live'" } } },
            mini: { type: { name: 'boolean' } },
          },
        },
      },
    }).manifest
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
    // A type docgen only knows by name could be an object: a string there would
    // break the component, so it is left out rather than guessed at.
    expect(props.tone).toBeUndefined()
    expect(report.warnings.find((w) => w.prop === 'tone')?.message).toMatch(/can't expand/)
    expect(report.warnings.map((w) => w.prop).sort()).toEqual(['tone', 'variant'])
    // A plain string is typed as intended — nothing to warn about.
    expect(report.warnings.some((w) => w.prop === 'label')).toBe(false)
  })

  it('E2.8 — tokens carried in the export that the parse leaves out are reported too', () => {
    const report = parseStorybookDocgenWithReport({
      components: { Chip: { displayName: 'Chip', props: { label: { tsType: { name: 'string' } } } } },
      tokens: { color: { $type: 'color', brand: { $value: '#0055ff' }, accent: { $value: '{color.gone}' } } },
    })
    expect(report.manifest.tokens.colors).toEqual({ brand: '#0055ff' })
    expect(report.warnings).toEqual([
      { component: 'tokens', prop: 'color.accent', message: expect.stringMatching(/\{color\.gone\} points at no token/) },
    ])
  })

  it('E2.9 — scale steps a prop names (gap "lg") are measured through their core token', () => {
    const report = parseStorybookDocgenWithReport({
      components: {
        Stack: {
          displayName: 'Stack',
          props: {
            gap: { tsType: { name: 'union', elements: ['none', 'sm', 'lg', 'huge'].map((v) => ({ name: 'literal', value: `'${v}'` })) } },
            children: { tsType: { name: 'ReactNode' } },
          },
        },
      },
      tokens: {
        dimension: {
          $type: 'dimension',
          spacing: {
            core: { none: { $value: '0px' }, sm: { $value: '16px' }, lg: { $value: '24px' } },
            semantic: { 'card-lg': { $value: '{dimension.spacing.core.lg}' } },
          },
        },
      },
    })
    const spacing = report.manifest.tokens.spacing
    expect(spacing).toMatchObject({ none: '0px', sm: '16px', lg: '24px' })
    expect(report.warnings).toContainEqual({
      component: 'tokens',
      prop: 'spacing.huge',
      message: expect.stringMatching(/names no spacing token/),
    })
  })

  it('E2.10 — event handlers and deprecated aliases are dropped, with a warning', () => {
    const report = parseStorybookDocgenWithReport({
      components: {
        Chip: {
          displayName: 'Chip',
          props: {
            label: { tsType: { name: 'string' } },
            onClick: { tsType: { name: 'signature', type: 'function', raw: '() => void' } },
            state: { tsType: { name: 'string' }, description: '@deprecated Use `interactionState`.' },
          },
        },
      },
    })
    expect(Object.keys(report.manifest.components.Chip.props)).toEqual(['label'])
    expect(report.warnings.map((w) => [w.prop, w.message])).toEqual([
      ['onClick', expect.stringMatching(/event handler/)],
      ['state', expect.stringMatching(/@deprecated/)],
    ])
  })

  it('E2.11 — a list of text comes in as a list; any other list or an object is left out', () => {
    const str = { name: 'string' }
    const report = parseStorybookDocgenWithReport({
      components: {
        Row: {
          displayName: 'Row',
          props: {
            stats: { tsType: { name: 'Array', elements: [str], raw: 'string[]' } },
            values: { tsType: { name: 'tuple', elements: [str, str], raw: '[string, string]' }, description: 'The two sides, left and right.' },
            items: { tsType: { name: 'Array', elements: [{ name: 'MenuItem' }], raw: 'MenuItem[]' } },
            ad: { tsType: { name: 'signature', type: 'object', raw: '{ label: string }' } },
          },
        },
      },
    })
    const { props } = report.manifest.components.Row
    expect(Object.keys(props).sort()).toEqual(['stats', 'values'])
    expect(props.stats).toMatchObject({ type: { name: 'array' } })
    expect(props.values).toMatchObject({ type: { name: 'array' }, min: 2, max: 2 })
    expect(report.warnings.map((w) => w.prop).sort()).toEqual(['ad', 'items'])

    // The validator holds a list prop to a list of text, and a tuple to its length.
    const doc = (rowProps: Record<string, unknown>) => ({
      version: 1,
      screen: { model: 'interactivity-cards-right', level: 3 },
      root: { type: 'Row', props: rowProps },
    })
    const errors = (rowProps: Record<string, unknown>) => {
      const v = validateBlueprintAgainstManifest(doc(rowProps), report.manifest)
      return v.ok ? '' : v.errors.join(' | ')
    }
    expect(errors({ stats: ['Pts', 'J'], values: ['62%', '38%'] })).not.toMatch(/stats|values/)
    expect(errors({ stats: 'Pts / J' })).toMatch(/stats/)
    expect(errors({ values: ['62%'] })).toMatch(/values/)

    // And the prompt says so, with what the prop is for.
    const line = buildSystemPrompt('tool', report.manifest).split('\n').find((l) => l.includes('- values:'))
    expect(line).toMatch(/a JSON array of strings, exactly 2 \(default undefined\) — The two sides, left and right\./)
  })

  it('E2.11c — a number prop\'s documented range becomes limits the validator enforces', () => {
    expect(documentedRange('Total height in px, from `48` to `456` in steps of `8` (the grid).')).toEqual({ min: 48, max: 456, step: 8 })
    expect(documentedRange('Goals scored.')).toEqual({})
    const { manifest } = parseStorybookDocgenWithReport({
      components: {
        Card: {
          displayName: 'Card',
          props: { height: { tsType: { name: 'number' }, description: 'Total height in px, from `48` to `456` in steps of `8`.' } },
        },
      },
    })
    expect(manifest.components.Card.props.height).toMatchObject({ min: 48, max: 456, step: 8 })
    const errors = (height: number) => {
      const v = validateBlueprintAgainstManifest(
        { version: 1, screen: { model: 'interactivity-cards-right', level: 3 }, root: { type: 'Card', props: { height } } },
        manifest,
      )
      return v.ok ? '' : v.errors.join(' | ')
    }
    // The audit's runs asked for 600 and 640; the card silently clamped both to 456.
    expect(errors(640)).toMatch(/height/)
    expect(errors(452)).toMatch(/height/) // off the 8pt step
    expect(errors(456)).not.toMatch(/height/)
  })

  it('E2.11d — a gap "on the 8pt scale" takes any typed number on the scale, and nothing off it', () => {
    const { manifest } = parseStorybookDocgenWithReport({
      components: {
        Body: {
          displayName: 'Body',
          props: { gap: { tsType: { name: 'number' }, description: 'Space between rows in px, from `0` to `40`, on the 8pt\nscale: a multiple of 8, or 4 or 12.' } },
        },
      },
    })
    expect(manifest.components.Body.props.gap).toMatchObject({ min: 0, max: 40, grid: true })
    const errors = (gap: number) => {
      const v = validateBlueprintAgainstManifest(
        { version: 1, screen: { model: 'interactivity-cards-right', level: 3 }, root: { type: 'Body', props: { gap } } },
        manifest,
      )
      return v.ok ? '' : v.errors.join(' | ')
    }
    for (const ok of [0, 4, 8, 12, 16, 24, 32, 40]) expect(errors(ok), `${ok}`).not.toMatch(/gap/)
    for (const off of [5, 10, 20, 28]) expect(errors(off), `${off}`).toMatch(/gap.*8pt scale/)
    expect(errors(48)).toMatch(/gap/) // past the range
    const line = buildSystemPrompt('tool', manifest).split('\n').find((l) => l.includes('- gap:'))
    expect(line).toMatch(/from 0 to 40 on the 8pt scale/)
  })

  it('E2.11b — a list of text-only objects comes in with its fields; the validator and prompt know them', () => {
    const str = (required: boolean) => ({ name: 'string', required })
    const item = {
      name: 'signature',
      type: 'object',
      raw: '{ title: string; subtitle?: string }',
      signature: { properties: [{ key: 'title', value: str(true) }, { key: 'subtitle', value: str(false) }] },
    }
    const report = parseStorybookDocgenWithReport({
      components: {
        Menu: {
          displayName: 'Menu',
          props: {
            items: { tsType: { name: 'Array', elements: [item], raw: '{ title: string; subtitle?: string }[]' } },
            // A field that is not text has no Blueprint shape yet.
            links: {
              tsType: { name: 'Array', elements: [{ ...item, signature: { properties: [{ key: 'go', value: { name: 'signature', type: 'function' } }] } }] },
            },
          },
        },
      },
    })
    const { props } = report.manifest.components.Menu
    expect(Object.keys(props)).toEqual(['items'])
    expect(props.items.fields).toMatchObject({ title: { required: true }, subtitle: { required: false } })
    expect(manifestZodSchema.safeParse(report.manifest).success).toBe(true)

    const errors = (items: unknown) => {
      const v = validateBlueprintAgainstManifest(
        { version: 1, screen: { model: 'interactivity-cards-right', level: 3 }, root: { type: 'Menu', props: { items } } },
        report.manifest,
      )
      return v.ok ? '' : v.errors.join(' | ')
    }
    expect(errors([{ title: 'Previsão do tempo', subtitle: 'São Paulo, SP' }, { title: 'Brasileirão' }])).not.toMatch(/items/)
    expect(errors([{ subtitle: 'no title' }])).toMatch(/items/)
    expect(errors([{ title: 'x', extra: 'y' }])).toMatch(/items/)
    expect(errors(['a string'])).toMatch(/items/)

    const line = buildSystemPrompt('tool', report.manifest).split('\n').find((l) => l.includes('- items:'))
    expect(line).toMatch(/a JSON array of objects \{ title: string, subtitle\?: string \}/)

    // The planner reads no props, so it is told the list exists.
    const brief = buildPlannerPrompt(report.manifest).split('\n').find((l) => l.includes('<Menu>'))
    expect(brief).toMatch(/Lists: items \(\{title, subtitle\?\} items\)/)
  })

  it('E2.12 — a component\'s words go in its children prop; text where the child nodes go is caught', () => {
    const { manifest: m } = parseStorybookDocgenWithReport({
      components: {
        Stack: { displayName: 'Stack', props: { children: { tsType: { name: 'ReactNode' } } } },
        Label: { displayName: 'Label', props: { children: { tsType: { name: 'ReactNode' }, description: 'The words.' } } },
      },
    })
    const doc = (label: Record<string, unknown>) => ({
      version: 1,
      screen: { model: 'interactivity-cards-right', level: 3 },
      root: { type: 'Stack', children: [{ type: 'Label', ...label }] },
    })
    const misplaced = doc({ children: 'Ao vivo' })
    const v = validateBlueprintAgainstManifest(misplaced, m)
    expect(v.ok ? '' : v.errors.join(' | ')).toMatch(/"children" is a list of nodes.*set "props": \{ "children": "Ao vivo" \}/)

    const repaired = interpretBlueprint(misplaced, m)
    expect(repaired.ok && repaired.tree.children[0].props.children).toBe('Ao vivo')
    expect(repaired.issues.map((i) => i.message)).toContain(`Moved the text in "children" into <Label>'s children prop.`)

    expect(validateBlueprintAgainstManifest(doc({ props: { children: 'Ao vivo' } }), m).ok).toBe(true)
    expect(buildSystemPrompt('tool', m)).toMatch(/\*\*Text as children:\*\* a component that shows words .* takes them in that prop/)
  })

  it('E2.13 — a nullable focus prop and a documented default reach the one-focus rule', () => {
    const lit = (v: string) => ({ name: 'literal', value: `'${v}'` })
    const { manifest: m } = parseStorybookDocgenWithReport({
      components: {
        Stack: { displayName: 'Stack', props: { children: { tsType: { name: 'ReactNode' } } } },
        Menu: {
          displayName: 'Menu',
          props: {
            focusedItem: {
              tsType: { name: 'union', raw: "'program' | 'weather' | null", elements: [lit('program'), lit('weather'), { name: 'null' }] },
              description: '`null` = focus is elsewhere. Default `program`.',
            },
          },
        },
        Card: {
          displayName: 'Card',
          props: { interactionState: { tsType: { name: 'union', elements: [lit('default'), lit('focus')] }, description: 'Default `focus`.' } },
        },
      },
    })
    expect(m.components.Menu.props.focusedItem).toMatchObject({ nullable: true, defaultValue: 'program', options: ['program', 'weather'] })
    expect(m.components.Card.props.interactionState.defaultValue).toBe('focus')

    const doc = (menu: Record<string, unknown>) => ({
      version: 1,
      screen: { model: 'home', level: 1 },
      root: { type: 'Stack', children: [{ type: 'Card', props: { interactionState: 'focus' } }, { type: 'Menu', props: menu }] },
    })
    // Left unset, the menu focuses "program" — two focused elements, and the fix is null.
    const twice = validateBlueprintAgainstManifest(doc({}), m)
    expect(twice.ok ? '' : twice.errors.join(' | ')).toMatch(/focusedItem null/)
    const rested = validateBlueprintAgainstManifest(doc({ focusedItem: null }), m)
    expect(rested.ok ? [] : rested.errors.filter((e) => /focus/.test(e))).toEqual([])

    const prompt = buildSystemPrompt('tool', m)
    expect(prompt).toMatch(/- focusedItem: one of \[program, weather\] or null/)
    expect(prompt).toMatch(/<Menu> focuses its "program" unless you set focusedItem null/)
  })

  it('E2.5 — a payload with no components throws a readable error', () => {
    expect(() => parseStorybookDocgenWithReport({ components: {} }).manifest).toThrow(/No component definitions found/)
    expect(() => parseStorybookDocgenWithReport('not json at all').manifest).toThrow(/No component definitions found/)
  })

  it('E2.14 — an export can carry its own reference screens, each held to its own manifest', () => {
    const dtv = {
      components: {
        Stack: { displayName: 'Stack', props: { children: { tsType: { name: 'ReactNode' } } } },
      },
      templates: [
        {
          id: 'home',
          name: 'Home',
          when: 'The home screen.',
          blueprint: { version: 1, screen: { model: 'home', level: 1 }, root: { type: 'Stack' } },
        },
        // Malformed — missing `when`.
        { id: 'broken', name: 'Broken', blueprint: { version: 1, root: { type: 'Stack' } } },
        // A second "home" — kept the first.
        { id: 'home', name: 'Home again', when: 'Also the home screen.', blueprint: { version: 1, root: { type: 'Stack' } } },
        // Fails validation against its own manifest — no such component.
        {
          id: 'no-such-component',
          name: 'Ghost',
          when: 'Never matches.',
          blueprint: { version: 1, screen: { model: 'home', level: 1 }, root: { type: 'Ghost' } },
        },
      ],
    }
    const { manifest: m, warnings } = parseStorybookDocgenWithReport(dtv, { id: 'dtv', name: 'DTV' })
    expect(m.templates?.map((t) => t.id)).toEqual(['home'])
    expect(warnings.filter((w) => w.component === 'templates').map((w) => w.prop)).toEqual([
      'broken',
      'home',
      'no-such-component',
    ])

    // It reaches the planner and the retry loop exactly like the built-in ones.
    expect(templatesFor(m)).toEqual(m.templates)
    const choice = chooseTemplate('Template: home', templatesFor(m))
    expect(choice).toEqual({ template: m.templates![0], reason: 'named' })
  })

  it('E2.6 — a docs or index file says which file to import instead', () => {
    expect(() => parseStorybookDocgenWithReport({ v: 5, entries: {} }).manifest).toThrow(/Import manifests\/components\.json instead/)
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
