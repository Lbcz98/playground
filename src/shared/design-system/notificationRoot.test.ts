/**
 * Level 0: the notification is always in the top-right corner (UI Kit › Camadas e profundidade › Camadas,
 * 6441:15738), so its stack starts at the top of the frame; every other level-0 screen still ends at the bottom.
 * The model carries it as data (`allowsRootStart`), read by the validator, the layout check and the interpreter.
 */
import { describe, expect, it } from 'vitest'
import { interpretPrototype } from '@/interpreter/interpret'
import { alertTemplate } from '@/shared/templates/alert'
import { auditFrameLayout } from '@/shared/layout/frame'
import { validateBlueprintAgainstManifest } from './manifest-zod'
import { DTV_SCREEN_LAYERS } from './screen-layers'
import { SCREENFLOW_MANIFEST as M } from './screenflow-manifest'

type Doc = Record<string, any>
const notification = (justify: 'start' | 'end'): Doc => ({
  version: 1,
  screen: { model: 'notification', level: 0 },
  root: {
    type: 'Stack',
    props: { direction: 'vertical', justify, align: 'stretch', gap: 'sm', padding: 'none', grow: true },
    children: [
      {
        type: 'Stack',
        props: { direction: 'horizontal', justify: 'end', gap: 'sm' },
        children: [{ type: 'Notification', props: { kind: 'message', title: 'Gol!' } }],
      },
    ],
  },
})
const issues = (doc: Doc, mode: 'faithful' | 'exploratory') => {
  const v = validateBlueprintAgainstManifest(doc, M, mode)
  return v.ok ? [] : v.issues
}

describe('the level-0 notification starts at the top', () => {
  it('only the notification model carries the exemption', () => {
    expect(DTV_SCREEN_LAYERS.models.filter((m) => m.allowsRootStart).map((m) => m.id)).toEqual(['notification'])
  })

  it('justify "start" is valid in both modes, with nothing to declare', () => {
    expect(issues(notification('start'), 'faithful')).toEqual([])
    expect(issues(notification('start'), 'exploratory')).toEqual([])
  })

  it('justify "end" is now the break: Faithful rejects it and asks for "start"', () => {
    const found = issues(notification('end'), 'faithful')
    expect(found.map((i) => i.ruleId)).toEqual(['level.root-direction'])
    expect(found[0].message).toMatch(/start of the frame.*use "start"/)
  })

  it('declaring root-direction on a correct notification is a declaration for nothing', () => {
    const doc = notification('start')
    doc.screen.deviation = [{ ruleId: 'level.root-direction', why: 'it is top-right' }]
    expect(issues(doc, 'exploratory').map((i) => i.kind)).toEqual(['unused-deviation'])
  })

  it('the layout check agrees', () => {
    const failing = (d: Doc) => auditFrameLayout(d, M).flatMap((c) => c.problems)
    expect(failing(notification('start'))).toEqual([])
    expect(failing(notification('end')).join(' ')).toMatch(/use "start"/)
  })

  it('the interpreter puts a notification root at the top, and still puts an alert at the end', () => {
    const fixed = interpretPrototype(notification('end'))
    expect(fixed.ok && fixed.screens[0].tree.props.justify).toBe('start')
    const alert = structuredClone(alertTemplate.blueprint) as unknown as Doc
    alert.root.props.justify = 'start'
    const kept = interpretPrototype(alert)
    expect(kept.ok && kept.screens[0].tree.props.justify).toBe('end')
  })

  it('the alert (same level) is still held to the end', () => {
    const alert = structuredClone(alertTemplate.blueprint) as unknown as Doc
    expect(issues(alert, 'faithful')).toEqual([])
    alert.root.props.justify = 'start'
    expect(issues(alert, 'faithful').map((i) => i.ruleId)).toEqual(['level.root-direction'])
  })
})
