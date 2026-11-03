export type TechnicalSheetField = 'Elenco' | 'Direção' | 'Roteiro' | 'Autor' | 'Direção artística'

/** Who gets lines first: cast, directors, screen writers, author, art director. */
export const FIELD_PRIORITY: readonly TechnicalSheetField[] = ['Elenco', 'Direção', 'Roteiro', 'Autor', 'Direção artística']

/** Every field shows at most 2 lines; the cast can take a 3rd from leftover room. */
export const LINE_CAP = 2
export const CAST_LINE_CAP = 3

export interface TechnicalSheetMeasure {
  label: TechnicalSheetField
  /** Lines the full value needs at the current width (fractional, as measured). */
  need: number
}

/** Lines used before the card has been measured (and when it has no paired card to size against). */
export function defaultLines(label: TechnicalSheetField): number {
  return label === 'Elenco' ? CAST_LINE_CAP : LINE_CAP
}

/**
 * Shares the card's line budget between its fields. Returns lines per field, in the order
 * given; 0 means the field is hidden.
 *
 * `linesFor(visible)` is how many text lines fit when `visible` fields are shown (the gap
 * between fields costs height once per boundary, so fewer fields leave more lines).
 *
 * 1. Show as many fields as can have one line each, highest priority first.
 * 2. Give each a first line, then a second line to the ones that need it, by priority.
 * 3. Cast only: a third line from whatever is left.
 * The cast is always shown, even when it gets a single line.
 */
export function allocateLines(
  fields: readonly TechnicalSheetMeasure[],
  linesFor: (visible: number) => number,
): number[] {
  const order = fields.map((_, i) => i).sort((a, b) => FIELD_PRIORITY.indexOf(fields[a].label) - FIELD_PRIORITY.indexOf(fields[b].label))
  let visible = 1
  for (let v = fields.length; v >= 1; v--) {
    if (linesFor(v) >= v) {
      visible = v
      break
    }
  }
  let left = Math.max(linesFor(visible), 1)
  const shown = order.slice(0, visible)
  const lines = fields.map(() => 0)
  const needed = (i: number) => Math.ceil(fields[i].need - 0.01)

  for (const i of shown) {
    if (left > 0) {
      lines[i] = 1
      left -= 1
    }
  }
  for (const i of shown) {
    if (left > 0 && lines[i] === 1 && needed(i) > 1) {
      lines[i] = LINE_CAP
      left -= 1
    }
  }
  const cast = fields.findIndex((field) => field.label === 'Elenco')
  if (cast >= 0 && left > 0 && lines[cast] === LINE_CAP && needed(cast) > LINE_CAP) {
    lines[cast] = CAST_LINE_CAP
  }
  return lines
}
