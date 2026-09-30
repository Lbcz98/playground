/** Phase 9D: a declared deviation is drawn as a dashed brand outline while editing, and nowhere else. */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { NodeRenderer, DEVIATION_OUTLINE } from './NodeRenderer'
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
