import { describe, expect, it } from 'vitest'
import { buildPlannerPrompt, buildSystemPrompt, getRegistrySpec } from './promptSpec'
import { CATALOG_TYPES, getCatalogEntry } from './catalog'
import { RENDER_TOOL_NAME } from '@/shared/blueprint'

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
