import { describe, expect, it } from 'vitest'
import { buildGlobalKernel, buildPlannerPrompt, buildSystemPrompt, getRegistrySpec } from './promptSpec'
import { CATALOG_TYPES, getCatalogEntry } from './catalog'
import { RENDER_TOOL_NAME } from '@/shared/blueprint'
import type { DesignSystemManifest } from '@/shared/design-system/manifest'
import { W3C_MANIFEST } from '@/shared/design-system/w3c-manifest'
import { TOKEN_LAYER_RULE, isCoreToken } from '@/shared/design-system/manifest'

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
  it('opens the Generator prompt with the five global laws, every number from the frame constants', () => {
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
      '### 5. TOKEN LAYERS — THE LAYER RULE',
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

  it('keeps primary actions in the content — the anchored group is a secondary cluster that never holds initial focus', () => {
    for (const prompt of [buildPlannerPrompt(), buildSystemPrompt('tool'), buildSystemPrompt('json')]) {
      expect(prompt).toContain("never the screen's primary actions")
      expect(prompt).toContain('an anchored element never holds initial focus')
    }
    // The planner's worked example must not anchor a primary button (a live run copied that).
    const planner = buildPlannerPrompt()
    expect(planner).not.toMatch(/— anchored[^\n]*\n\s*\d+\.\s+Primary button/)
    expect(planner).toMatch(/Primary button: "Create account"\.\n\d+\.\s+Help Stack \(horizontal, gap sm\) — anchored/)
  })

  it('always targets the 1280×720 base — the upscale is the engine’s job', () => {
    for (const prompt of [buildPlannerPrompt(), buildSystemPrompt('tool'), buildSystemPrompt('json')]) {
      expect(prompt).not.toContain('1920')
    }
  })
})

describe('design-system binding (§6)', () => {
  it('maps the laws onto the active system’s real names', () => {
    const system = buildSystemPrompt()
    expect(system).toContain('### 6. ACTIVE DESIGN SYSTEM — ScreenFlow (v1.0.0)')
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

describe('the layer rule (law 5)', () => {
  const prompts = (m?: DesignSystemManifest) => [buildPlannerPrompt(m), buildSystemPrompt('tool', m), buildSystemPrompt('json', m)]

  it('is a global law, in the manifest’s own words, in every prompt', () => {
    for (const prompt of [...prompts(), ...prompts(W3C_MANIFEST)]) {
      expect(prompt).toContain('### 5. TOKEN LAYERS — THE LAYER RULE')
      expect(prompt).toContain(TOKEN_LAYER_RULE.core)
      expect(prompt).toContain(TOKEN_LAYER_RULE.semantic)
      expect(prompt).toContain(TOKEN_LAYER_RULE.layout)
      expect(prompt).toContain('A blueprint that names a core token or a raw value is rejected.')
    }
  })

  it('never offers a core token as a prop value', () => {
    const spec = getRegistrySpec(W3C_MANIFEST)
    for (const component of spec) {
      for (const prop of component.props) {
        for (const name of [...(prop.tokenNames ?? []), ...(prop.options ?? [])]) {
          expect(name.startsWith('core-') || name.startsWith('opacity-'), `${component.type}.${prop.name}: ${name}`).toBe(false)
        }
      }
    }
    const system = buildSystemPrompt('tool', W3C_MANIFEST)
    for (const line of system.split('\n').filter((l) => l.includes('a token name, one of'))) {
      const names = line.slice(line.indexOf('[') + 1, line.indexOf(']')).split(', ')
      for (const name of names) {
        for (const group of ['colors', 'spacing', 'radius'] as const) {
          expect(isCoreToken(W3C_MANIFEST, group, name), line).toBe(false)
        }
      }
    }
  })

  it('labels the vocabulary by tier and names the core families it forbids', () => {
    const system = buildSystemPrompt('tool', W3C_MANIFEST)
    expect(system).toMatch(/colors — semantic \[semantic-theme-day-dark, /)
    expect(system).toMatch(/spacing — layout scale \[spacing-core-none = 0px, /)
    expect(system).toMatch(/radius — semantic \[radius-semantic-pill, /)
    expect(system).toMatch(/This system's \d+ core tokens \(core-\*, opacity-\*\) are never assigned\./)
    expect(system).not.toMatch(/colors — semantic \[[^\]]*core-neutral-white/)
  })

  it('translates the core values the model reaches for — white text is text-primary', () => {
    for (const prompt of [buildPlannerPrompt(W3C_MANIFEST), buildSystemPrompt('tool', W3C_MANIFEST)]) {
      expect(prompt).toContain('`core-neutral-white` → `semantic-functional-text-primary`')
    }
    expect(buildPlannerPrompt(W3C_MANIFEST)).toContain('never by its look')
  })

  it('adds no layer lines for a system without a core tier', () => {
    expect(buildSystemPrompt()).not.toContain('**Layer rule:**')
    expect(buildSystemPrompt()).not.toContain('**Core → semantic:**')
  })
})
