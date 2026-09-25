import { describe, expect, it } from 'vitest'
import {
  buildGlobalKernel,
  buildPlannerPrompt,
  buildSystemPrompt,
  getRegistrySpec,
  templatesFor,
} from './promptSpec'
import { SCREEN_TEMPLATES } from '@/shared/templates'
import { SCREENFLOW_MANIFEST } from '@/shared/design-system/screenflow-manifest'
import { CATALOG_TYPES, getCatalogEntry } from './catalog'
import { RENDER_TOOL_NAME } from '@/shared/blueprint'
import type { DesignSystemManifest } from '@/shared/design-system/manifest'
import { W3C_MANIFEST } from '@/shared/design-system/w3c-manifest'
import { TOKEN_TIER_RULE, isCoreToken } from '@/shared/design-system/manifest'
import { DTV_SCREEN_LAYERS } from '@/shared/design-system/screen-layers'

describe('registry spec / system prompt', () => {
  it('describes every catalog component and no others', () => {
    const spec = getRegistrySpec()
    expect(spec.map((c) => c.type).sort()).toEqual([...CATALOG_TYPES].sort())
  })

  it('lists every prop with its allowed values', () => {
    const stack = getRegistrySpec().find((c) => c.type === 'Stack')!
    const gap = stack.props.find((p) => p.name === 'gap')!
    expect(gap.control).toBe('select')
    expect(gap.options).toContain('sm')
    expect(gap.default).toBe('sm')
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
  it('opens the Generator prompt with the six global laws, every number from the frame constants', () => {
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
      '### 5. TOKEN TIERS',
      '### 6. SCREEN LAYERS — THE LAYER RULE (CAMADAS)',
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
      // A focus SIDE is the engine's to read. An element's own focus STATE is the
      // model's to set — exactly one of them — so `interactionState "focus"` is
      // expected here and only a side must never appear.
      expect(prompt).not.toMatch(/focus(Side)?["']?\s*[:=]\s*["']?(left|right|neutral)\b/i)
      expect(prompt).toContain('you never declare a focus side')
      expect(prompt).toContain('"anchor": true')
      expect(prompt).toMatch(/\*\*Bottom-Right\*\*.*\*\*Left\*\* margin/)
    }
  })

  it('states the one-focus rule in the active system\u2019s own prop names', () => {
    for (const prompt of [buildPlannerPrompt(), buildSystemPrompt('tool')]) {
      expect(prompt).toContain('a TV screen has exactly one focused element')
      expect(prompt).toContain('interactionState "focus"')
      expect(prompt).toContain('focusedItem "none"')
      // The trap a live run fell into: MainMenu arrives focused unless told otherwise.
      expect(prompt).toMatch(/<MainMenu> focuses its "channel-bug" unless you set focusedItem "none"/)
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
    expect(planner).toMatch(/Primary button: "Start watching" — first focusable, so it holds initial focus\.\n\d+\.\s+Help Stack \(horizontal, gap sm\) — anchored/)
  })

  it('always targets the 1280×720 base — the upscale is the engine’s job', () => {
    for (const prompt of [buildPlannerPrompt(), buildSystemPrompt('tool'), buildSystemPrompt('json')]) {
      expect(prompt).not.toContain('1920')
    }
  })
})

describe('reference screens in the planner prompt', () => {
  it('lists every template with when to use it, and asks for the choice by id', () => {
    const planner = buildPlannerPrompt()
    expect(planner).toContain('# Reference screens')
    for (const template of SCREEN_TEMPLATES) {
      expect(planner).toContain(`- ${template.id} — ${template.name}. ${template.when}`)
    }
    expect(planner).toMatch(/Template: <id>, or "Template: none"/)
    expect(planner).toMatch(/First the template line, then the screen line/)
  })

  it('offers none of them to an imported design system that ships none', () => {
    const imported = { ...SCREENFLOW_MANIFEST, id: 'acme', name: 'Acme', templates: undefined }
    expect(templatesFor(imported)).toEqual([])
    expect(buildPlannerPrompt(imported)).not.toContain('# Reference screens')
  })

  it('lists an imported design system\'s own templates, same as the built-in ones', () => {
    const template = {
      id: 'acme-home',
      name: 'Acme Home',
      when: 'The Acme home screen — a menu on the left, content on the right.',
      blueprint: { version: 1 as const, root: { type: 'Stack' as const } },
    }
    const imported = { ...SCREENFLOW_MANIFEST, id: 'acme', name: 'Acme', templates: [template] }
    expect(templatesFor(imported)).toEqual([template])
    const planner = buildPlannerPrompt(imported)
    expect(planner).toContain('# Reference screens')
    expect(planner).toContain(`- ${template.id} — ${template.name}. ${template.when}`)
  })
})

describe('design-system binding (§7)', () => {
  it('maps the laws onto the active system’s real names', () => {
    const system = buildSystemPrompt()
    expect(system).toContain('### 7. ACTIVE DESIGN SYSTEM — ScreenFlow (v1.0.0)')
    expect(system).toMatch(/outermost <Stack> sets padding "none"/)
    expect(system).toMatch(/set gap "sm"/)
    expect(system).toMatch(/never sets justify to "center"/)
    expect(system).toMatch(/keeps align "stretch"/)
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

describe('the token tier rule (law 5)', () => {
  const prompts = (m?: DesignSystemManifest) => [buildPlannerPrompt(m), buildSystemPrompt('tool', m), buildSystemPrompt('json', m)]

  it('is a global law, in the manifest’s own words, in every prompt', () => {
    for (const prompt of [...prompts(), ...prompts(W3C_MANIFEST)]) {
      expect(prompt).toContain('### 5. TOKEN TIERS')
      expect(prompt).toContain(TOKEN_TIER_RULE.core)
      expect(prompt).toContain(TOKEN_TIER_RULE.semantic)
      expect(prompt).toContain(TOKEN_TIER_RULE.layout)
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
    expect(system).toMatch(/colors — semantic \[semantic-theme-noite-dark, /)
    expect(system).toMatch(/spacing — layout scale \[spacing-core-none = 0px, /)
    expect(system).toMatch(/radius — semantic \[radius-semantic-pill, /)
    // Gradients are tiered too: their core families (primary-*, overlay-*…) are listed with the colours'.
    expect(system).toMatch(/This system's \d+ core tokens \(core-\*, opacity-\*, primary-\*[^)]*overlay-\*\) are never assigned\./)
    expect(system).not.toMatch(/colors — semantic \[[^\]]*core-neutral-white/)
  })

  it('translates the core values the model reaches for — white text is text-primary', () => {
    for (const prompt of [buildPlannerPrompt(W3C_MANIFEST), buildSystemPrompt('tool', W3C_MANIFEST)]) {
      expect(prompt).toContain('`core-neutral-white` → `semantic-functional-text-primary`')
    }
    expect(buildPlannerPrompt(W3C_MANIFEST)).toContain('never by its look')
  })

  it('adds no token tier lines for a system without a core tier', () => {
    expect(buildSystemPrompt()).not.toContain('**Token tiers:**')
    expect(buildSystemPrompt()).not.toContain('**Core → semantic:**')
  })
})

describe('the layer rule (law 6, Camadas)', () => {
  const prompts = (m?: DesignSystemManifest) => [buildPlannerPrompt(m), buildSystemPrompt('tool', m), buildSystemPrompt('json', m)]

  it('is a global law in every prompt: video → overlay → content, one model per screen', () => {
    for (const prompt of [...prompts(), ...prompts(W3C_MANIFEST)]) {
      expect(prompt).toContain('### 6. SCREEN LAYERS — THE LAYER RULE (CAMADAS)')
      expect(prompt).toContain('**video → overlay → content**')
      expect(prompt).toContain('"screen": { "model": "<model id>", "level": <navigation level> }')
      expect(prompt).toContain(DTV_SCREEN_LAYERS.rule)
    }
  })

  it('lists every level and every model with its level, side and shades', () => {
    const system = buildSystemPrompt()
    for (const level of DTV_SCREEN_LAYERS.levels) expect(system).toContain(`  - ${level.level} · ${level.name} — `)
    expect(system).toContain('  - 2 · Trilho focado — ')
    expect(system).toContain('Shows at most 1 content module; may anchor one cluster.')
    for (const model of DTV_SCREEN_LAYERS.models) expect(system).toContain(`  - "${model.id}" — ${model.name} · level ${model.level}`)
    expect(system).toContain('"interactivity-cards-right" — Interatividades · Cards Direita · level 3 · right side · shades scrim + bottom-right + right.')
    expect(system).toContain('"home" — Home · level 1 · spans the frame · shades scrim + bottom + bottom-right + bottom-left.')
  })

  it('names the root props that obey it in the active system', () => {
    const system = buildSystemPrompt()
    expect(system).toContain('under a right model the outermost <Stack> sets align "end"; under a left model, align "start" (a horizontal <Stack>: justify).')
    expect(system).toContain('the outermost <Stack> sets surface "none"')
    // The generic Container can't place or clear itself, so those lines are left out.
    const w3c = buildSystemPrompt('tool', W3C_MANIFEST)
    expect(w3c).not.toContain('**Content side:**')
    expect(w3c).not.toContain('**Transparent content layer:**')
    expect(w3c).toContain('**Layer models (screen.model):**')
  })

  it('makes "screen" part of the output contract and of the plan', () => {
    for (const mode of ['tool', 'json'] as const) {
      const system = buildSystemPrompt(mode)
      expect(system).toContain('"screen": { "model": "<layer model id>", "level": <that model\'s level> }')
      expect(system).toContain('The document has exactly three\nfields: "version", "screen" and "root" (plus "id"/"name" for the first screen and "screens" when the\nrequest asks for several screens).')
    }
    expect(buildPlannerPrompt()).toContain('Screen: model "home", level 1 — ')
  })

  it('follows a manifest that declares its own models', () => {
    const custom: DesignSystemManifest = {
      ...W3C_MANIFEST,
      screenLayers: {
        ...DTV_SCREEN_LAYERS,
        models: [{ id: 'poster-wall', name: 'Poster wall', level: 1, shades: ['scrim'], use: 'A wall of posters.' }],
      },
    }
    const system = buildSystemPrompt('tool', custom)
    expect(system).toContain('"poster-wall" — Poster wall · level 1')
    expect(system).not.toContain('"home" — Home')
  })
})

describe('law 4 — compose, don\'t assume', () => {
  it('keeps the property rule and frees composition under the other laws', () => {
    for (const mode of ['tool', 'json'] as const) {
      const system = buildSystemPrompt(mode)
      expect(system).toContain("Never use a prop the schema doesn't define")
      expect(system).toContain("Compose, don't assume. Treat the components as building blocks")
      expect(system).toContain('frame, token, layer and focus laws, which always win')
      expect(system).toContain('Never invent a component.')
    }
  })
})

describe('notes — telling the user what a law overrode', () => {
  it('the generator is asked for notes, and the planner for a Notes line', () => {
    for (const mode of ['tool', 'json'] as const) {
      const system = buildSystemPrompt(mode)
      expect(system).toContain('add up to 4 short sentences to "notes"')
      expect(system).toContain('a law overrode part of their request')
    }
    expect(buildPlannerPrompt()).toContain('end the plan with a "Notes:" line')
  })
})
