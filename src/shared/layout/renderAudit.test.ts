import { describe, expect, it } from 'vitest'
import { auditRender, type RenderMeasurement } from './renderAudit'

const frame = { width: 1280, height: 720 }
const node = (over: Partial<RenderMeasurement['nodes'][number]>) => ({
  id: 'n1',
  type: 'ContentCard',
  top: 100,
  left: 100,
  width: 200,
  height: 200,
  ...over,
})
const text = (over: Partial<RenderMeasurement['texts'][number]>) => ({
  text: 'Título',
  top: 100,
  left: 100,
  width: 60,
  height: 20,
  ...over,
})

describe('auditRender — problems only the real render can show', () => {
  it('passes a clean screen', () => {
    expect(auditRender({ frame, nodes: [node({})], texts: [text({})] })).toEqual([])
  })

  it('catches a node that runs past the frame edge', () => {
    const cases = [
      node({ left: -10 }),
      node({ top: -10 }),
      node({ left: 1200, width: 200 }), // right edge at 1400 > 1280
      node({ top: 700, height: 100 }), // bottom edge at 800 > 720
    ]
    for (const n of cases) {
      expect(auditRender({ frame, nodes: [n], texts: [] }).join()).toMatch(/runs past the edge/)
    }
  })

  it('does not flag a node that exactly fills the frame — sub-pixel rounding is not an overflow', () => {
    expect(auditRender({ frame, nodes: [node({ top: 0, left: 0, width: 1280.3, height: 719.8 })], texts: [] })).toEqual([])
  })

  it('catches text squeezed to a sliver by too small a container', () => {
    const problems = auditRender({ frame, nodes: [], texts: [text({ text: 'Estatísticas', width: 1 })] })
    expect(problems.join()).toMatch(/"Estatísticas" has been squeezed/)
  })

  it('ignores a genuinely empty text run — nothing was squeezed', () => {
    expect(auditRender({ frame, nodes: [], texts: [text({ text: '', width: 0 })] })).toEqual([])
  })

  it('reports rows a card cuts off once per card, counted — not the frame edge they hide past', () => {
    const card = { ownerId: 'card', ownerType: 'ContentCard', top: 104, left: 960, width: 288, height: 456 }
    const rows = Array.from({ length: 20 }, (_, i) =>
      node({ id: `r${i}`, type: 'TableCell', top: 200 + i * 34, left: 984, width: 240, height: 28, clip: card }),
    )
    const problems = auditRender({ frame, nodes: rows, texts: [] })
    // Rows from y=200 in 34px steps: the card's bottom edge (560) falls after the 10th.
    expect(problems).toEqual([
      '<ContentCard> fits 10 <TableCell>s and cuts off 10 — keep it to 10, or move the rest onto another screen. That count is for the card as built: a taller header or an added footer leaves room for fewer.',
    ])
  })

  it('ignores text its container hides — the viewer never sees it overlap anything', () => {
    const card = { ownerId: 'card', ownerType: 'ContentCard', top: 100, left: 100, width: 200, height: 100 }
    const hidden = text({ text: 'Time 20', top: 600, left: 120, width: 60, height: 16, clip: card })
    const below = text({ text: 'Voltar', top: 602, left: 130, width: 60, height: 16 })
    expect(auditRender({ frame, nodes: [], texts: [hidden, below] })).toEqual([])
  })

  it('catches two text runs overlapping', () => {
    const a = text({ text: 'Bruno Henrique', top: 100, left: 100, width: 100, height: 16 })
    const b = text({ text: 'Placar: 1 x 0', top: 105, left: 150, width: 100, height: 16 })
    expect(auditRender({ frame, nodes: [], texts: [a, b] }).join()).toMatch(/"Bruno Henrique" overlaps "Placar: 1 x 0"/)
  })

  it('does not flag text merely adjacent, or a collapsed run touching another', () => {
    const a = text({ text: 'A', top: 100, left: 100, width: 40, height: 16 })
    const b = text({ text: 'B', top: 100, left: 141, width: 40, height: 16 }) // 1px gap
    expect(auditRender({ frame, nodes: [], texts: [a, b] })).toEqual([])
    // A collapsed run reports its own problem, not a spurious overlap with its neighbor.
    const collapsed = text({ text: 'C', top: 100, left: 100, width: 1, height: 16 })
    const beside = text({ text: 'D', top: 100, left: 100, width: 40, height: 16 })
    const problems = auditRender({ frame, nodes: [], texts: [collapsed, beside] })
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/"C" has been squeezed/)
  })

  it('catches any container that paints a background over the whole frame, not only the root', () => {
    const covering = node({ type: 'Stack', top: 32, left: 32, width: 1216, height: 656, paints: true })
    expect(auditRender({ frame, nodes: [covering], texts: [] }).join()).toMatch(/<Stack> paints a background over the whole frame/)
  })

  it('lets a card paint its own surface, and a covering container that paints nothing', () => {
    const card = node({ paints: true, width: 320, height: 272 })
    const stack = node({ type: 'Stack', top: 32, left: 32, width: 1216, height: 656, paints: false })
    expect(auditRender({ frame, nodes: [card, stack], texts: [] })).toEqual([])
  })
})
