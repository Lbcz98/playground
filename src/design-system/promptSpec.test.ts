import { describe, expect, it } from 'vitest'
import { buildGlobalKernel, buildPlannerPrompt, buildSystemPrompt, getRegistrySpec } from './promptSpec'
import { CATALOG_TYPES, getCatalogEntry } from './catalog'
import { RENDER_TOOL_NAME } from '@/shared/blueprint'
import type { DesignSystemManifest } from '@/shared/design-system/manifest'
import { W3C_MANIFEST } from '@/shared/design-system/w3c-manifest'

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

describe('global kernel', () => {
  it('opens the Generator prompt with the four global laws, every number from the frame constants', () => {
    for (const system of [buildSystemPrompt('tool'), buildSystemPrompt('json')]) {
      expect(system.startsWith(buildGlobalKernel())).toBe(true)
    }
    const kernel = buildGlobalKernel()
    expect(kernel.startsWith('You are an expert UI Engineering Agent.')).toBe(true)
    for (const heading of [
      '### 1. BLUEPRINT JSON FORMAT & TOKENS',
      '### 2. THE SPATIAL PHYSICS & EXCEPTIONS',
      '### 3. MACRO-LAYOUT & 1280×720 CANVAS BOUNDARIES',
      '### 4. COMPONENT REGISTRY STRICTNESS',
    ]) {
      expect(kernel).toContain(heading)
    }
    expect(kernel).toContain('raw pixel values (e.g., `16px`)')
    expect(kernel).toContain('a multiple of 8 (e.g., 8, 16, 24, 32, 40, 48, 64)')
    expect(kernel).toContain('`4px` (half-step) and `12px` (1.5 step)')
    expect(kernel).toContain('the 4px/12px exceptions')
    expect(kernel).toContain('the engine will handle the upscale switch')
    expect(kernel).toContain('**1280px by 720px**')
    expect(kernel).toContain('**32px margin**')
    expect(kernel).toContain('exactly **16px**')
    expect(kernel).toContain('Master layouts do not use static center alignment.')
  })

  it('stays design-system agnostic', () => {
    const kernel = buildGlobalKernel()
    for (const specific of ['ScreenFlow', '<Stack>', 'padding "none"', 'gap "md"']) {
      expect(kernel).not.toContain(specific)
    }
  })

  it('never asks the model to declare a focus side — the engine reads it', () => {
    for (const prompt of [buildPlannerPrompt(), buildSystemPrompt('tool'), buildSystemPrompt('json')]) {
      expect(prompt).not.toMatch(/focus: '(left|right)'|"focus"/)
      expect(prompt).toContain('you never declare a focus side')
      expect(prompt).toContain('"anchor": true')
      expect(prompt).toMatch(/\*\*Bottom-Right\*\*.*\*\*Left\*\* margin/)
    }
  })

  it('always targets the 1280×720 base — the upscale is the engine’s job', () => {
    for (const prompt of [buildPlannerPrompt(), buildSystemPrompt('tool'), buildSystemPrompt('json')]) {
      expect(prompt).not.toContain('1920')
    }
  })
})

describe('design-system binding (§5)', () => {
  it('maps the laws onto the active system’s real names', () => {
    const system = buildSystemPrompt()
    expect(system).toContain('### 5. ACTIVE DESIGN SYSTEM — ScreenFlow (v1.0.0)')
    expect(system).toMatch(/outermost <Stack> sets padding "none"/)
    expect(system).toMatch(/set gap "md"/)
    expect(system).toMatch(/never sets align or justify to "center"/)
    expect(system).not.toContain('"frame"')
    expect(buildPlannerPrompt()).toMatch(/outermost <Stack> sets padding "none"/)

    const w3c = buildSystemPrompt('tool', W3C_MANIFEST)
    expect(w3c).toMatch(/outermost <Container> sets padding "spacing-core-none"/)
    expect(w3c).toMatch(/outermost <Container> is never centered/)
  })

  it('shows spacing sizes and leaves off-grid steps out of an imported system’s vocabulary', () => {
    const system = buildSystemPrompt('tool', W3C_MANIFEST)
    expect(system).not.toContain('spacing-core-md')
    expect(system).toContain('spacing-core-xs = 12px')
    expect(system).toContain('spacing-core-3xs = 4px')
  })
})
