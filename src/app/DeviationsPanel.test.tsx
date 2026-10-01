/** Phase 9F: the Deviations panel lists what the report says, grouped by status, and points at the node. */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { makeNode } from '@/model/nodeTree'
import type { DeviationEntry } from '@/shared/design-system/deviationReport'
import { SCREENFLOW_MANIFEST as M } from '@/shared/design-system/screenflow-manifest'
import { DeviationList, nodeIdAtPath } from './DeviationsPanel'

const entry = (over: Partial<DeviationEntry>): DeviationEntry => ({
  ruleId: 'layout.root-align',
  scope: 'node',
  status: 'declared',
  origin: 'model',
  path: ['root'],
  why: 'o menu fica à esquerda',
  ...over,
})
const html = (entries: DeviationEntry[], exploratory = true) =>
  renderToStaticMarkup(<DeviationList entries={entries} manifest={M} exploratory={exploratory} onSelect={() => {}} />)

describe('DeviationList', () => {
  it('says so when the screen keeps every pattern', () => {
    expect(html([])).toContain('No deviations')
  })

  it('says a Faithful screen has none to list', () => {
    expect(html([], false)).toContain('Faithful')
  })

  it('shows each entry under its status, with the rule title, the scope and the why', () => {
    const out = html([
      entry({}),
      entry({ ruleId: 'layout.no-static-center', status: 'unused', scope: 'screen', path: [], why: 'centro' }),
      entry({ status: 'undeclared', why: undefined, path: ['root', 'props', 'align'], message: 'the root does not stretch' }),
    ])
    expect(out).toMatch(/Declared.*Undeclared.*Unused/s)
    expect(out).toContain('Root with align: stretch')
    expect(out).toContain('layout.root-align')
    expect(out).toContain('o menu fica à esquerda')
    expect(out).toContain('the root does not stretch')
    expect(out).toContain('screen')
    expect(out).toContain('data-status="undeclared"')
  })

  it('leaves out a status with nothing in it', () => {
    const out = html([entry({})])
    expect(out).toContain('Declared')
    expect(out).not.toContain('Undeclared')
    expect(out).not.toContain('Unused')
  })
})

describe('nodeIdAtPath', () => {
  const tree = makeNode('Stack', {}, [makeNode('Stack', {}, [makeNode('Text')]), makeNode('Text')])

  it('walks the children indices, ignoring where a prop sits on the node', () => {
    expect(nodeIdAtPath(tree, ['root'])).toBe(tree.id)
    expect(nodeIdAtPath(tree, ['root', 'children', 0, 'children', 0])).toBe(tree.children[0].children[0].id)
    expect(nodeIdAtPath(tree, ['root', 'children', 1, 'props', 'text'])).toBe(tree.children[1].id)
  })

  it('a screen-level entry points at the root; a path that left the tree stops at the last node it reached', () => {
    expect(nodeIdAtPath(tree, [])).toBe(tree.id)
    expect(nodeIdAtPath(tree, ['root', 'children', 7])).toBe(tree.id)
  })
})
