import { describe, expect, it } from 'vitest'
import { allocateLines, defaultLines, type TechnicalSheetField } from './technicalSheetLines'

// Measured in the prototype: 20px lines, 4px between fields. `avail` is the card's height
// minus padding, title and gap: 94 at the standard About height (177px), 54 for a 1-line
// synopsis (137px), 74 for 2 lines (157px), 111 for a 2-line title (194px).
const linesFor = (avail: number) => (visible: number) => Math.floor((avail - Math.max(0, visible - 1) * 4) / 20)
const STANDARD = linesFor(94)
const field = (label: TechnicalSheetField, need: number) => ({ label, need })

describe('allocateLines', () => {
  it('gives the cast the room it needs when it fits', () => {
    expect(allocateLines([field('Direção', 1), field('Elenco', 2)], STANDARD)).toEqual([1, 2])
  })

  it('caps a field at 2 lines and the cast at 3, ending in truncation', () => {
    expect(allocateLines([field('Direção', 1), field('Elenco', 5)], STANDARD)).toEqual([1, 3])
    expect(allocateLines([field('Direção', 3), field('Elenco', 5)], STANDARD)).toEqual([2, 2])
  })

  it('applies the same caps to a single field', () => {
    expect(allocateLines([field('Elenco', 12)], STANDARD)).toEqual([3])
    expect(allocateLines([field('Direção', 12)], STANDARD)).toEqual([2])
  })

  it('breaks ties by priority: cast, directors, screen writers, author, art director', () => {
    expect(allocateLines([field('Direção', 2), field('Elenco', 3), field('Roteiro', 2)], STANDARD)).toEqual([1, 2, 1])
    expect(allocateLines([field('Direção', 2), field('Elenco', 1), field('Roteiro', 2)], STANDARD)).toEqual([2, 1, 1])
    expect(allocateLines([field('Direção artística', 2), field('Elenco', 1), field('Autor', 2)], STANDARD)).toEqual([1, 1, 2])
  })

  it('keeps the cast visible when four fields share four lines', () => {
    const lines = allocateLines(
      [field('Direção', 2), field('Direção artística', 1), field('Elenco', 6), field('Roteiro', 3)],
      STANDARD,
    )
    expect(lines).toEqual([1, 1, 1, 1])
  })

  it('hides the lowest-priority fields when there is not a line for each', () => {
    const short = linesFor(54)
    expect(allocateLines([field('Direção', 1), field('Elenco', 2), field('Roteiro', 1)], short)).toEqual([1, 1, 0])
    expect(
      allocateLines([field('Direção', 2), field('Direção artística', 1), field('Elenco', 6), field('Autor', 2)], short),
    ).toEqual([1, 0, 1, 0])
    expect(
      allocateLines([field('Direção', 2), field('Direção artística', 1), field('Elenco', 6), field('Roteiro', 3)], linesFor(74)),
    ).toEqual([1, 0, 1, 1])
  })

  it('shows a field again when hiding another frees its gap', () => {
    // 64px: three fields would need 3 lines + 2 gaps = 68px, two fields leave 3 lines.
    const lines = allocateLines([field('Direção', 1), field('Elenco', 1), field('Roteiro', 1)], linesFor(64))
    expect(lines.reduce((sum, n) => sum + n, 0)).toBeLessThanOrEqual(linesFor(64)(lines.filter(Boolean).length))
    expect(lines[1]).toBeGreaterThan(0)
  })

  it('uses a taller card for more lines', () => {
    expect(allocateLines([field('Direção', 3), field('Elenco', 8)], linesFor(111))).toEqual([2, 3])
    expect(allocateLines([field('Direção', 1), field('Elenco', 8), field('Roteiro', 1)], linesFor(111))).toEqual([1, 3, 1])
  })

  it('never hides the cast, even with no room at all', () => {
    expect(allocateLines([field('Direção', 1), field('Elenco', 4)], () => 0)).toEqual([0, 1])
  })

  it('starts from the caps before the card is measured', () => {
    expect(defaultLines('Elenco')).toBe(3)
    expect(defaultLines('Direção')).toBe(2)
    expect(defaultLines('Direção artística')).toBe(2)
  })
})
