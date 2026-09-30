/** Phase 9D: the QA checklist shows a declared break apart from the failures — and only a declared pattern. */
import { describe, expect, it } from 'vitest'
import { auditFrameLayout, summarizeChecks, type FrameCheck } from './frame'
import { treeDeclarations } from '@/shared/design-system/deviations'
import { interpretBlueprint } from '@/interpreter/interpret'
import { SCREENFLOW_MANIFEST as M } from '@/shared/design-system/screenflow-manifest'
import { homeTemplate } from '@/shared/templates/home'
import type { CanvasNode } from '@/model/nodeTree'

const dev = (ruleId: string) => ({ ruleId, why: 'the request asks for it' })

/** An interpreted Exploratory screen whose root is statically centered, declared. */
function centered(): CanvasNode {
  const doc = { ...structuredClone(homeTemplate.blueprint), mode: 'exploratory' } as Record<string, any>
  doc.root.props = { ...doc.root.props, justify: 'center' }
  doc.root.deviation = dev('layout.no-static-center')
  const r = interpretBlueprint(doc)
  if (!r.ok) throw new Error(r.error)
  return r.tree
}

const audit = (tree: CanvasNode, declared = true) =>
  auditFrameLayout({ root: tree }, M, undefined, declared ? treeDeclarations(tree, tree.screen) : [])
const focusCheck = (checks: FrameCheck[]) => checks.find((c) => c.id === 'focus')!

describe('a declared break in the QA checklist', () => {
  it('is listed as declared, not as a failure, and the check is neither a pass nor a fail', () => {
    const checks = audit(centered())
    expect(focusCheck(checks)).toMatchObject({ ok: true, problems: [] })
    expect(focusCheck(checks).declared).toHaveLength(1)
    expect(focusCheck(checks).declared[0]).toMatch(/justify "center" statically centers the master layout/)
    expect(summarizeChecks(checks)).toEqual({ passed: 4, total: 5, failing: 0, declared: 1 })
  })

  it('reads "5/6 · 1 declared" once the canvas adds its render check', () => {
    const withRender: FrameCheck[] = [...audit(centered()), { id: 'render', label: 'Render', ok: true, problems: [], declared: [] }]
    expect(summarizeChecks(withRender)).toEqual({ passed: 5, total: 6, failing: 0, declared: 1 })
  })

  it('is a plain failure when nothing declares it', () => {
    const checks = audit(centered(), false)
    expect(focusCheck(checks).ok).toBe(false)
    expect(focusCheck(checks).declared).toEqual([])
    expect(summarizeChecks(checks)).toMatchObject({ passed: 4, failing: 1, declared: 0 })
  })

  it('a different pattern declared covers nothing', () => {
    const tree = centered()
    tree.deviation = dev('layout.root-align')
    expect(focusCheck(audit(tree)).ok).toBe(false)
  })

  it('a declaration on another node does not cover a break at the root', () => {
    const tree = centered()
    delete tree.deviation
    tree.children[0].deviation = dev('layout.no-static-center')
    expect(focusCheck(audit(tree)).ok).toBe(false)
  })

  it('the screen’s own declaration covers it', () => {
    const tree = centered()
    delete tree.deviation
    tree.screen = { ...tree.screen!, deviation: [dev('layout.no-static-center')] }
    expect(focusCheck(audit(tree))).toMatchObject({ ok: true, problems: [] })
  })

  it('a law is never shown as declared, whatever is declared', () => {
    const tree = centered()
    tree.props = { ...tree.props, padding: 'lg' } // the root adds margin inside the frame's own: a law
    const checks = auditFrameLayout({ root: tree }, M, undefined, [
      ...treeDeclarations(tree, tree.screen),
      { ...dev('frame.layout'), path: ['root'], scope: 'node', at: ['root', 'deviation'] },
    ])
    const margins = checks.find((c) => c.id === 'margins')!
    expect(margins.ok).toBe(false)
    expect(margins.declared).toEqual([])
  })

  it('without declarations the checklist is exactly what it was', () => {
    const checks = auditFrameLayout({ root: centered() }, M)
    expect(checks.every((c) => c.declared.length === 0)).toBe(true)
    expect(focusCheck(checks).ok).toBe(false)
  })
})
