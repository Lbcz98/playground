/** Phase 9F: the deviation report — every declared, undeclared and unused deviation on one screen. */
import { describe, expect, it } from 'vitest'
import { deviationReport } from './deviationReport'
import { SCREENFLOW_MANIFEST } from './screenflow-manifest'
import { homeTemplate } from '@/shared/templates/home'

type Doc = Record<string, any>
const M = SCREENFLOW_MANIFEST
const home = (): Doc => structuredClone(homeTemplate.blueprint) as unknown as Doc
const dev = (ruleId: string, why = 'the request asks for it') => ({ ruleId, why })
const report = (doc: Doc) => deviationReport(doc.root, doc.screen, M)

/** Home with its root pushed off `align: stretch` — one pattern broken (`layout.root-align`). */
const breaksRootAlign = (): Doc => {
  const doc = home()
  doc.root.props = { ...doc.root.props, align: 'start' }
  return doc
}

describe('deviationReport', () => {
  it('a screen that keeps every pattern has nothing to report', () => {
    expect(report(home())).toEqual([])
  })

  it('a break declared on its node is declared, with the why and the model as origin', () => {
    const doc = breaksRootAlign()
    doc.root.deviation = dev('layout.root-align', 'o menu fica à esquerda')
    expect(report(doc)).toEqual([
      { ruleId: 'layout.root-align', scope: 'node', why: 'o menu fica à esquerda', status: 'declared', origin: 'model', path: ['root'] },
    ])
  })

  it('a break declared on the screen is declared at screen scope', () => {
    const doc = breaksRootAlign()
    doc.screen.deviation = [dev('layout.root-align')]
    expect(report(doc)).toEqual([
      { ruleId: 'layout.root-align', scope: 'screen', why: 'the request asks for it', status: 'declared', origin: 'model', path: [] },
    ])
  })

  it('a break nobody declared is undeclared, scoped where it would have to be declared', () => {
    const [entry, ...rest] = report(breaksRootAlign())
    expect(rest).toEqual([])
    expect(entry).toMatchObject({ ruleId: 'layout.root-align', scope: 'screen', status: 'undeclared', origin: 'model', path: ['root', 'props', 'align'] })
    expect(entry.why).toBeUndefined()
    expect(entry.message).toMatch(/align/)
    expect(entry.message).not.toMatch(/declare it/)
  })

  it('a declaration nothing breaks is unused', () => {
    const doc = home()
    doc.root.deviation = dev('layout.root-align')
    expect(report(doc)).toEqual([
      { ruleId: 'layout.root-align', scope: 'node', why: 'the request asks for it', status: 'unused', origin: 'model', path: ['root'] },
    ])
  })

  it('a declaration of another rule covers nothing: the break stays undeclared and the declaration unused', () => {
    const doc = breaksRootAlign()
    doc.root.deviation = dev('layout.no-static-center')
    expect(report(doc).map((e) => `${e.ruleId}:${e.status}`).sort()).toEqual(['layout.no-static-center:unused', 'layout.root-align:undeclared'])
  })

  it('a declaration that is not valid (a law) is never counted as declared', () => {
    const doc = home()
    doc.screen.deviation = [dev('tokens.only')]
    expect(report(doc)).toMatchObject([{ ruleId: 'tokens.only', scope: 'screen', status: 'unused' }])
  })

  it('a law broken on the screen is not a deviation, so it is not in the report', () => {
    const doc = home()
    doc.root.props = { ...doc.root.props, gap: '#ff0000' }
    expect(report(doc)).toEqual([])
  })
})
