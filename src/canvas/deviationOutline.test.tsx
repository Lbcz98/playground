/** Phase 9D: a declared deviation is drawn as a dashed brand outline while editing, and nowhere else. */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { NodeRenderer, DEVIATION_OUTLINE, marksOffPattern } from './NodeRenderer'
import { NodeModeContext, type NodeMode } from './nodeMode'
import { makeNode } from '@/model/nodeTree'

const html = (mode: NodeMode, deviation: boolean): string => {
  const node = makeNode('Stack')
  if (deviation) node.deviation = { ruleId: 'layout.root-align', why: 'the request asks for it' }
  return renderToStaticMarkup(
    <NodeModeContext.Provider value={mode}>
      <NodeRenderer node={node} />
    </NodeModeContext.Provider>,
  )
}

describe('the deviation outline', () => {
  it('replaces outline-none with the dashed brand outline on a node that declares one, while editing', () => {
    const out = html('edit', true)
    for (const cls of DEVIATION_OUTLINE.split(' ')) expect(out).toContain(cls)
    expect(out).not.toContain('outline-none')
    expect(out).toContain('data-deviation="layout.root-align"')
  })

  it('leaves a node with no deviation exactly as before', () => {
    const out = html('edit', false)
    expect(out).toContain('outline-none')
    expect(out).not.toMatch(/outline-dashed|outline-brand|data-deviation/)
  })

  it('draws nothing in Play or in a thumbnail', () => {
    for (const mode of ['play', 'inert'] as const) {
      const out = html(mode, true)
      expect(out, mode).not.toMatch(/outline-dashed|outline-brand|data-deviation/)
    }
  })

  it('uses only the theme: the brand color, no raw value', () => {
    expect(DEVIATION_OUTLINE).toContain('outline-brand')
    expect(DEVIATION_OUTLINE).not.toMatch(/#|\dpx|\[/)
  })
})

describe('the Exploratory vocabulary on the canvas (9E)', () => {
  const render = (type: string, props: Record<string, unknown>, deviation?: { ruleId: string; why: string }) => {
    const node = makeNode(type, props)
    if (deviation) node.deviation = deviation
    return renderToStaticMarkup(
      <NodeModeContext.Provider value="edit">
        <NodeRenderer node={node} />
      </NodeModeContext.Provider>,
    )
  }

  it('a primitive carries the dashed outline while editing, with no deviation of its own', () => {
    const out = render('primitive:Text', { text: 'GOL!' })
    for (const cls of DEVIATION_OUTLINE.split(' ')) expect(out).toContain(cls)
    expect(out).not.toContain('data-deviation')
    expect(out).toContain('GOL!')
  })

  it('a Proposal keeps its own dotted placeholder, never the dashed outline, even though it declares a deviation', () => {
    const out = render('Proposal', { description: 'Placar', proposedApi: { homeScore: 'number' } }, { ruleId: 'registry.new-component', why: 'x' })
    expect(out).toContain('border-dotted')
    expect(out).not.toContain('outline-dashed')
    expect(out).toContain('data-deviation="registry.new-component"')
  })

  it('marksOffPattern: deviation or primitive, never a Proposal', () => {
    expect(marksOffPattern(makeNode('Stack'))).toBe(false)
    expect(marksOffPattern(makeNode('primitive:Box'))).toBe(true)
    const declared = makeNode('Stack')
    declared.deviation = { ruleId: 'layout.root-align', why: 'x' }
    expect(marksOffPattern(declared)).toBe(true)
    const proposal = makeNode('Proposal')
    proposal.deviation = { ruleId: 'registry.new-component', why: 'x' }
    expect(marksOffPattern(proposal)).toBe(false)
  })
})

