import { describe, expect, it } from 'vitest'
import { SCREEN_TEMPLATES, chooseTemplate, parseScreenModel, parseTemplateLine } from './index'

const PLAN = `Template: home
Screen: model "home", level 1 — the home screen.
1. Root Stack (vertical, justify end).`

describe('parseTemplateLine', () => {
  it('reads the id the planner named', () => {
    expect(parseTemplateLine(PLAN)).toBe('home')
    expect(parseTemplateLine('  template :  interactivity-cards-left  ')).toBe('interactivity-cards-left')
  })

  it('reads a refusal, and nothing when the line is absent', () => {
    expect(parseTemplateLine('Template: none\nScreen: …')).toBe('none')
    expect(parseTemplateLine('1. Root Stack')).toBeUndefined()
  })
})

describe('parseScreenModel', () => {
  it('reads the model off the screen line, quoted or not', () => {
    expect(parseScreenModel(PLAN)).toBe('home')
    expect(parseScreenModel('Screen: model alert, level 0')).toBe('alert')
  })
})

describe('chooseTemplate', () => {
  it('takes the template the planner named', () => {
    const choice = chooseTemplate(PLAN, SCREEN_TEMPLATES)
    expect(choice.template?.id).toBe('home')
    expect(choice.reason).toBe('named')
  })

  it('falls back to the planned screen model when no template is named', () => {
    const choice = chooseTemplate('Screen: model "alert", level 0 — a bug on the broadcast.', SCREEN_TEMPLATES)
    expect(choice.template?.id).toBe('alert')
    expect(choice.reason).toBe('model')
  })

  it('falls back to the model when the named template does not exist', () => {
    const choice = chooseTemplate('Template: dashboard\nScreen: model "home", level 1', SCREEN_TEMPLATES)
    expect(choice.template?.id).toBe('home')
    expect(choice.reason).toBe('model')
  })

  it('honours an explicit refusal when the model names no template either', () => {
    const choice = chooseTemplate('Template: none\n1. Root Stack', SCREEN_TEMPLATES)
    expect(choice.template).toBeUndefined()
    expect(choice.reason).toBe('none')
  })

  it('takes "none" at its word, even when the plan names a model a template covers', () => {
    // A screen can use the home layer model without being the home screen.
    const choice = chooseTemplate('Template: none\nScreen: model "home", level 1', SCREEN_TEMPLATES)
    expect(choice.template).toBeUndefined()
    expect(choice.reason).toBe('none')
  })

  it('offers nothing when the design system ships no templates', () => {
    expect(chooseTemplate(PLAN, []).reason).toBe('unavailable')
  })
})
