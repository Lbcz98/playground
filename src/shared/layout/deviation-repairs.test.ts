/** Phase 9D: the pipeline's two pre-validation repairs leave a declared pattern alone — and only that. */
import { describe, expect, it } from 'vitest'
import { restStrayFocus, stretchRoots } from './frame'
import { SCREENFLOW_MANIFEST as M } from '@/shared/design-system/screenflow-manifest'
import { homeTemplate } from '@/shared/templates/home'

type Doc = Record<string, any>
const dev = (ruleId: string) => ({ ruleId, why: 'the request asks for it' })
const home = (): Doc => structuredClone(homeTemplate.blueprint) as unknown as Doc

const misaligned = (deviation?: unknown, where: 'root' | 'screen' = 'root'): Doc => {
  const doc = home()
  doc.root.props = { ...doc.root.props, align: 'start' }
  if (deviation && where === 'root') doc.root.deviation = deviation
  if (deviation && where === 'screen') doc.screen.deviation = [deviation]
  return doc
}
/** A rail card focused on Home, where focus starts on the main menu. */
const strayFocus = (deviation?: unknown): Doc => {
  const doc = home()
  doc.root.children[0].children[0].children[0].props = { title: 'Um', interactionState: 'focus' }
  if (deviation) doc.root.deviation = deviation
  return doc
}

describe('stretchRoots', () => {
  it('stretches a root in Faithful mode, declared or not', () => {
    expect(stretchRoots(misaligned(dev('layout.root-align')), M)).toHaveLength(1)
    expect(stretchRoots(misaligned(dev('layout.root-align')), M, 'faithful')).toHaveLength(1)
  })

  it('leaves it when an Exploratory screen declares layout.root-align — on the root or on the screen', () => {
    expect(stretchRoots(misaligned(dev('layout.root-align')), M, 'exploratory')).toEqual([])
    expect(stretchRoots(misaligned(dev('layout.root-align'), 'screen'), M, 'exploratory')).toEqual([])
  })

  it('still stretches when the declaration is another pattern, a law, or invalid', () => {
    for (const declared of [dev('layout.no-static-center'), dev('frame.layout'), dev('layout.invented'), { ruleId: 'layout.root-align' }]) {
      expect(stretchRoots(misaligned(declared), M, 'exploratory'), JSON.stringify(declared)).toHaveLength(1)
    }
  })

  it('judges each screen on its own declaration', () => {
    const doc = { ...misaligned(dev('layout.root-align')), screens: [{ id: 'b', screen: home().screen, root: { type: 'Stack', props: { align: 'end' } } }] }
    expect(stretchRoots(doc, M, 'exploratory')).toHaveLength(1) // only the second screen, which declares nothing
  })
})

describe('restStrayFocus', () => {
  it('rests a stray focus in Faithful mode, declared or not', () => {
    expect(restStrayFocus(strayFocus(dev('level.initial-focus')), M, 'faithful')).toHaveLength(1)
    expect(restStrayFocus(strayFocus(), M, 'exploratory')).toHaveLength(1)
  })

  it('leaves it when an Exploratory screen declares level.initial-focus', () => {
    expect(restStrayFocus(strayFocus(dev('level.initial-focus')), M, 'exploratory')).toEqual([])
  })

  it('still rests it for another pattern or a law', () => {
    for (const declared of [dev('layout.root-align'), dev('focus.single')]) {
      expect(restStrayFocus(strayFocus(declared), M, 'exploratory'), JSON.stringify(declared)).toHaveLength(1)
    }
  })
})
