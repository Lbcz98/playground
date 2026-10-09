/** Where focus may be on a level: `focus.single` and `level.initial-focus`, decided once for the three readers. */
import { describe, expect, it } from 'vitest'
import { DTV_SCREEN_LAYERS } from '../design-system/screen-layers'
import { focusFindings } from './focus-rule'

const level = (n: number) => DTV_SCREEN_LAYERS.levels.find((l) => l.level === n)
const on = (...components: string[]) => components.map((component) => ({ component }))
const rules = (...args: Parameters<typeof focusFindings>) => focusFindings(...args).map((f) => f.ruleId)

describe('focus.single', () => {
  it('two focused elements break it, on any level', () => {
    expect(rules(on('InteractivityButton', 'InteractivityButton'), level(2))).toEqual(['focus.single'])
  })
  it('nothing focused breaks it, except on level 0 (the clean broadcast) — and on a screen whose level is unknown it still does', () => {
    expect(rules([], level(1))).toEqual(['focus.single'])
    expect(rules([], undefined)).toEqual(['focus.single'])
    expect(rules([], level(0))).toEqual([])
    expect(rules(on('AlertBug', 'Notification'), level(0))).toEqual(['focus.single'])
  })
})

describe('level.initial-focus', () => {
  it('a focus on a component the level does not start on breaks it, naming the ones in the wrong place', () => {
    const card = { component: 'ContentCard', at: 'line 9' }
    expect(focusFindings([card], level(2))).toEqual([{ ruleId: 'level.initial-focus', code: 'wrong', wrong: [card] }])
    expect(rules(on('InteractivityButton'), level(2))).toEqual([])
    expect(rules(on('MainMenu'), level(1))).toEqual([])
  })
  it('level 3 is entered on the back button; the card it accepts holds the focus only once the viewer moved there inside the level', () => {
    expect(rules(on('RoundedButton'), level(3), { entered: true })).toEqual([])
    expect(rules(on('ContentCard'), level(3), { entered: true })).toEqual(['level.initial-focus'])
    expect(rules(on('ContentCard'), level(3), { entered: false })).toEqual([])
    // A reader that cannot tell (one screen, not a walk) takes the card as a state the viewer moved to.
    expect(rules(on('ContentCard'), level(3))).toEqual([])
  })
  it('a level that names the value its start component takes holds the focus to it', () => {
    const named = { ...level(1)!, initialFocus: { ...level(1)!.initialFocus!, value: 'program' } }
    expect(rules([{ component: 'MainMenu', value: 'program' }], named)).toEqual([])
    expect(rules([{ component: 'MainMenu', value: 'login' }], named)).toEqual(['level.initial-focus'])
  })
  it('nothing focused while the start component is on screen: said when the reader knows what is on screen', () => {
    expect(focusFindings([], level(2), { present: new Set(['InteractivityButton']) })).toEqual([
      { ruleId: 'focus.single', focused: [] },
      { ruleId: 'level.initial-focus', code: 'nothing-focused' },
    ])
    expect(rules([], level(2))).toEqual(['focus.single'])
    expect(rules([], level(1), { present: new Set(['Text']) })).toEqual(['focus.single'])
  })
  it('a level that requires its start component, with none on screen: said when the reader knows what is on screen', () => {
    const text = { present: new Set(['Text']) }
    expect(focusFindings([], level(3), text)).toContainEqual({ ruleId: 'level.initial-focus', code: 'missing' })
    expect(rules([], level(3))).toEqual(['focus.single'])
    // Home does not require its menu.
    expect(rules([], level(1), text)).toEqual(['focus.single'])
  })
  it('a declared deviation covers the pattern, never the law', () => {
    expect(rules(on('ContentCard'), level(2), { declared: true })).toEqual([])
    expect(rules(on('ContentCard', 'InteractivityButton'), level(2), { declared: true })).toEqual(['focus.single'])
  })
})
