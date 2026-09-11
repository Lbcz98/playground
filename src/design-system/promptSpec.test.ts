import { describe, expect, it } from 'vitest'
import { buildPlannerPrompt, buildSystemPrompt, getRegistrySpec } from './promptSpec'
import { CATALOG_TYPES, getCatalogEntry } from './catalog'
import { RENDER_TOOL_NAME } from '@/shared/blueprint'
import type { DesignSystemManifest } from '@/shared/design-system/manifest'

describe('registry spec / system prompt', () => {
  it('describes every catalog component and no others', () => {
    const spec = getRegistrySpec()
    expect(spec.map((c) => c.type).sort()).toEqual([...CATALOG_TYPES].sort())
  })

  it('lists every prop with its allowed values', () => {
    const stack = getRegistrySpec().find((c) => c.type === 'Stack')!
    const gap = stack.props.find((p) => p.name === 'gap')!
    expect(gap.control).toBe('select')
    expect(gap.options).toContain('md')
    expect(gap.default).toBe('md')
  })

  it('system prompt names the tool, every component, and every select value', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain(RENDER_TOOL_NAME)
    expect(prompt.toLowerCase()).toContain('no absolute positioning')

    for (const type of CATALOG_TYPES) {
      expect(prompt).toContain(`<${type}>`)
      const entry = getCatalogEntry(type)!
      for (const control of Object.values(entry.controls)) {
        if (control.kind === 'select') {
          for (const option of control.options) {
            expect(prompt, `prompt should mention ${type}.${control.label} option "${option}"`).toContain(
              option,
            )
          }
        }
      }
    }
  })

  it('does not mention any component outside the registry', () => {
    const prompt = buildSystemPrompt()
    for (const ghost of ['<Carousel>', '<Grid>', '<Image>', '<Card>', '<Row>', '<Column>']) {
      expect(prompt).not.toContain(ghost)
    }
  })

  it('planner prompt carries the Product Blueprint (a11y + patterns) and every component', () => {
    const p = buildPlannerPrompt()
    expect(p).toMatch(/PLANNER/)
    expect(p).toMatch(/Accessibility rules/)
    expect(p.toLowerCase()).toContain('heading hierarchy')
    expect(p).toMatch(/Common layout patterns/)
    for (const type of CATALOG_TYPES) expect(p).toContain(`<${type}>`)
    // it must NOT ask for JSON
    expect(p).not.toContain(RENDER_TOOL_NAME)
  })
})

describe('Phase 7B — token vocabulary for imported systems', () => {
  const MANIFEST: DesignSystemManifest = {
    id: 'acme',
    name: 'Acme',
    version: '1.0.0',
    tokens: {
      colors: { brand: '#2f6bff', ink: '#111' },
      spacing: { sm: '8px', md: '16px' },
      typography: {},
      radius: { lg: '16px' },
    },
    components: {
      Panel: {
        id: 'Panel',
        name: 'Panel',
        description: 'a container',
        acceptsChildren: true,
        props: {
          background: { name: 'background', type: { name: 'string' }, required: false, tokenGroup: 'colors' },
        },
      },
    },
  }

  it('getRegistrySpec attaches real token names to a tokenGroup prop', () => {
    const panel = getRegistrySpec(MANIFEST).find((c) => c.type === 'Panel')!
    const background = panel.props.find((p) => p.name === 'background')!
    expect(background.tokenNames).toEqual(['brand', 'ink'])
  })

  it('both prompts spell out the token names, not just "string"', () => {
    const planner = buildPlannerPrompt(MANIFEST)
    const system = buildSystemPrompt('tool', MANIFEST)
    for (const prompt of [planner, system]) {
      expect(prompt).toContain('brand')
      expect(prompt).toContain('ink')
      expect(prompt).toContain('lg')
    }
    expect(system).toMatch(/background: a token name, one of \[brand, ink\]/)
  })
})
